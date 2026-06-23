'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ChatRoomWithParticipants, Profile } from '@/types/database'
import { getChatRooms } from '../actions/chat-actions'
import { ChatSidebar } from './chat-sidebar'
import { ChatRoom } from './chat-room'
import { ChatEmptyState } from './chat-states'
import { createClient } from '@/lib/supabase/client'

interface ChatLayoutProps {
  currentProfile: Profile
}

export function ChatLayout({ currentProfile }: ChatLayoutProps) {
  const [rooms, setRooms] = useState<ChatRoomWithParticipants[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileRoomOpen, setIsMobileRoomOpen] = useState(false)
  const searchParams = useSearchParams()

  const supabase = createClient()

  const fetchRooms = useCallback(async () => {
    const result = await getChatRooms()
    if (result.data) setRooms(result.data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // Deep-link: auto-select room from ?room_id= query param after rooms are loaded
  useEffect(() => {
    const roomIdParam = searchParams.get('room_id')
    if (roomIdParam && rooms.length > 0) {
      const matchedRoom = rooms.find((r) => r.id === roomIdParam)
      if (matchedRoom) {
        setActiveRoomId(roomIdParam)
        setIsMobileRoomOpen(true)
      }
    }
  }, [searchParams, rooms])

  // Subscribe to real-time changes in chat_rooms for sidebar updates
  useEffect(() => {
    const channel = supabase
      .channel(`user-rooms:${currentProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
        },
        () => {
          fetchRooms()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchRooms()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, currentProfile.id, fetchRooms])

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId)
    setIsMobileRoomOpen(true)
  }

  const handleBack = () => {
    setIsMobileRoomOpen(false)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar – hidden on mobile when room is open */}
      <div
        className={`${
          isMobileRoomOpen ? 'hidden md:flex' : 'flex'
        } md:w-80 lg:w-96 w-full shrink-0 flex-col`}
      >
        <ChatSidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          currentUserId={currentProfile.id}
          isLoading={isLoading}
          onSelectRoom={handleSelectRoom}
          onRoomsChange={fetchRooms}
        />
      </div>

      {/* Chat Room Panel */}
      <div
        className={`${
          isMobileRoomOpen ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col min-w-0`}
      >
        {activeRoom ? (
          <ChatRoom
            room={activeRoom}
            currentUserId={currentProfile.id}
            currentProfile={{
              id: currentProfile.id,
              first_name: currentProfile.first_name,
              last_name: currentProfile.last_name,
            }}
            onBack={handleBack}
            onRoomUpdate={fetchRooms}
          />
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div>
  )
}
