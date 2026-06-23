'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import {
  profileEditSchema,
  partnerPreferencesSchema,
  privacyControlsSchema,
  type ProfileEditOutput,
  type PartnerPreferencesOutput,
  type PrivacyControlsInput
} from '../validators/profile-validators'

/**
 * Server Action to update primary profile details.
 */
export async function updateProfile(rawInput: ProfileEditOutput) {
  const validated = profileEditSchema.safeParse(rawInput)
  if (!validated.success) {
    return { error: 'Invalid profile details submitted.' }
  }

  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: validated.data.first_name,
      last_name: validated.data.last_name,
      gender: validated.data.gender,
      date_of_birth: validated.data.date_of_birth,
      marital_status: validated.data.marital_status,
      religion: validated.data.religion,
      caste: validated.data.caste || null,
      mother_tongue: validated.data.mother_tongue,
      education: validated.data.education || null,
      occupation: validated.data.occupation || null,
      annual_income: validated.data.annual_income,
      city: validated.data.city,
      state: validated.data.state,
      country: validated.data.country,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Server Action to update user partner preferences.
 */
export async function updatePartnerPreferences(rawInput: PartnerPreferencesOutput) {
  const validated = partnerPreferencesSchema.safeParse(rawInput)
  if (!validated.success) {
    return { error: 'Invalid partner preferences details.' }
  }

  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  const preferences = {
    age_min: validated.data.ageMin,
    age_max: validated.data.ageMax,
    marital_status: validated.data.maritalStatus,
    religion: validated.data.religion || null,
    mother_tongue: validated.data.motherTongue || null,
    state: validated.data.state || null,
    city: validated.data.city || null,
    education: validated.data.education || null,
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      partner_preferences: preferences,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Server Action to update profile privacy settings.
 */
export async function updatePrivacySettings(rawInput: PrivacyControlsInput) {
  const validated = privacyControlsSchema.safeParse(rawInput)
  if (!validated.success) {
    return { error: 'Invalid privacy parameters submitted.' }
  }

  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      photo_privacy_tier: validated.data.photo_privacy_tier,
      last_name_privacy: validated.data.last_name_privacy,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Server Action to upload photo to Supabase storage.
 * Base64 is used to bypass network boundary limits.
 */
export async function uploadPhotoAction(base64Data: string, fileName: string) {
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Unauthorized session.' }
    }

    // Extract mime type from base64 data URL if present
    let contentType = 'image/jpeg'
    const mimeMatch = base64Data.match(/^data:([^;]+);base64,/)
    if (mimeMatch && mimeMatch[1]) {
      contentType = mimeMatch[1]
    }

    // Parse Base64 to Buffer
    const base64Clean = base64Data.split(',')[1] || base64Data
    const buffer = Buffer.from(base64Clean, 'base64')
    
    // Convert Node Buffer to standard web Blob for compatibility with Next.js fetch
    const blob = new Blob([buffer], { type: contentType })
    
    const photoId = crypto.randomUUID()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${user.id}/${photoId}-${sanitizedFileName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, blob, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      console.error('[uploadPhotoAction] Storage upload error:', uploadError)
      return { error: `Storage upload failed: ${uploadError.message}` }
    }

    // Retrieve storage file URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    // Fetch current profile photo list
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('photos, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: profileError?.message || 'Could not fetch current profile.' }
    }

    const currentPhotos: string[] = (profile.photos as string[]) || []
    const updatedPhotos = [...currentPhotos, publicUrl]

    // Update profile record with new photos array
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        photos: updatedPhotos,
        avatar_url: profile.avatar_url ? profile.avatar_url : publicUrl, // Default to first photo as avatar
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[uploadPhotoAction] Profile update error:', updateError)
      return { error: `Database update failed: ${updateError.message}` }
    }

    revalidatePath('/profile')
    return { success: true, url: publicUrl }
  } catch (err: any) {
    console.error('[uploadPhotoAction] Exception during upload:', err)
    return { error: `Upload exception: ${err.message || String(err)}` }
  }
}

/**
 * Server Action to delete a photo from profile photos array.
 */
export async function deletePhotoAction(photoUrl: string) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  // Fetch current photos array
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('photos, avatar_url')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not fetch profile record.' }
  }

  const currentPhotos: string[] = (profile.photos as string[]) || []
  const updatedPhotos = currentPhotos.filter((p: string) => p !== photoUrl)

  // Try to remove from Supabase storage using file path
  // Ex: https://xxx.supabase.co/storage/v1/object/public/profile-photos/user_id/photo_id.jpg
  try {
    const urlParts = photoUrl.split('/profile-photos/')
    const filePath = urlParts[1]
    if (filePath) {
      await supabase.storage.from('profile-photos').remove([filePath])
    }
  } catch {
    // Fail silently on physical storage deletion to keep database consistent
  }

  // Update profiles table
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      photos: updatedPhotos,
      avatar_url: profile.avatar_url === photoUrl ? (updatedPhotos[0] || null) : profile.avatar_url
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/profile')
  return { success: true }
}
