'use client'

// ============================================================
// REAL-TIME DELIVERY EVENTS LOG HOOK
// Appends new notification logs live to a sliding display window.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LiveDeliveryEvent } from '../types/observability.types'

export function useRealtimeEvents(initialEvents: LiveDeliveryEvent[] = []) {
  const [events, setEvents] = useState<LiveDeliveryEvent[]>(initialEvents)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Fetch initial list
    const fetchRecentLogs = async () => {
      try {
        const response = await fetch('/api/admin/notification/analytics?type=events&limit=50')
        const json = await response.json()
        if (json.success && json.data) {
          setEvents(json.data)
        }
      } catch (err) {
        console.error('Error fetching logs list:', err)
      }
    }

    // Subscribe to notification_logs INSERT statements
    const channel = supabase
      .channel('realtime-delivery-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
        },
        (payload) => {
          const newEvent: LiveDeliveryEvent = {
            id: payload.new.id,
            event: payload.new.event,
            channel: payload.new.channel,
            status: payload.new.status,
            provider: payload.new.provider,
            recipient: payload.new.recipient,
            createdAt: payload.new.created_at,
          }
          setEvents((prev) => [newEvent, ...prev].slice(0, 50))
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    fetchRecentLogs()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { events, isConnected }
}
