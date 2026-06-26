'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/types/database'

/**
 * Sends a matrimonial interest invitation to another user.
 * Fits into the existing matches table.
 */
export async function sendInterest(targetId: string) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Unauthorized session.' }

  if (user.id === targetId) return { error: 'Cannot send interest to yourself.' }

  const id1 = user.id < targetId ? user.id : targetId
  const id2 = user.id > targetId ? user.id : targetId

  // Check if a match/interest row already exists
  const { data: existingMatch } = await supabase
    .from('matches')
    .select('*')
    .eq('profile_id_1', id1)
    .eq('profile_id_2', id2)
    .maybeSingle()

  if (existingMatch) {
    if (existingMatch.status === 'rejected') {
      // Re-open declined interest
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'pending',
          initiated_by_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMatch.id)

      if (error) return { error: error.message }
      return { success: true, status: 'pending' }
    }
    return { error: 'An interest invite or connection already exists between you.' }
  }

  // Create new pending match request
  const { error } = await supabase
    .from('matches')
    .insert({
      profile_id_1: id1,
      profile_id_2: id2,
      status: 'pending',
      initiated_by_id: user.id,
      compatibility_score: 85.00, // mock compatibility score
      match_reasons: { reason: 'Matched by religion and locations' }
    })

  if (error) return { error: error.message }

  // Send a system notification to the target user
  try {
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single()

    await supabase
      .from('notifications')
      .insert({
        user_id: targetId,
        title: 'New Interest Invite Received',
        message: `${senderProfile?.first_name || 'A member'} has expressed interest in your matrimonial profile.`,
        type: 'interest',
        is_read: false
      })
  } catch (err) {
    console.error('Failed to trigger notification:', err)
  }

  revalidatePath('/matches')
  revalidatePath('/interests')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Responds to a received interest invite.
 */
export async function respondToInterest(matchId: string, status: 'accepted' | 'rejected') {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Unauthorized session.' }

  // Fetch the match
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle()

  if (!match) return { error: 'Interest request not found.' }

  // Verify that the user is the recipient of the interest (or at least part of the match)
  const isRecipient = match.initiated_by_id !== user.id
  if (!isRecipient && status === 'accepted') {
    return { error: 'Only the recipient can accept this interest invite.' }
  }

  const dbStatus = status === 'accepted' ? 'connected' : status
  const { error } = await supabase
    .from('matches')
    .update({
      status: dbStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId)

  if (error) return { error: error.message }

  // Trigger system actions on success
  try {
    const senderId = match.initiated_by_id
    const targetId = match.profile_id_1 === senderId ? match.profile_id_2 : match.profile_id_1
    const responderId = user.id
    const notifierId = responderId === senderId ? targetId : senderId

    const { data: responderProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', responderId)
      .single()

    await supabase
      .from('notifications')
      .insert({
        user_id: notifierId,
        title: status === 'accepted' ? 'Interest Accepted! 🎉' : 'Interest Declined',
        message: `${responderProfile?.first_name || 'A member'} has ${status} your interest invite.`,
        type: 'interest',
        is_read: false
      })

    // If accepted, unlock chat by opening a chat room automatically
    if (status === 'accepted') {
      const { data: room, error: _roomErr } = await supabase
        .from('chat_rooms')
        .insert({ type: 'user_to_user', created_by_id: user.id })
        .select()
        .single()

      if (room) {
        await supabase
          .from('chat_room_participants')
          .insert([
            { room_id: room.id, profile_id: user.id },
            { room_id: room.id, profile_id: notifierId }
          ])
      }
    }
  } catch (err) {
    console.error('Failed to trigger connection actions:', err)
  }

  revalidatePath('/interests')
  revalidatePath('/chat')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Toggles shortlist bookmark status for a target profile.
 */
export async function toggleShortlist(targetId: string, folder = 'Favorites', notes = '') {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Unauthorized session.' }

  // Check if already shortlisted
  const { data: existingShortlist } = await supabase
    .from('shortlists')
    .select('*')
    .eq('profile_id', user.id)
    .eq('shortlisted_profile_id', targetId)
    .maybeSingle()

  if (existingShortlist) {
    // Delete
    const { error } = await supabase
      .from('shortlists')
      .delete()
      .eq('id', existingShortlist.id)

    if (error) return { error: error.message }
    revalidatePath('/matches')
    return { success: true, shortlisted: false }
  } else {
    // Insert
    const { error } = await supabase
      .from('shortlists')
      .insert({
        profile_id: user.id,
        shortlisted_profile_id: targetId,
        folder,
        notes: notes || null
      })

    if (error) return { error: error.message }
    revalidatePath('/matches')
    return { success: true, shortlisted: true }
  }
}

/**
 * Logs a profile visit dynamically.
 */
export async function trackProfileVisit(visitedId: string) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return

  if (user.id === visitedId) return

  // Check existing log
  const { data: existingLog } = await supabase
    .from('profile_visitors')
    .select('*')
    .eq('profile_id', visitedId)
    .eq('visitor_id', user.id)
    .maybeSingle()

  if (existingLog) {
    await supabase
      .from('profile_visitors')
      .update({
        visit_count: (existingLog.visit_count || 1) + 1,
        last_visited_at: new Date().toISOString()
      })
      .eq('id', existingLog.id)
  } else {
    await supabase
      .from('profile_visitors')
      .insert({
        profile_id: visitedId,
        visitor_id: user.id,
        visit_count: 1,
        last_visited_at: new Date().toISOString()
      })
  }
}

/**
 * Fetches matrimony candidates filtered by specific tab feeds.
 */
export async function fetchMatches(category: string) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Unauthorized session.' }

  // 1. Get user profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'User profile not found.' }

  const oppositeGender = profile.gender === 'male' ? 'female' : 'male'

  // Build query based on category
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('gender', oppositeGender)
    .eq('is_deleted', false)

  if (category === 'recently_joined') {
    query = query.order('created_at', { ascending: false }).limit(20)
  } else if (category === 'near_you') {
    query = query.eq('state', profile.state).limit(20)
  } else if (category === 'verified') {
    query = query.eq('is_verified', true).limit(20)
  } else if (category === 'premium') {
    query = query.eq('is_premium', true).limit(20)
  } else if (category === 'saved') {
    // Join shortlists
    const { data: shortlists } = await supabase
      .from('shortlists')
      .select('shortlisted_profile_id')
      .eq('profile_id', user.id)

    const ids = shortlists?.map((s) => s.shortlisted_profile_id) || []
    if (ids.length === 0) return { data: [] }
    query = query.in('id', ids)
  } else {
    // 'recommended' - match religion and partner preferences age limits
    const prefs = profile.partner_preferences || {}
    const minAge = prefs.age_min || 18
    const maxAge = prefs.age_max || 55
    const minDob = new Date()
    minDob.setFullYear(minDob.getFullYear() - maxAge)
    const maxDob = new Date()
    maxDob.setFullYear(maxDob.getFullYear() - minAge)

    query = query
      .gte('date_of_birth', minDob.toISOString().split('T')[0])
      .lte('date_of_birth', maxDob.toISOString().split('T')[0])
      
    if (prefs.religion && prefs.religion !== 'Any') {
      query = query.eq('religion', prefs.religion)
    }
    if (prefs.state && prefs.state !== 'Any') {
      query = query.eq('state', prefs.state)
    }
    if (prefs.city && prefs.city !== 'Any') {
      query = query.ilike('city', `%${prefs.city}%`)
    }
    
    query = query.limit(20)
  }

  const { data, error } = await query

  if (error) return { error: error.message }
  return { data: data as Profile[] }
}

/**
 * Fetches the user's shortlisted profile IDs and matrimonial matching interactions.
 */
export async function getMyInteractionStatus() {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Unauthorized session.' }

  // Fetch shortlists
  const { data: shortlists } = await supabase
    .from('shortlists')
    .select('shortlisted_profile_id')
    .eq('profile_id', user.id)

  // Fetch matches involving the user
  const { data: matches } = await supabase
    .from('matches')
    .select('profile_id_1, profile_id_2, status, initiated_by_id')
    .or(`profile_id_1.eq.${user.id},profile_id_2.eq.${user.id}`)

  const shortlisted = shortlists?.map((s) => s.shortlisted_profile_id) || []
  
  // Pending sent interests (where user initiated and status is pending)
  const interestsSent = matches
    ?.filter((m) => m.initiated_by_id === user.id && m.status === 'pending')
    .map((m) => (m.profile_id_1 === user.id ? m.profile_id_2 : m.profile_id_1)) || []

  // Accepted connections (where status is accepted or connected)
  const connected = matches
    ?.filter((m) => m.status === 'accepted' || m.status === 'connected')
    .map((m) => (m.profile_id_1 === user.id ? m.profile_id_2 : m.profile_id_1)) || []

  return {
    shortlisted,
    interestsSent,
    connected
  }
}

/**
 * Fetches a specific profile by its Profile ID (UUID).
 */
export async function fetchProfileById(profileId: string) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Unauthorized session.' }

  const trimmedId = profileId.trim()
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(trimmedId)) {
    return { error: 'Invalid Profile ID format. Must be a valid UUID.' }
  }

  if (user.id === trimmedId) {
    return { error: 'Cannot search for your own Profile ID.' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', trimmedId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Profile not found with this ID.' }

  return { data: [data as Profile] }
}
