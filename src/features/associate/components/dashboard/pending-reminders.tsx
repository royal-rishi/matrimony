'use client'

import React, { useEffect, useState } from 'react'
import { Bell, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { completeReminder } from '@/features/associate/actions/case-actions'
import { toast } from 'sonner'

export function PendingReminders() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchReminders = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('associate_case_reminders')
        .select(`
          *,
          case:associate_cases(case_number)
        `)
        .eq('associate_id', user.id)
        .eq('is_completed', false)
        .order('due_at', { ascending: true })

      if (data) setReminders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  const handleMarkComplete = async (reminderId: string) => {
    try {
      const result = await completeReminder(reminderId)
      if (result.success) {
        toast.success('Reminder marked as completed!')
        setReminders((prev) => prev.filter((r) => r.id !== reminderId))
      } else {
        toast.error(result.error || 'Failed to complete reminder')
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred')
    }
  }

  const getUrgencyColor = (dueDateStr: string) => {
    const due = new Date(dueDateStr).getTime()
    const now = Date.now()
    const diffHours = (due - now) / (1000 * 60 * 60)

    if (diffHours < 0) return 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50'
    if (diffHours < 24) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50'
    return 'text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-gray-100 dark:border-gray-800'
  }

  if (loading) {
    return <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      ))}
    </div>
  }

  return (
    <div className="space-y-3">
      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <Bell className="text-gray-300 w-8 h-8 mb-2" />
          <p className="text-xs text-gray-500 font-medium">All caught up! No pending reminders.</p>
        </div>
      ) : (
        reminders.map((rem) => {
          const color = getUrgencyColor(rem.due_at)
          return (
            <div
              key={rem.id}
              className={`flex items-center justify-between p-4 border rounded-xl bg-white dark:bg-gray-950 transition hover:border-gray-300 dark:hover:border-gray-700 shadow-sm`}
            >
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {rem.title}
                </p>
                {rem.body && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {rem.body}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded">
                    {rem.case?.case_number || 'Case CRM'}
                  </span>
                  <span className={`text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded ${color}`} suppressHydrationWarning>
                    <Clock size={10} />
                    {new Date(rem.due_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleMarkComplete(rem.id)}
                className="text-gray-400 hover:text-emerald-500 transition cursor-pointer"
                title="Mark Completed"
              >
                <CheckCircle size={20} />
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
