'use client'

// ============================================================
// ADMIN NOTIFICATION CONTROL PANEL DASHBOARD
// ============================================================

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export const NotificationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    todayCount: 0,
    smsCount: 0,
    emailCount: 0,
    whatsappCount: 0,
    successRate: 100,
    dlqCount: 0,
    queueCount: 0,
    estCost: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const todayStr = new Date().toISOString().split('T')[0]
        const todayStart = `${todayStr}T00:00:00Z`

        // 1. Fetch Today's Notifications Count
        const { count: todayCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart)

        // 2. Fetch In-Queue Count
        const { count: queueCount } = await supabase
          .from('notification_queue')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'processing', 'scheduled'])

        // 3. Fetch DLQ Count
        const { count: dlqCount } = await supabase
          .from('failed_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_resolved', false)

        // 4. Fetch logs counts per channel
        const { data: logs } = await supabase
          .from('notification_logs')
          .select('channel, status, cost_units')
          .gte('created_at', todayStart)

        let email = 0
        let sms = 0
        let wa = 0
        let success = 0
        let totalCost = 0

        if (logs) {
          logs.forEach((log: any) => {
            if (log.channel === 'email') email++
            else if (log.channel === 'sms') sms++
            else if (log.channel === 'whatsapp') wa++

            if (log.status === 'delivered' || log.status === 'dispatched' || log.status === 'sent') {
              success++
            }

            totalCost += Number(log.cost_units || 0)
          })
        }

        const successRate = logs && logs.length > 0 ? (success / logs.length) * 100 : 100

        setMetrics({
          todayCount: todayCount || 0,
          emailCount: email,
          smsCount: sms,
          whatsappCount: wa,
          successRate: Number(successRate.toFixed(1)),
          dlqCount: dlqCount || 0,
          queueCount: queueCount || 0,
          estCost: Number(totalCost.toFixed(4)),
        })
      } catch (err) {
        console.error('Failed to load control panel telemetry:', err)
      }
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold mt-4">Loading control panel...</p>
      </div>
    )
  }

  const statCards = [
    { label: "Today's Alerts", value: metrics.todayCount, icon: "🔔", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/10" },
    { label: "Emails Outbound", value: metrics.emailCount, icon: "📧", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/10" },
    { label: "SMS Outbound", value: metrics.smsCount, icon: "💬", color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/10" },
    { label: "WhatsApp Outbound", value: metrics.whatsappCount, icon: "🟢", color: "text-green-500 bg-green-50 dark:bg-green-950/10" },
    { label: "Success Rate", value: `${metrics.successRate}%`, icon: "📈", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/10" },
    { label: "Active Queue", value: metrics.queueCount, icon: "⏳", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/10" },
    { label: "Dead Letter Queue", value: metrics.dlqCount, icon: "⚠️", color: "text-rose-500 bg-rose-50 dark:bg-rose-950/10" },
    { label: "Est. Spend Today", value: `$${metrics.estCost}`, icon: "💰", color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/10" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Control Panel Overview</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time status updates and telemetry indicators.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="p-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl text-lg ${card.color}`}>{card.icon}</div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 block font-medium leading-none">{card.label}</span>
              <span className="text-lg font-black text-gray-900 dark:text-white block leading-none">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Channel Distribution</h3>
          <div className="h-48 flex items-center justify-center text-gray-400 text-xs">
            {/* Visual representation placeholder */}
            <div className="w-full space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Emails ({metrics.emailCount})</span>
                  <span>{((metrics.emailCount / (metrics.emailCount + metrics.smsCount + metrics.whatsappCount || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${(metrics.emailCount / (metrics.emailCount + metrics.smsCount + metrics.whatsappCount || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>SMS ({metrics.smsCount})</span>
                  <span>{((metrics.smsCount / (metrics.emailCount + metrics.smsCount + metrics.whatsappCount || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full" style={{ width: `${(metrics.smsCount / (metrics.emailCount + metrics.smsCount + metrics.whatsappCount || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>WhatsApp ({metrics.whatsappCount})</span>
                  <span>{((metrics.whatsappCount / (metrics.emailCount + metrics.smsCount + metrics.whatsappCount || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: `${(metrics.whatsappCount / (metrics.emailCount + metrics.smsCount + metrics.whatsappCount || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Emergency Broadcast Status</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If active, bypasses quiet hours for urgent delivery warnings.</p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/15 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between mt-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">ALL SYSTEMS RUNNING</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500">Emergency settings override inactive.</span>
            </div>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
        </div>
      </div>
    </div>
  )
}
