'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  ArrowLeft,
  MoreVertical,
  Shield,
  AlertTriangle,
  Search,
  Phone,
  BadgeCheck,
  Archive,
  BellOff,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type {
  MessageWithAttachments,
  ChatRoomWithParticipants,
  Profile,
} from '@/types/database'
import { getMessages, markMessagesRead } from '../actions/chat-actions'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'
import { TypingIndicator, MessageLoadingState } from './chat-states'
import { ReportDialog, BlockDialog } from './chat-dialogs'
import { toast } from 'sonner'

interface ChatRoomProps {
  room: ChatRoomWithParticipants
  currentUserId: string
  currentProfile: Pick<Profile, 'id' | 'first_name' | 'last_name'>
  onBack?: () => void
  onRoomUpdate: () => void
}

export function ChatRoom({ room, currentUserId, currentProfile: _currentProfile, onBack, onRoomUpdate }: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageWithAttachments[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>()
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [reportTarget, setReportTarget] = useState<{ messageId: string; createdAt: string } | null>(null)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const otherParticipant = room.other_participant

  const loadMessages = useCallback(async (loadCursor?: string, prepend = false) => {
    if (prepend) setIsFetchingMore(true)
    else setIsLoading(true)

    const result = await getMessages(room.id, loadCursor, 30)

    if (prepend) setIsFetchingMore(false)
    else setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    const fetched = result.data || []

    if (prepend) {
      setMessages((prev) => [...fetched, ...prev])
      setHasMore(fetched.length === 30)
    } else {
      setMessages(fetched)
      setHasMore(fetched.length === 30)
      // Scroll to bottom on initial load
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
    }

    if (fetched.length > 0) {
      setCursor(fetched[0]?.created_at)
    }

    // Mark as read
    await markMessagesRead(room.id)
  }, [room.id])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`chat:${room.id}`)

    // Listen for new messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${room.id}`,
      },
      (payload) => {
        const newMsg = payload.new as MessageWithAttachments
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, { ...newMsg, attachments: [], sender: newMsg.sender }]
        })
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
        // Mark as read if from other user
        if (newMsg.sender_id !== currentUserId) {
          markMessagesRead(room.id)
          onRoomUpdate()
        }
      }
    )

    // Listen for message updates (recall, status change)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${room.id}`,
      },
      (payload) => {
        const updatedMsg = payload.new as MessageWithAttachments
        setMessages((prev) =>
          prev.map((m) =>
            m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m
          )
        )
      }
    )

    // Listen for typing events via broadcast
    channel.on('broadcast', { event: 'typing' }, (payload: { payload: { userId: string; isTyping: boolean } }) => {
      const { userId, isTyping } = payload.payload
      if (userId === currentUserId) return
      setTypingUsers((prev) => {
        const next = new Set(prev)
        if (isTyping) next.add(userId)
        else next.delete(userId)
        return next
      })
    })

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room.id, currentUserId, supabase, onRoomUpdate])

  // Infinite scroll – load older messages when user scrolls to top
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const handleScroll = () => {
      if (container.scrollTop < 80 && hasMore && !isFetchingMore && cursor) {
        loadMessages(cursor, true)
      }
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, isFetchingMore, cursor, loadMessages])

  const handleTyping = async (isTyping: boolean) => {
    const channel = supabase.channel(`chat:${room.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping },
    })
  }

  const handleReport = (messageId: string, createdAt: string) => {
    setReportTarget({ messageId, createdAt })
  }

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        m.status !== 'recalled'
      )
    : messages

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-rose-500">
            {otherParticipant?.avatar_url ? (
              <Image
                src={otherParticipant.avatar_url}
                alt={otherParticipant.first_name}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {otherParticipant?.first_name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          {otherParticipant?.is_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
          )}
        </div>

        {/* Name + Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold font-heading text-zinc-900 dark:text-white truncate">
              {otherParticipant
                ? `${otherParticipant.first_name} ${otherParticipant.last_name}`
                : 'Unknown User'}
            </h3>
            {otherParticipant?.is_verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            )}
            {otherParticipant?.is_premium && (
              <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40">
                PRO
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {typingUsers.size > 0 ? (
              <span className="text-[#E91E63] italic">typing...</span>
            ) : (
              'Online'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Search messages"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Voice call (coming soon)"
            onClick={() => toast.info('Voice calls coming soon!')}
          >
            <Phone className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-10 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 min-w-[170px]">
                <button
                  type="button"
                  onClick={() => { setShowOptions(false); toast.info('Archives updated') }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Archive className="h-3.5 w-3.5" /> Archive Chat
                </button>
                <button
                  type="button"
                  onClick={() => { setShowOptions(false); toast.info('Muted') }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <BellOff className="h-3.5 w-3.5" /> Mute Notifications
                </button>
                <button
                  type="button"
                  onClick={() => { setShowOptions(false); setShowBlockDialog(true) }}
                  className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2"
                >
                  <Shield className="h-3.5 w-3.5" /> Block User
                </button>
                <button
                  type="button"
                  onClick={() => { setShowOptions(false); if (otherParticipant) setReportTarget({ messageId: '', createdAt: '' }) }}
                  className="w-full px-3 py-2 text-left text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-2"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Report User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="px-4 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
            />
          </div>
          {searchQuery && (
            <p className="text-[10px] text-zinc-400 mt-1">
              {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isFetchingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-[#E91E63] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isLoading ? (
          <MessageLoadingState />
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            {searchQuery ? (
              <p className="text-sm text-zinc-400">No messages match your search</p>
            ) : (
              <>
                <div className="text-3xl mb-2">🌸</div>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Say hello!</p>
                <p className="text-xs text-zinc-400 mt-1">Send a respectful introduction to begin your conversation.</p>
              </>
            )}
          </div>
        ) : (
          filteredMessages.map((message, idx) => {
            const isOwn = message.sender_id === currentUserId
            const prevMessage = filteredMessages[idx - 1]
            const showAvatar = !isOwn && (
              !prevMessage ||
              prevMessage.sender_id !== message.sender_id ||
              new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 120000
            )

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwn}
                showAvatar={showAvatar}
                onReport={(msgId, createdAt) => handleReport(msgId, createdAt)}
              />
            )
          })
        )}

        {typingUsers.size > 0 && (
          <TypingIndicator userName={otherParticipant?.first_name} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        roomId={room.id}
        onMessageSent={() => {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          onRoomUpdate()
        }}
        onTyping={handleTyping}
      />

      {/* Dialogs */}
      {otherParticipant && (
        <>
          <ReportDialog
            open={!!reportTarget}
            onOpenChange={(open) => { if (!open) setReportTarget(null) }}
            reportedId={otherParticipant.id}
            reportedName={`${otherParticipant.first_name} ${otherParticipant.last_name}`}
            roomId={room.id}
            messageId={reportTarget?.messageId || undefined}
            messageCreatedAt={reportTarget?.createdAt || undefined}
          />
          <BlockDialog
            open={showBlockDialog}
            onOpenChange={setShowBlockDialog}
            targetUserId={otherParticipant.id}
            targetName={`${otherParticipant.first_name} ${otherParticipant.last_name}`}
            onConfirm={onRoomUpdate}
          />
        </>
      )}
    </div>
  )
}
