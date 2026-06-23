'use client'

import React, { useState } from 'react'
import { sendBroadcastNotification } from '@/features/admin/actions/notification-actions'
import { toast } from 'sonner'
import { Bell, Send, Mail, MessageSquare, Smartphone, HelpCircle } from 'lucide-react'

export function BroadcastSender() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetSegment, setTargetSegment] = useState<'all' | 'users' | 'associates' | 'premium' | 'free'>('all')

  // Channels triggers
  const [inApp, setInApp] = useState(true)
  const [email, setEmail] = useState(false)
  const [sms, setSms] = useState(false)

  const [sending, setSending] = useState(false)

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return

    const channels: ('email' | 'sms' | 'push' | 'in_app')[] = []
    if (inApp) channels.push('in_app')
    if (email) channels.push('email')
    if (sms) channels.push('sms')

    if (channels.length === 0) {
      toast.error('Please select at least one delivery channel')
      return
    }

    setSending(true)
    const res = await sendBroadcastNotification({
      targetSegment,
      title,
      message,
      channels,
    })

    if (res.success) {
      toast.success(`Broadcast successfully sent to ${res.count} profiles!`)
      setTitle('')
      setMessage('')
    } else {
      toast.error(res.error || 'Failed to dispatch broadcast')
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          Push & SMS Notification Center
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Target broadcast messages to specific user segments across multiple delivery networks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Broadcast composer */}
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
            <Bell size={16} className="text-pink-500" /> New Broadcast Campaign
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Target User Segment</label>
                <select
                  value={targetSegment}
                  onChange={(e: any) => setTargetSegment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-205 dark:border-gray-800 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-pink-500/20"
                >
                  <option value="all">All Registrations (Users + Associates)</option>
                  <option value="users">Standard Matrimony Users Only</option>
                  <option value="associates">Associates Network Only</option>
                  <option value="premium">Premium Subscribed Users Only</option>
                  <option value="free">Free Trial Tier Users Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Alert Delivery Channels</label>
                <div className="flex gap-4 pt-1.5">
                  <label className="flex items-center gap-1.5 font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} className="rounded text-pink-500" />
                    In-App
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="rounded text-pink-500" />
                    Email
                  </label>
                  <label className="flex items-center gap-1.5 font-semibold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="rounded text-pink-500" />
                    SMS Link
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Notification Title</label>
              <input
                type="text"
                placeholder="Alert Campaign Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-205 dark:border-gray-800 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-pink-500/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Alert Message Body</label>
              <textarea
                placeholder="Compose announcement body..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 px-3 py-2.5 border border-gray-205 dark:border-gray-800 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-pink-500/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl text-xs hover:from-pink-600 hover:to-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Send size={13} />
              {sending ? 'Sending...' : 'Dispatch Campaign'}
            </button>
          </form>
        </div>

        {/* Right Side: Channel stubs metadata */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm h-fit space-y-6 text-xs text-gray-600 dark:text-gray-400">
          <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
            <HelpCircle size={16} className="text-pink-500" /> Channels Health
          </h3>

          <div className="space-y-4">
            <div className="flex gap-3.5 items-start">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 shrink-0">
                <Smartphone size={16} />
              </div>
              <div>
                <span className="block font-bold text-gray-750 dark:text-gray-250">In-App Alerts Network</span>
                <span className="block text-[10px] text-emerald-500 font-bold uppercase mt-0.5">Online / Active</span>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                <Mail size={16} />
              </div>
              <div>
                <span className="block font-bold text-gray-750 dark:text-gray-250">Resend Mail Node</span>
                <span className="block text-[10px] text-amber-500 font-bold uppercase mt-0.5">Scaffolded Integration</span>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <MessageSquare size={16} />
              </div>
              <div>
                <span className="block font-bold text-gray-750 dark:text-gray-250">Twilio SMS gateway</span>
                <span className="block text-[10px] text-amber-500 font-bold uppercase mt-0.5">Scaffolded Integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
