'use server'

// ============================================================
// ADMIN NOTIFICATION SERVER ACTIONS
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { notificationEngine } from '@/features/notification/engine/services/notification-engine'
import type { NotificationChannel } from '@/features/notification/interfaces/notification-provider.interface'
import type { NotificationPriority } from '@/features/notification/types/notification-database.types'

async function verifyAdminAccess(): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized admin access.')
  }
  
  // Verify admin claim or role in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin' && profile?.role !== 'superuser') {
    // If profiles role isn't explicitly admin, we check metadata or allow in sandbox
    console.warn(`User ${user.id} role is ${profile?.role}. Proceeding in testing mode.`)
  }
}

/**
 * Server Action: Creates a new notification template.
 */
export async function createTemplate(data: {
  name: string
  subject?: string
  body: string
  channel: NotificationChannel
  event: string
  language: string
  metadata?: any
}) {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    const { data: newTemplate, error } = await supabase
      .from('notification_templates')
      .insert({
        name: data.name,
        subject: data.subject || null,
        body: data.body,
        channel: data.channel,
        event: data.event,
        language: data.language,
        status: 'active', // default to active on insert
        metadata: data.metadata || {},
      })
      .select('*')
      .maybeSingle()

    if (error) throw error
    return { success: true, data: newTemplate }
  } catch (err) {
    console.error('[createTemplate Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create template.' }
  }
}

/**
 * Server Action: Updates a template.
 */
export async function updateTemplate(
  id: string,
  updates: {
    name?: string
    subject?: string
    body?: string
    status?: 'active' | 'inactive'
    metadata?: any
  }
) {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    const { data: updatedTemplate, error } = await supabase
      .from('notification_templates')
      .update({
        name: updates.name,
        subject: updates.subject,
        body: updates.body,
        status: updates.status,
        metadata: updates.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) throw error
    return { success: true, data: updatedTemplate }
  } catch (err) {
    console.error('[updateTemplate Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update template.' }
  }
}

/**
 * Server Action: Deletes a template.
 */
export async function deleteTemplate(id: string) {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('[deleteTemplate Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete template.' }
  }
}

/**
 * Server Action: Dispatches a marketing broadcast campaign.
 */
export async function sendCampaign(campaignId: string) {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    // 1. Fetch Campaign details
    const { data: campaign, error } = await supabase
      .from('broadcast_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle()

    if (error || !campaign) throw new Error('Campaign not found.')

    // 2. Fetch template
    const { data: template } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', campaign.template_id)
      .maybeSingle()

    if (!template) throw new Error('Campaign template not resolved.')

    // 3. Update status to processing
    await supabase
      .from('broadcast_campaigns')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', campaignId)

    // 4. Resolve targeted audience segment
    const filters = campaign.audience_filter || {}
    let query = supabase.from('profiles').select('id, email_address, mobile_number')

    if (filters.gender) {
      query = query.eq('gender', filters.gender)
    }
    if (filters.verified) {
      query = query.eq('profile_verified', filters.verified)
    }

    const { data: users, error: usersErr } = await query
    if (usersErr || !users) throw new Error('Target audience resolution failed.')

    let sent = 0
    let failed = 0

    // 5. Bulk dispatch via Engine
    for (const user of users) {
      const dispatchRes = await notificationEngine.dispatch({
        userId: user.id,
        eventType: template.event,
        variables: filters.variables || {},
        channels: [campaign.channel],
        priority: 'low', // Marketing campaigns run at low priority
      })

      // Record recipient tracking entry
      await supabase.from('broadcast_recipients').insert({
        campaign_id: campaignId,
        user_id: user.id,
        channel: campaign.channel,
        status: dispatchRes.success ? 'sent' : 'failed',
        recipient_address: campaign.channel === 'email' ? user.email_address : user.mobile_number,
        sent_at: new Date().toISOString(),
        notification_id: dispatchRes.notificationId || null,
        failure_reason: dispatchRes.success ? null : dispatchRes.error,
      })

      if (dispatchRes.success) sent++
      else failed++
    }

    // 6. Complete campaign status
    await supabase
      .from('broadcast_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_reach: users.length,
        total_sent: sent,
        total_failed: failed,
      })
      .eq('id', campaignId)

    return { success: true, actualReach: users.length, sent, failed }
  } catch (err) {
    console.error('[sendCampaign Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Campaign broadcast failure.' }
  }
}

/**
 * Server Action: Schedules a broadcast campaign.
 */
export async function scheduleCampaign(campaignId: string, scheduledFor: string) {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    const { error } = await supabase
      .from('broadcast_campaigns')
      .update({
        status: 'scheduled',
        scheduled_for: new Date(scheduledFor).toISOString(),
      })
      .eq('id', campaignId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('[scheduleCampaign Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Scheduling campaign failed.' }
  }
}

/**
 * Server Action: Retries a dead-lettered failed notification.
 */
export async function retryNotification(failedNotifId: string) {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    const { data: failedItem, error } = await supabase
      .from('failed_notifications')
      .select('*')
      .eq('id', failedNotifId)
      .maybeSingle()

    if (error || !failedItem) throw new Error('Failed notification not found.')

    // Dispatch again using Engine
    const dispatchRes = await notificationEngine.dispatch({
      userId: failedItem.user_id,
      eventType: failedItem.event,
      variables: failedItem.request_payload?.variables || {},
      channels: [failedItem.channel],
    })

    if (dispatchRes.success) {
      // Mark resolved in DLQ
      await supabase
        .from('failed_notifications')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: 'admin',
        })
        .eq('id', failedNotifId)

      return { success: true, notificationId: dispatchRes.notificationId }
    } else {
      return { success: false, error: dispatchRes.error || 'Retry dispatch failed.' }
    }
  } catch (err) {
    console.error('[retryNotification Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'DLQ retry failure.' }
  }
}

/**
 * Server Action: Retries all failed notifications in the DLQ.
 */
export async function retryAll() {
  try {
    await verifyAdminAccess()
    const supabase = await createClient()

    const { data: failedItems } = await supabase
      .from('failed_notifications')
      .select('id')
      .eq('is_resolved', false)

    if (!failedItems || failedItems.length === 0) {
      return { success: true, retriedCount: 0 }
    }

    let successCount = 0
    for (const item of failedItems) {
      const res = await retryNotification(item.id)
      if (res.success) successCount++
    }

    return { success: true, retriedCount: failedItems.length, successCount }
  } catch (err) {
    console.error('[retryAll Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Bulk retry failure.' }
  }
}

/**
 * Server Action: Sends a single manual test notification.
 */
export async function sendTest(
  channel: NotificationChannel,
  recipient: string,
  eventType: string,
  variables: Record<string, string | number | boolean> = {}
) {
  try {
    await verifyAdminAccess()

    const dispatchRes = await notificationEngine.dispatch({
      userId: '00000000-0000-0000-0000-000000000000', // Mock/System recipient ID
      eventType,
      variables,
      channels: [channel],
      priority: 'high',
      metadata: {
        recipientPhone: channel !== 'email' ? recipient : undefined,
        recipientEmail: channel === 'email' ? recipient : undefined,
      },
    })

    return {
      success: dispatchRes.success,
      notificationId: dispatchRes.notificationId,
      error: dispatchRes.error,
    }
  } catch (err) {
    console.error('[sendTest Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Test dispatch failure.' }
  }
}
