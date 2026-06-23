'use server'

import { getAssociateSession } from './helper'
import { recordMarriageSuccessSchema } from '../validators/marriage'
import { revalidatePath } from 'next/cache'

export async function getMarriageSuccesses() {
  try {
    const { supabase } = await getAssociateSession()

    const { data, error } = await supabase
      .from('marriage_successes')
      .select(`
        *,
        groom:profiles!marriage_successes_groom_id_fkey(id, first_name, last_name, avatar_url),
        bride:profiles!marriage_successes_bride_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch marriage successes.' }
  }
}

export async function recordMarriageSuccess(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = recordMarriageSuccessSchema.parse(rawInput)

    const { data, error } = await supabase
      .from('marriage_successes')
      .insert({
        groom_id: validated.groomId,
        bride_id: validated.brideId,
        associate_id: user.id,
        case_id: validated.caseId || null,
        marriage_date: validated.marriageDate,
        engagement_date: validated.engagementDate || null,
        success_story: validated.successStory,
        photos: validated.photos,
        verified_by_admin: false, // Default to false, awaits admin verification
      })
      .select()
      .single()

    if (error) throw error

    // Log case activity if case exists
    if (validated.caseId) {
      await supabase.from('associate_activities').insert({
        case_id: validated.caseId,
        associate_id: user.id,
        activity_type: 'marriage_recorded',
        description: 'Recorded marriage success milestone. Awaiting admin verification.',
        metadata: { success_id: data.id },
      })
      revalidatePath(`/associate/cases/${validated.caseId}`)
    }

    revalidatePath('/associate/marriages')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to record marriage success.' }
  }
}

export async function verifyMarriageSuccess(marriageId: string) {
  try {
    const { supabase, user } = await getAssociateSession()

    // Ensure only super_admin can verify
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      throw new Error('Only super administrators can verify marriage successes')
    }

    const { data, error } = await supabase
      .from('marriage_successes')
      .update({
        verified_by_admin: true,
        verified_by_id: user.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', marriageId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/associate/marriages')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to verify marriage success.' }
  }
}

export async function uploadSuccessPhotos(marriageId: string, photos: string[]) {
  try {
    const { supabase, user } = await getAssociateSession()

    // Retrieve existing photos
    const { data: success } = await supabase
      .from('marriage_successes')
      .select('photos, associate_id')
      .eq('id', marriageId)
      .single()

    if (!success) throw new Error('Marriage success record not found')

    if (success.associate_id !== user.id) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'super_admin') {
        throw new Error('Unauthorized to modify this marriage success record')
      }
    }

    const mergedPhotos = Array.from(new Set([...(success.photos || []), ...photos]))

    const { data, error } = await supabase
      .from('marriage_successes')
      .update({
        photos: mergedPhotos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', marriageId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/associate/marriages')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to upload success photos.' }
  }
}
