'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/types/database'

/**
 * Calculates a completion percentage score for the user profile.
 */
function calculateProfileScore(profile: Partial<Profile>): number {
  const fields: (keyof Profile)[] = [
    'first_name', 'last_name', 'gender', 'date_of_birth', 'marital_status',
    'profile_created_by', 'religion', 'caste', 'sub_caste', 'mother_tongue',
    'manglik_status', 'horoscope_available', 'education', 'college',
    'occupation', 'company', 'annual_income', 'height', 'weight',
    'complexion', 'body_type', 'diet', 'smoking', 'drinking',
    'father_occupation', 'mother_occupation', 'brothers_count', 'sisters_count',
    'family_type', 'family_values', 'avatar_url'
  ]

  let filledCount = 0
  fields.forEach((field) => {
    const val = profile[field]
    if (val !== undefined && val !== null && val !== '') {
      if (Array.isArray(val)) {
        if (val.length > 0) filledCount++
      } else {
        filledCount++
      }
    }
  })

  return Math.round((filledCount / fields.length) * 100)
}

/**
 * Saves onboarding data for a specific step.
 */
export async function saveOnboardingStep(step: number, data: Record<string, any>) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  // Handle nested partner preferences specifically if on Step 7
  let updateData: Record<string, any> = { ...data }

  if (step === 7) {
    const prefs = {
      age_min: data.age_min,
      age_max: data.age_max,
      religion: data.religion || null,
      education: data.education || null,
      state: data.state || null,
      city: data.city || null,
      marital_status: data.marital_status || [],
    }
    updateData = { partner_preferences: prefs }
  }

  // 1. Update the profile with the current step details
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  // 2. Fetch full profile to recalculate and save profile_score
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile) {
    const newScore = calculateProfileScore(profile as Profile)
    await supabase
      .from('profiles')
      .update({ profile_score: newScore })
      .eq('id', user.id)
  }

  revalidatePath('/onboarding')
  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return { success: true }
}

/**
 * Retrieves the current user's profile and calculation state.
 */
export async function getOnboardingProgress() {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Unauthorized session.' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return { error: error?.message || 'Profile not found.' }
  }

  // Deduce current step based on completed fields (for draft resume later)
  let currentStep = 1
  const p = profile as Profile

  if (p.first_name && p.last_name && p.marital_status && p.profile_created_by) {
    currentStep = 2
  }
  if (currentStep === 2 && p.religion && p.mother_tongue && p.manglik_status !== undefined) {
    currentStep = 3
  }
  if (currentStep === 3 && p.education && p.occupation && p.annual_income !== null) {
    currentStep = 4
  }
  if (currentStep === 4 && p.height && p.weight) {
    currentStep = 5
  }
  if (currentStep === 5 && p.diet && p.smoking && p.drinking) {
    currentStep = 6
  }
  if (currentStep === 6 && p.father_occupation && p.family_type) {
    currentStep = 7
  }
  if (currentStep === 7 && p.partner_preferences && Object.keys(p.partner_preferences).length > 0) {
    currentStep = 8
  }

  return { success: true, profile: p, suggestedStep: currentStep }
}
