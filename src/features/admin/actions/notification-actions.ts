'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { broadcastNotificationSchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function sendBroadcastNotification(input: {
  targetSegment: 'all' | 'users' | 'associates' | 'premium' | 'free'
  title: string
  message: string
  channels: ('email' | 'sms' | 'push' | 'in_app')[]
}) {
  try {
    const { supabase, user } = await getAdminSession('manage_notifications')
    const validated = broadcastNotificationSchema.parse(input)

    // 1. Fetch matching user profile ids depending on segment
    let query = supabase.from('profiles').select('id').eq('is_deleted', false)

    if (validated.targetSegment === 'associates') {
      query = query.neq('role', 'user')
    } else if (validated.targetSegment === 'users') {
      query = query.eq('role', 'user')
    } else if (validated.targetSegment === 'premium') {
      query = query.eq('is_premium', true)
    } else if (validated.targetSegment === 'free') {
      query = query.eq('is_premium', false)
    }

    const { data: targets, error } = await query
    if (error) throw error

    if (targets && targets.length > 0) {
      // 2. Perform bulk creation in in-app notifications
      if (validated.channels.includes('in_app')) {
        const notificationsData = targets.map((t: any) => ({
          user_id: t.id,
          title: validated.title,
          message: validated.message,
          type: 'marketing',
          is_read: false
        }))

        // Supabase bulk insert
        const { error: insErr } = await supabase.from('notifications').insert(notificationsData)
        if (insErr) throw insErr
      }

      // 3. Stubs for SMS, Email and Push integrations
      if (validated.channels.includes('email')) {
        // TODO: Resend integration
        console.log(`[SMS/Email Broadcast Log]: Sending email to ${targets.length} users: ${validated.title}`)
      }
      if (validated.channels.includes('sms')) {
        // TODO: Twilio integration
        console.log(`[SMS/Email Broadcast Log]: Sending SMS to ${targets.length} users: ${validated.title}`)
      }
    }

    await logAdminActivity(
      supabase,
      user.id,
      'Broadcast Notification Dispatched',
      'notifications',
      null,
      {},
      { segment: validated.targetSegment, title: validated.title, channels: validated.channels }
    )

    revalidatePath(`/admin/dashboard`)
    return { success: true, count: targets?.length || 0 }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
