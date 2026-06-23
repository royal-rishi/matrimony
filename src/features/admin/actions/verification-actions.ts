'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { kycVerifySchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function getVerificationQueue() {
  try {
    const { supabase } = await getAdminSession('manage_verifications')

    const { data, error } = await supabase
      .from('user_verifications')
      .select(`
        *,
        user:profiles(
          id,
          first_name,
          last_name,
          avatar_url,
          city,
          state,
          photos
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function verifyUserKYC(input: { userId: string; status: 'approved' | 'rejected'; notes?: string }) {
  try {
    const { supabase, user } = await getAdminSession('manage_verifications')
    const validated = kycVerifySchema.parse(input)

    const isVerified = validated.status === 'approved'

    // Update profiles table flag
    const { error: pErr } = await supabase
      .from('profiles')
      .update({
        is_verified: isVerified,
        updated_at: new Date().toISOString()
      })
      .eq('id', validated.userId)

    if (pErr) throw pErr

    // Update user_verifications table record
    const { error: vErr } = await supabase
      .from('user_verifications')
      .update({
        status: validated.status,
        verification_notes: validated.notes || null,
        verified_by_id: user.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', validated.userId)

    if (vErr) throw vErr

    // Send in-app notification to the user
    await supabase.from('notifications').insert({
      user_id: validated.userId,
      title: isVerified ? 'Profile Verified!' : 'KYC Verification Update',
      message: isVerified
        ? 'Congratulations, your identity proof verification check succeeded! You now have a verified badge.'
        : `Your KYC verification request was rejected. Details: ${validated.notes || 'Please upload clean documents.'}`,
      type: 'system',
      is_read: false
    })

    await logAdminActivity(
      supabase,
      user.id,
      isVerified ? 'User KYC Approved' : 'User KYC Rejected',
      'user_verifications',
      validated.userId,
      { notes: validated.notes }
    )

    revalidatePath(`/admin/verifications`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
