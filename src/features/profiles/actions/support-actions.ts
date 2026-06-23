'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Server Action to submit a support ticket.
 * Can be used by both guests and authenticated members.
 */
export async function createSupportTicketAction(data: {
  name: string
  email: string
  subject: string
  message: string
}) {
  if (!data.name || !data.email || !data.subject || !data.message) {
    return { error: 'All fields are required.' }
  }

  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user?.id || null,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: 'open',
      created_at: new Date().toISOString()
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/support')
  return { success: true }
}

/**
 * Server Action to submit an abuse report against a profile.
 * Only authenticated users can report.
 */
export async function reportUserAction(data: {
  reportedId: string
  reason: string
  description?: string
}) {
  if (!data.reportedId || !data.reason) {
    return { error: 'Reported profile ID and reason are required.' }
  }

  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'You must be logged in to report a profile.' }
  }

  if (user.id === data.reportedId) {
    return { error: 'You cannot report yourself.' }
  }

  const { error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: user.id,
      reported_id: data.reportedId,
      reason: data.reason,
      description: data.description || null,
      status: 'pending',
      created_at: new Date().toISOString()
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/support')
  return { success: true }
}
