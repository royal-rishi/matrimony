'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Server Action to update account email and mobile number.
 */
export async function updateAccountInfoAction(email?: string, mobileNumber?: string) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  // Update email in auth if provided
  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email })
    if (emailError) {
      return { error: `Email update failed: ${emailError.message}` }
    }
  }

  // Update mobile number in profiles table if provided
  if (mobileNumber) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ mobile_number: mobileNumber })
      .eq('id', user.id)

    if (profileError) {
      return { error: `Profile update failed: ${profileError.message}` }
    }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Server Action to change current user's password.
 */
export async function changePasswordAction(password: string) {
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Server Action to update user privacy flags.
 */
export async function updatePrivacyTogglesAction(data: {
  hide_phone: boolean
  hide_income: boolean
  hide_photos: boolean
  hide_last_seen: boolean
  last_name_privacy: boolean
  photo_privacy_tier: 'public' | 'verified_members' | 'connections'
}) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      hide_phone: data.hide_phone,
      hide_income: data.hide_income,
      hide_photos: data.hide_photos,
      hide_last_seen: data.hide_last_seen,
      last_name_privacy: data.last_name_privacy,
      photo_privacy_tier: data.photo_privacy_tier,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Server Action to logically delete/deactivate user account.
 */
export async function deactivateAccountAction() {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  // Perform a logical delete on profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  // Sign out the user session
  await supabase.auth.signOut()

  return { success: true }
}
