'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Search,
  Pin,
  BellOff,
  Archive,
  MoreVertical,
  CheckCheck,
  Heart,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ChatRoomWithParticipants } from '@/types/database'
import { toggleArchiveRoom, toggleMuteRoom, togglePinRoom } from '../actions/chat-actions'
import { ChatLoadingState } from './chat-states'

interface ChatSidebarProps {
  rooms: ChatRoomWithParticipants[]
  activeRoomId: string | null
  currentUserId: string
  isLoading: boolean
  onSelectRoom: (roomId: string) => void
  onRoomsChange: () => void
}

function formatRoomTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return date.toLocaleDateString('en-IN', { weekday: 'short' })
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function getLastMessagePreview(room: ChatRoomWithParticipants, currentUserId: string): string {
  const msg = room.last_message
  if (!msg) return 'Start your conversation'
  if (msg.status === 'recalled') return 'Message recalled'
  if (msg.message_type === 'image') return '📷 Photo'
  if (msg.message_type === 'document') return '📄 Document'
  if (msg.message_type === 'voice_message') return '🎙️ Voice Message'
  const isMine = msg.sender_id === currentUserId
  return isMine ? `You: ${msg.content}` : msg.content
}

interface RoomContextMenuProps {
  room: ChatRoomWithParticipants
  currentUserId: string
  isPinned: boolean
  isMuted: boolean
  onClose: () => void
  onRoomsChange: () => void
}

function RoomContextMenu({ room, currentUserId: _currentUserId, isPinned, isMuted, onClose, onRoomsChange }: RoomContextMenuProps) {
  const handlePin = async () => {
    const res = await togglePinRoom(room.id, !isPinned)
    if (res.error) toast.error(res.error)
    else { toast.success(isPinned ? 'Unpinned' : 'Pinned'); onRoomsChange() }
    onClose()
  }
  const handleMute = async () => {
    const res = await toggleMuteRoom(room.id, !isMuted)
    if (res.error) toast.error(res.error)
    else { toast.success(isMuted ? 'Unmuted' : 'Muted'); onRoomsChange() }
    onClose()
  }
  const handleArchive = async () => {
    const res = await toggleArchiveRoom(room.id, true)
    if (res.error) toast.error(res.error)
    else { toast.success('Chat archived'); onRoomsChange() }
    onClose()
  }

  return (
    <div className="absolute right-2 top-8 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 min-w-[160px]">
      <button type="button" onClick={handlePin} className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2">
        <Pin className="h-3.5 w-3.5" />
        {isPinned ? 'Unpin' : 'Pin'} Chat
      </button>
      <button type="button" onClick={handleMute} className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2">
        <BellOff className="h-3.5 w-3.5" />
        {isMuted ? 'Unmute' : 'Mute'} Notifications
      </button>
      <button type="button" onClick={handleArchive} className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2">
        <Archive className="h-3.5 w-3.5" />
        Archive Chat
      </button>
    </div>
  )
}

export function ChatSidebar({
  rooms,
  activeRoomId,
  currentUserId,
  isLoading,
  onSelectRoom,
  onRoomsChange,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const filteredRooms = rooms.filter((room) => {
    if (!search.trim()) return true
    const other = room.other_participant
    if (!other) return false
    const name = `${other.first_name} ${other.last_name}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <aside className="w-full h-full flex flex-col border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-1.5 rounded-lg">
            <Heart className="h-4 w-4 text-white fill-white/30" />
          </div>
          <h2 className="text-base font-bold font-heading text-zinc-900 dark:text-white">Messages</h2>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ChatLoadingState />
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-pink-50 dark:bg-pink-950/20 p-4 rounded-full mb-3">
              <Heart className="h-7 w-7 text-pink-300 dark:text-pink-700" />
            </div>
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              {search ? 'No matching conversations' : 'No conversations yet'}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              {search ? 'Try a different name' : 'Connect with matches to start chatting'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100/60 dark:divide-zinc-800/60">
            {filteredRooms.map((room) => {
              const myParticipant = room.participants.find((p) => p.profile_id === currentUserId)
              const isPinned = myParticipant?.is_pinned || false
              const isMuted = myParticipant?.is_muted || false
              const isActive = room.id === activeRoomId
              const other = room.other_participant

              return (
                <li key={room.id} className="relative">
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      isActive
                        ? 'bg-pink-50 dark:bg-pink-950/20 border-r-2 border-[#E91E63]'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                        {other?.avatar_url ? (
                          <Image
                            src={other.avatar_url}
                            alt={other.first_name}
                            width={44}
                            height={44}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-white text-sm font-bold">
                            {other?.first_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      {other?.is_verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isPinned && <Pin className="h-3 w-3 text-zinc-400 shrink-0" />}
                          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {other ? `${other.first_name} ${other.last_name}` : 'Unknown User'}
                          </span>
                          {other?.is_premium && (
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40 shrink-0">
                              PRO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isMuted && <BellOff className="h-3 w-3 text-zinc-400" />}
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500" suppressHydrationWarning>
                            {room.last_message ? formatRoomTime(room.last_message.created_at) : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {getLastMessagePreview(room, currentUserId)}
                        </p>
                        {room.unread_count > 0 && (
                          <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-pink-500 to-rose-500 rounded-full px-1 shadow-sm">
                            {room.unread_count > 99 ? '99+' : room.unread_count}
                          </span>
                        )}
                        {room.unread_count === 0 && room.last_message?.sender_id === currentUserId && (
                          <CheckCheck className="h-3 w-3 text-[#E91E63] shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Context menu trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === room.id ? null : room.id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    aria-label="Room options"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {openMenuId === room.id && (
                    <RoomContextMenu
                      room={room}
                      currentUserId={currentUserId}
                      isPinned={isPinned}
                      isMuted={isMuted}
                      onClose={() => setOpenMenuId(null)}
                      onRoomsChange={onRoomsChange}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
