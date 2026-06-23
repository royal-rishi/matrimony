'use server'

import { getAssociateSession, checkAssociateTerritoryAccess } from './helper'
import { revalidatePath } from 'next/cache'

export async function getAssignedClients() {
  try {
    const { supabase, user } = await getAssociateSession()

    // Fetch clients assigned via user_assignments
    const { data: assignments, error: assignError } = await supabase
      .from('user_assignments')
      .select(`
        id,
        assigned_at,
        client:profiles!user_assignments_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          city,
          state,
          gender,
          religion,
          caste,
          is_premium,
          subscription_tier,
          created_at
        )
      `)
      .eq('local_associate_id', user.id)
      .is('unassigned_at', null)

    if (assignError) throw assignError

    // Enrich with their active case status if any
    const enrichedClients = await Promise.all(
      (assignments || []).map(async (asg: any) => {
        const client = asg.client
        if (!client) return null

        const { data: activeCase } = await supabase
          .from('associate_cases')
          .select('id, case_number, status, case_priority, last_activity_at')
          .eq('user_id', client.id)
          .neq('status', 'closed')
          .maybeSingle()

        return {
          assignment_id: asg.id,
          assigned_at: asg.assigned_at,
          ...client,
          active_case: activeCase || null,
        }
      })
    )

    return {
      success: true,
      data: enrichedClients.filter(Boolean),
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch assigned clients.' }
  }
}

export async function getClientProfile(clientId: string) {
  try {
    const { supabase, user, profile: assocProfile } = await getAssociateSession()

    // Territory check (Rule 6)
    if (assocProfile.role !== 'super_admin') {
      const isAllowed = await checkAssociateTerritoryAccess(supabase, user.id, clientId)
      if (!isAllowed) {
        return { success: false, error: 'Access denied: User resides outside your assigned territory.' }
      }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) throw error

    return { success: true, data: profile }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch client profile.' }
  }
}

export async function updateClientPreferences(clientId: string, preferences: any) {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        partner_preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .select()
      .single()

    if (error) throw error

    // Fetch the active case to log an activity
    const { data: activeCase } = await supabase
      .from('associate_cases')
      .select('id')
      .eq('user_id', clientId)
      .neq('status', 'closed')
      .maybeSingle()

    if (activeCase) {
      await supabase.from('associate_activities').insert({
        case_id: activeCase.id,
        associate_id: user.id,
        activity_type: 'preferences_updated',
        description: 'Updated partner matching preferences for client.',
      })
      revalidatePath(`/associate/cases/${activeCase.id}`)
    }

    revalidatePath(`/associate/clients/${clientId}`)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update client preferences.' }
  }
}

export async function assistDocumentUpload(clientId: string, fileUrl: string, docType: string) {
  try {
    const { supabase, user } = await getAssociateSession()

    // Fetch the active case to log an activity
    const { data: activeCase } = await supabase
      .from('associate_cases')
      .select('id')
      .eq('user_id', clientId)
      .neq('status', 'closed')
      .maybeSingle()

    if (!activeCase) {
      throw new Error('Client must have an active matchmaking case to assist with document upload')
    }

    // Insert an activity detailing the helper upload
    await supabase.from('associate_activities').insert({
      case_id: activeCase.id,
      associate_id: user.id,
      activity_type: 'document_uploaded',
      description: `Associate uploaded ${docType} document for client.`,
      metadata: { file_url: fileUrl, document_type: docType },
    })

    revalidatePath(`/associate/cases/${activeCase.id}`)
    return { success: true, data: { fileUrl } }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to record document upload assistance.' }
  }
}
