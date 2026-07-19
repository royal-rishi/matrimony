'use client'

// ============================================================
// REAL-TIME QUEUE MONITOR HOOK
// Subscribes to notification_queue changes via Supabase Realtime
// and runs updates for active UI displays.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QueueStats } from '../types/observability.types'

export function useRealtimeQueue(initialStats: QueueStats[] = []) {
  const [queueStats, setQueueStats] = useState<QueueStats[]>(initialStats)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString())

  useEffect(() => {
    const supabase = createClient()

    // Query callback to refresh queue stats
    const fetchQueueStats = async () => {
      try {
        const response = await fetch('/api/admin/notification/analytics?type=queue')
        const json = await response.json()
        if (json.success && json.data) {
          setQueueStats(json.data)
          setLastUpdated(new Date().toISOString())
        }
      } catch (err) {
        console.error('Error fetching queue status:', err)
      }
    }

    // Subscribe to database changes on the notification_queue table
    const channel = supabase
      .channel('realtime-queue-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_queue',
        },
        () => {
          fetchQueueStats()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Load initial stats once
    fetchQueueStats()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { queueStats, isConnected, lastUpdated }
}
