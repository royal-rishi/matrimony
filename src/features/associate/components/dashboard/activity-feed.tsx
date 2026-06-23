'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Briefcase,
  UserCheck,
  Award,
  Calendar,
  MessageSquare,
  FileText,
  AlertTriangle,
} from 'lucide-react'

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchRecentActivities = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('associate_activities')
        .select('*')
        .eq('associate_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8)

      if (data) setActivities(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRecentActivities()

    // Realtime activity logging subscription
    const channel = supabase
      .channel('realtime-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'associate_activities' },
        (payload) => {
          setActivities((prev) => [payload.new, ...prev].slice(0, 8))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRecentActivities, supabase])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case_creation':
        return { icon: Briefcase, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' }
      case 'stage_change':
        return { icon: Award, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' }
      case 'meeting_scheduled':
      case 'meeting_completed':
        return { icon: Calendar, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' }
      case 'crm_note':
        return { icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' }
      case 'match_feedback':
        return { icon: MessageSquare, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' }
      case 'user_assignment':
        return { icon: UserCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' }
      default:
        return { icon: AlertTriangle, color: 'text-gray-500 bg-gray-50 dark:bg-gray-950/20' }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative border-l border-gray-200 dark:border-gray-800 ml-4 pl-6 space-y-6">
      {activities.length === 0 ? (
        <p className="text-xs text-gray-500 py-4 text-center">No recent activities logged.</p>
      ) : (
        activities.map((act) => {
          const config = getActivityIcon(act.activity_type)
          const Icon = config.icon
          return (
            <div key={act.id} className="relative">
              {/* Timeline dot */}
              <span className={`absolute -left-10 top-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white dark:border-gray-950 shadow-sm ${config.color}`}>
                <Icon size={14} />
              </span>

              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {act.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded">
                    {act.activity_type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(act.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
