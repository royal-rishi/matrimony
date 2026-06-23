'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  sendMessageSchema,
  createChatRoomSchema,
  reportUserSchema,
  blockUserSchema,
  chatSettingsSchema,
  markReadSchema,
  recallMessageSchema,
  toggleArchiveSchema,
  type SendMessageInput,
  type CreateChatRoomInput,
  type ReportUserInput,
  type BlockUserInput,
  type ChatSettingsInput,
} from '../validators/chat-validators'
import type {
  ChatRoom,
  ChatRoomWithParticipants,
  Message,
  MessageWithAttachments,
  ChatSettings,
} from '@/types/database'

type ActionResult<T> = { data?: T; error?: string }

// ---- Helper: Verify auth and return userId ----
async function requireAuth(supabase: SupabaseClient): Promise<{ userId: string } | { error: string }> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Authentication required.' }
  return { userId: user.id }
}

// ---- Helper: Check if sender is blocked by recipient ----
async function isBlocked(supabase: SupabaseClient, blockerId: string, blockedId: string): Promise<boolean> {
  const { data } = await supabase
    .from('chat_blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle()
  return !!data
}

// ---- Helper: Basic profanity / contact-detail moderation ----
function moderateContent(content: string): { flagged: boolean; reason?: string } {
  // Block phone number patterns (basic)
  const phoneRegex = /(\+91|0)?[6-9]\d{9}/g
  if (phoneRegex.test(content)) {
    return { flagged: true, reason: 'Phone number detected. Share contact details only after verification.' }
  }
  // Block common email patterns
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  if (emailRegex.test(content)) {
    return { flagged: true, reason: 'Email address detected. Please respect platform communication guidelines.' }
  }
  // Block social media handles (WhatsApp, Instagram, etc.)
  const socialRegex = /\b(whatsapp|instagram|telegram|snapchat|facebook|fb\.com|t\.me)\b/i
  if (socialRegex.test(content)) {
    return { flagged: true, reason: 'External platform reference detected. Please keep conversations on Rishtajodo.' }
  }
  return { flagged: false }
}

/**
 * Get chat rooms for the current user with enriched data.
 */
export async function getChatRooms(): Promise<ActionResult<ChatRoomWithParticipants[]>> {
  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  try {
    // Fetch all room IDs the user participates in
    const { data: participantRows, error: partError } = await supabase
      .from('chat_room_participants')
      .select('room_id')
      .eq('profile_id', userId)

    if (partError) return { error: partError.message }
    if (!participantRows || participantRows.length === 0) return { data: [] }

    const roomIds = participantRows.map((p: { room_id: string }) => p.room_id)

    // Fetch rooms with participants and last messages
    const { data: rooms, error: roomsError } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_room_participants (
          *,
          profile:profiles (
            id, first_name, last_name, avatar_url, is_verified, is_premium, role
          )
        )
      `)
      .in('id', roomIds)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })

    if (roomsError) return { error: roomsError.message }

    // Fetch last message and unread count for each room
    const enriched: ChatRoomWithParticipants[] = await Promise.all(
      (rooms || []).map(async (room: ChatRoom & { chat_room_participants: unknown[] }) => {
        const { data: lastMsgData } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', room.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .eq('is_deleted', false)
          .neq('sender_id', userId)
          .not('id', 'in', `(
            select message_id from message_reads where profile_id = '${userId}'
          )`)

        const participants = room.chat_room_participants as (typeof room.chat_room_participants[0] & { profile: { id: string } })[]
        const otherParticipant = participants.find(
          (p) => p.profile?.id !== userId
        )

        return {
          ...room,
          participants: room.chat_room_participants,
          last_message: lastMsgData || null,
          unread_count: unreadCount || 0,
          other_participant: otherParticipant?.profile || null,
        } as unknown as ChatRoomWithParticipants
      })
    )

    // Sort pinned rooms to top
    enriched.sort((a, b) => {
      const aPinned = a.participants.some((p) => p.profile_id === userId && p.is_pinned)
      const bPinned = b.participants.some((p) => p.profile_id === userId && p.is_pinned)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      return 0
    })

    return { data: enriched }
  } catch (err) {
    console.error('[getChatRooms]', err)
    return { error: 'Failed to load chat rooms.' }
  }
}

/**
 * Get messages for a room with cursor-based pagination.
 */
export async function getMessages(
  roomId: string,
  cursor?: string,
  limit = 30
): Promise<ActionResult<MessageWithAttachments[]>> {
  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  // Verify participant
  const { data: participant } = await supabase
    .from('chat_room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('profile_id', userId)
    .maybeSingle()

  if (!participant) return { error: 'Access denied. You are not a participant of this chat.' }

  let query = supabase
    .from('messages')
    .select(`
      *,
      attachments:message_attachments (*),
      sender:profiles!messages_sender_id_fkey (
        id, first_name, last_name, avatar_url, is_verified, is_premium
      )
    `)
    .eq('room_id', roomId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) return { error: error.message }
  return { data: (data || []).reverse() as unknown as MessageWithAttachments[] }
}

/**
 * Create a new chat room between the current user and a recipient.
 * Enforces business rules: interest accepted, premium, or associate introduction.
 */
export async function createChatRoom(
  rawInput: CreateChatRoomInput
): Promise<ActionResult<ChatRoom>> {
  const validated = createChatRoomSchema.safeParse(rawInput)
  if (!validated.success) return { error: validated.error.issues[0]?.message }

  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { recipientId, type } = validated.data

  if (userId === recipientId) return { error: 'You cannot chat with yourself.' }

  // Check for existing room between these two users
  const { data: existingParticipant } = await supabase
    .from('chat_room_participants')
    .select('room_id')
    .eq('profile_id', userId)

  if (existingParticipant && existingParticipant.length > 0) {
    const myRoomIds = existingParticipant.map((p: { room_id: string }) => p.room_id)
    const { data: sharedRoom } = await supabase
      .from('chat_room_participants')
      .select('room_id')
      .eq('profile_id', recipientId)
      .in('room_id', myRoomIds)
      .maybeSingle()

    if (sharedRoom) {
      // Return existing room data
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', sharedRoom.room_id)
        .eq('is_deleted', false)
        .maybeSingle()
      if (room) return { data: room as ChatRoom }
    }
  }

  // Business rule: check access eligibility (user_to_user rooms only)
  if (type === 'user_to_user') {
    // Check if searcher is premium
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single()

    const isPremium = (myProfile as { is_premium: boolean } | null)?.is_premium || false

    if (!isPremium) {
      // Check for accepted match (connected status)
      const { data: connection } = await supabase
        .from('matches')
        .select('id')
        .eq('status', 'connected')
        .or(
          `and(profile_id_1.eq.${userId},profile_id_2.eq.${recipientId}),and(profile_id_1.eq.${recipientId},profile_id_2.eq.${userId})`
        )
        .maybeSingle()

      if (!connection) {
        return {
          error: 'Chat is only available after mutual interest acceptance or with a Premium membership.',
        }
      }
    }
  }

  // Check if sender is blocked by recipient
  const blocked = await isBlocked(supabase, recipientId, userId)
  if (blocked) return { error: 'You cannot start a chat with this user.' }

  // Create new room
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .insert({ type, created_by_id: userId })
    .select()
    .single()

  if (roomError || !room) return { error: roomError?.message || 'Failed to create chat room.' }

  // Add both participants
  const { error: partError } = await supabase
    .from('chat_room_participants')
    .insert([
      { room_id: room.id, profile_id: userId },
      { room_id: room.id, profile_id: recipientId },
    ])

  if (partError) return { error: partError.message }

  // Analytics event
  console.log('[PostHog] chat_started', { userId, recipientId, roomId: room.id, type })

  return { data: room as ChatRoom }
}

/**
 * Send a message in a chat room.
 */
export async function sendMessage(rawInput: SendMessageInput): Promise<ActionResult<Message>> {
  const validated = sendMessageSchema.safeParse(rawInput)
  if (!validated.success) return { error: validated.error.issues[0]?.message }

  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { roomId, content, messageType, metadata } = validated.data

  // Verify participant
  const { data: participant } = await supabase
    .from('chat_room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('profile_id', userId)
    .maybeSingle()

  if (!participant) return { error: 'Access denied. You are not a participant of this chat.' }

  // Get other participant to check blocks
  const { data: otherParticipants } = await supabase
    .from('chat_room_participants')
    .select('profile_id')
    .eq('room_id', roomId)
    .neq('profile_id', userId)

  if (otherParticipants && otherParticipants.length > 0) {
    for (const op of otherParticipants as { profile_id: string }[]) {
      const blocked = await isBlocked(supabase, op.profile_id, userId)
      if (blocked) return { error: 'You cannot send messages to this user.' }
    }
  }

  // Content moderation for text messages
  if (messageType === 'text') {
    const moderation = moderateContent(content)
    if (moderation.flagged) {
      return { error: moderation.reason || 'Message blocked by content moderation.' }
    }
  }

  // Insert message
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: userId,
      message_type: messageType,
      content,
      status: 'sent',
      metadata: metadata || null,
    })
    .select()
    .single()

  if (msgError || !message) return { error: msgError?.message || 'Failed to send message.' }

  // Update room updated_at for sidebar sorting
  await supabase
    .from('chat_rooms')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', roomId)

  // Analytics
  console.log('[PostHog] message_sent', { userId, roomId, messageType })

  return { data: message as Message }
}

/**
 * Recall (unsend) a message the current user sent.
 */
export async function recallMessage(messageId: string): Promise<ActionResult<boolean>> {
  const validated = recallMessageSchema.safeParse({ messageId })
  if (!validated.success) return { error: 'Invalid message ID.' }

  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { error } = await supabase
    .from('messages')
    .update({
      status: 'recalled',
      content: 'This message was recalled.',
      recalled_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', userId)

  if (error) return { error: error.message }
  return { data: true }
}

/**
 * Mark all unread messages in a room as read.
 */
export async function markMessagesRead(roomId: string): Promise<ActionResult<boolean>> {
  const validated = markReadSchema.safeParse({ roomId })
  if (!validated.success) return { error: 'Invalid room ID.' }

  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  // Update participant last_read_at
  await supabase
    .from('chat_room_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('profile_id', userId)

  return { data: true }
}

/**
 * Block a user. Archives any active shared chat rooms.
 */
export async function blockUser(rawInput: BlockUserInput): Promise<ActionResult<boolean>> {
  const validated = blockUserSchema.safeParse(rawInput)
  if (!validated.success) return { error: validated.error.issues[0]?.message }

  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { targetUserId } = validated.data

  const { error } = await supabase
    .from('chat_blocks')
    .insert({ blocker_id: userId, blocked_id: targetUserId })

  if (error && !error.message.includes('unique')) return { error: error.message }

  // Analytics
  console.log('[PostHog] user_blocked', { userId, targetUserId })

  return { data: true }
}

/**
 * Unblock a user.
 */
export async function unblockUser(targetUserId: string): Promise<ActionResult<boolean>> {
  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { error } = await supabase
    .from('chat_blocks')
    .delete()
    .eq('blocker_id', userId)
    .eq('blocked_id', targetUserId)

  if (error) return { error: error.message }
  return { data: true }
}

/**
 * Report a user with reason and optional message reference.
 */
export async function reportUser(rawInput: ReportUserInput): Promise<ActionResult<boolean>> {
  const validated = reportUserSchema.safeParse(rawInput)
  if (!validated.success) return { error: validated.error.issues[0]?.message }

  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { reportedId, roomId, messageId, messageCreatedAt, reason, description } = validated.data

  const { error } = await supabase.from('chat_reports').insert({
    reporter_id: userId,
    reported_id: reportedId,
    room_id: roomId || null,
    message_id: messageId || null,
    message_created_at: messageCreatedAt || null,
    reason,
    description: description || null,
  })

  if (error) return { error: error.message }

  // Analytics
  console.log('[PostHog] report_submitted', { userId, reportedId, reason })

  return { data: true }
}

/**
 * Toggle archive state for a chat room.
 */
export async function toggleArchiveRoom(
  roomId: string,
  archive: boolean
): Promise<ActionResult<boolean>> {
  const validated = toggleArchiveSchema.safeParse({ roomId, archive })
  if (!validated.success) return { error: 'Invalid parameters.' }

  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  if (archive) {
    const { error } = await supabase
      .from('chat_archives')
      .insert({ profile_id: userId, room_id: roomId })
    if (error && !error.message.includes('unique')) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('chat_archives')
      .delete()
      .eq('profile_id', userId)
      .eq('room_id', roomId)
    if (error) return { error: error.message }
  }

  return { data: true }
}

/**
 * Toggle mute state for a chat room participant.
 */
export async function toggleMuteRoom(
  roomId: string,
  mute: boolean
): Promise<ActionResult<boolean>> {
  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { error } = await supabase
    .from('chat_room_participants')
    .update({ is_muted: mute })
    .eq('room_id', roomId)
    .eq('profile_id', userId)

  if (error) return { error: error.message }
  return { data: true }
}

/**
 * Toggle pin state for a chat room.
 */
export async function togglePinRoom(
  roomId: string,
  pin: boolean
): Promise<ActionResult<boolean>> {
  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { error } = await supabase
    .from('chat_room_participants')
    .update({ is_pinned: pin, pinned_at: pin ? new Date().toISOString() : null })
    .eq('room_id', roomId)
    .eq('profile_id', userId)

  if (error) return { error: error.message }
  return { data: true }
}

/**
 * Update user's chat privacy settings.
 */
export async function updateChatSettings(rawInput: ChatSettingsInput): Promise<ActionResult<ChatSettings>> {
  const validated = chatSettingsSchema.safeParse(rawInput)
  if (!validated.success) return { error: validated.error.issues[0]?.message }

  const supabase = (await createClient()) as unknown as SupabaseClient

  const authResult = await requireAuth(supabase)
  if ('error' in authResult) return { error: authResult.error }
  const { userId } = authResult

  const { data, error } = await supabase
    .from('chat_settings')
    .upsert({
      profile_id: userId,
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: data as ChatSettings }
}
