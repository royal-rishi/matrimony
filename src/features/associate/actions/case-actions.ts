'use server'

import { getAssociateSession, checkAssociateTerritoryAccess } from './helper'
import {
  createCaseSchema,
  updateCaseStageSchema,
  addNoteSchema,
  scheduleMeetingSchema,
  completeMeetingSchema,
  addReminderSchema,
  shareProfileSchema,
} from '../validators/case'
import { revalidatePath } from 'next/cache'
import type { CaseStage } from '@/types/database'

// HubSpot style CRM stage transitions validation
const VALID_TRANSITIONS: Record<CaseStage, CaseStage[]> = {
  new: ['requirement_collection', 'closed'],
  requirement_collection: ['new', 'searching', 'closed'],
  searching: ['requirement_collection', 'profiles_shared', 'closed'],
  profiles_shared: ['searching', 'interested', 'closed'],
  interested: ['profiles_shared', 'family_discussion', 'closed'],
  family_discussion: ['interested', 'meeting_scheduled', 'closed'],
  meeting_scheduled: ['family_discussion', 'meeting_completed', 'closed'],
  meeting_completed: ['meeting_scheduled', 'engagement', 'closed'],
  engagement: ['meeting_completed', 'marriage_completed', 'closed'],
  marriage_completed: ['closed'],
  closed: ['new', 'searching'], // Reopening allowed
}

export async function getCases(filters?: { status?: CaseStage; priority?: string; search?: string }) {
  try {
    const { supabase, user } = await getAssociateSession()

    let query = supabase
      .from('associate_cases')
      .select(`
        *,
        client:profiles!associate_cases_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          is_verified,
          city,
          state,
          religion,
          gender
        )
      `)

    // Non-super_admins can only see their assigned cases
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile && profile.role !== 'super_admin') {
      query = query.eq('associate_id', user.id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    } else {
      query = query.neq('status', 'closed')
    }

    if (filters?.priority) {
      query = query.eq('case_priority', filters.priority)
    }

    const { data: cases, error } = await query.order('last_activity_at', { ascending: false })

    if (error) throw error

    // Fetch extra enrichment fields
    const enrichedCases = await Promise.all(
      (cases || []).map(async (c: any) => {
        // Fetch latest activity
        const { data: activity } = await supabase
          .from('associate_activities')
          .select('*')
          .eq('case_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Fetch pending reminders count
        const { count } = await supabase
          .from('associate_case_reminders')
          .select('*', { count: 'exact', head: true })
          .eq('case_id', c.id)
          .eq('is_completed', false)

        const days = Math.floor((Date.now() - new Date(c.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))

        return {
          ...c,
          client: c.client,
          latest_activity: activity || null,
          pending_reminders_count: count || 0,
          days_in_current_stage: days,
        }
      })
    )

    // Filter by client search query if present
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      return {
        success: true,
        data: enrichedCases.filter((c) => {
          const clientName = `${c.client?.first_name || ''} ${c.client?.last_name || ''}`.toLowerCase()
          const caseNum = c.case_number?.toLowerCase() || ''
          return clientName.includes(searchLower) || caseNum.includes(searchLower)
        }),
      }
    }

    return { success: true, data: enrichedCases }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch cases.' }
  }
}

export async function getCaseDetail(caseId: string) {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data: c, error } = await supabase
      .from('associate_cases')
      .select(`
        *,
        client:profiles!associate_cases_user_id_fkey(*)
      `)
      .eq('id', caseId)
      .single()

    if (error) throw error

    // Permissions check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile && profile.role !== 'super_admin') {
      if (c.associate_id !== user.id) {
        return { success: false, error: 'Unauthorized access to this case.' }
      }

      const isAllowed = await checkAssociateTerritoryAccess(supabase, user.id, c.user_id)
      if (!isAllowed) {
        return { success: false, error: 'Access denied: User resides outside your assigned territory.' }
      }
    }

    return { success: true, data: c }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch case detail.' }
  }
}

export async function createCase(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = createCaseSchema.parse(rawInput)

    // Territory check (Rule 6)
    const isAllowed = await checkAssociateTerritoryAccess(supabase, user.id, validated.userId)
    if (!isAllowed) {
      return { success: false, error: 'Access denied: User resides outside your assigned territory.' }
    }

    // Generate unique case number RC-YYYY-XXXX
    const year = new Date().getFullYear()
    const rand = Math.floor(1000 + Math.random() * 9000)
    const case_number = `RC-${year}-${rand}`

    const { data, error } = await supabase
      .from('associate_cases')
      .insert({
        case_number,
        user_id: validated.userId,
        associate_id: validated.associateId,
        status: 'new' as CaseStage,
        case_priority: validated.priority,
        requirement_notes: validated.requirementNotes || null,
        target_match_by: validated.targetMatchBy || null,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Create initial activity
    await supabase.from('associate_activities').insert({
      case_id: data.id,
      associate_id: validated.associateId,
      activity_type: 'case_creation',
      description: 'Matrimonial personal matchmaking case created.',
      metadata: { priority: validated.priority },
    })

    revalidatePath('/associate/cases')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create case.' }
  }
}

export async function updateCaseStage(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = updateCaseStageSchema.parse(rawInput)

    const { data: currentCase, error: getError } = await supabase
      .from('associate_cases')
      .select('status, associate_id')
      .eq('id', validated.caseId)
      .single()

    if (getError || !currentCase) throw new Error('Case not found')

    if (currentCase.associate_id !== user.id) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'super_admin') {
        throw new Error('Unauthorized to modify this case')
      }
    }

    const currentStage = currentCase.status as CaseStage
    const targetStage = validated.status

    // Validate transition
    const allowed = VALID_TRANSITIONS[currentStage]
    if (!allowed?.includes(targetStage)) {
      throw new Error(`Invalid stage transition from ${currentStage} to ${targetStage}`)
    }

    const { data, error } = await supabase
      .from('associate_cases')
      .update({
        status: targetStage,
        last_activity_at: new Date().toISOString(),
        completed_at: targetStage === 'marriage_completed' || targetStage === 'closed' ? new Date().toISOString() : null,
      })
      .eq('id', validated.caseId)
      .select()
      .single()

    if (error) throw error

    // Insert case note to capture transition explanation
    await supabase.from('associate_notes').insert({
      case_id: validated.caseId,
      associate_id: user.id,
      user_id: data.user_id,
      note: `[Stage Change: ${currentStage} ➔ ${targetStage}] ${validated.notes}`,
    })

    // Insert detailed activity logs
    await supabase.from('associate_activities').insert({
      case_id: validated.caseId,
      associate_id: user.id,
      activity_type: 'stage_change',
      description: `Case moved from ${currentStage} to ${targetStage}`,
      metadata: { from_stage: currentStage, to_stage: targetStage, note: validated.notes },
    })

    revalidatePath(`/associate/cases/${validated.caseId}`)
    revalidatePath('/associate/cases')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update case stage.' }
  }
}

export async function getCaseTimeline(caseId: string) {
  try {
    const { supabase } = await getAssociateSession()

    // Retrieve activities
    const { data: activities, error: actError } = await supabase
      .from('associate_activities')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (actError) throw actError

    // Retrieve CRM notes
    const { data: notes, error: notesError } = await supabase
      .from('associate_notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (notesError) throw notesError

    // Retrieve meetings
    const { data: meetings, error: meetError } = await supabase
      .from('associate_case_meetings')
      .select('*')
      .eq('case_id', caseId)
      .order('scheduled_at', { ascending: false })

    if (meetError) throw meetError

    // Retrieve shared profiles
    const { data: shares, error: shareError } = await supabase
      .from('associate_match_shares')
      .select(`
        *,
        shared_profile:profiles!associate_match_shares_shared_profile_id_fkey(
          id, first_name, last_name, avatar_url, city, state, religion, caste, education, occupation
        )
      `)
      .eq('case_id', caseId)
      .order('shared_at', { ascending: false })

    if (shareError) throw shareError

    // Interleave and format timeline items
    const timelineItems: any[] = []

    activities?.forEach((act: any) => {
      timelineItems.push({
        id: act.id,
        type: 'activity',
        title: act.activity_type.replace('_', ' ').toUpperCase(),
        description: act.description,
        timestamp: act.created_at,
        metadata: act.metadata,
      })
    })

    notes?.forEach((n: any) => {
      timelineItems.push({
        id: n.id,
        type: 'note',
        title: 'CRM NOTE',
        description: n.note,
        timestamp: n.created_at,
      })
    })

    meetings?.forEach((m: any) => {
      timelineItems.push({
        id: m.id,
        type: 'meeting',
        title: `MEETING: ${m.title}`,
        description: `Type: ${m.meeting_type} | Scheduled: ${new Date(m.scheduled_at).toLocaleString()} | Status: ${m.is_completed ? 'Completed' : 'Upcoming'}`,
        timestamp: m.created_at,
        metadata: m,
      })
    })

    shares?.forEach((s: any) => {
      const pName = `${s.shared_profile?.first_name || ''} ${s.shared_profile?.last_name || ''}`
      timelineItems.push({
        id: s.id,
        type: 'profile_share',
        title: 'PROFILE SHARED',
        description: `Shared profile of ${pName} | Client Response: ${s.client_response}`,
        timestamp: s.shared_at,
        metadata: s,
      })
    })

    // Sort by timestamp descending
    timelineItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return { success: true, data: timelineItems }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch case timeline.' }
  }
}

export async function addNote(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = addNoteSchema.parse(rawInput)

    const { data: c } = await supabase
      .from('associate_cases')
      .select('user_id')
      .eq('id', validated.caseId)
      .single()

    if (!c) throw new Error('Case not found')

    const { data, error } = await supabase
      .from('associate_notes')
      .insert({
        case_id: validated.caseId,
        associate_id: user.id,
        user_id: c.user_id,
        note: validated.note,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('associate_activities').insert({
      case_id: validated.caseId,
      associate_id: user.id,
      activity_type: 'crm_note',
      description: 'Added a case CRM note.',
    })

    revalidatePath(`/associate/cases/${validated.caseId}`)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add note.' }
  }
}

export async function addReminder(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = addReminderSchema.parse(rawInput)

    const { data, error } = await supabase
      .from('associate_case_reminders')
      .insert({
        case_id: validated.caseId,
        associate_id: user.id,
        title: validated.title,
        body: validated.body || null,
        due_at: validated.dueAt,
        is_completed: false,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('associate_activities').insert({
      case_id: validated.caseId,
      associate_id: user.id,
      activity_type: 'reminder_created',
      description: `Follow-up reminder set: "${validated.title}"`,
      metadata: { reminder_id: data.id, due_at: validated.dueAt },
    })

    revalidatePath(`/associate/cases/${validated.caseId}`)
    revalidatePath('/associate/dashboard')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add reminder.' }
  }
}

export async function completeReminder(reminderId: string) {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data, error } = await supabase
      .from('associate_case_reminders')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', reminderId)
      .eq('associate_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('associate_activities').insert({
      case_id: data.case_id,
      associate_id: user.id,
      activity_type: 'reminder_completed',
      description: `Completed reminder: "${data.title}"`,
    })

    revalidatePath(`/associate/cases/${data.case_id}`)
    revalidatePath('/associate/dashboard')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to complete reminder.' }
  }
}

export async function scheduleMeeting(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = scheduleMeetingSchema.parse(rawInput)

    const { data, error } = await supabase
      .from('associate_case_meetings')
      .insert({
        case_id: validated.caseId,
        associate_id: user.id,
        title: validated.title,
        meeting_type: validated.meetingType,
        scheduled_at: validated.scheduledAt,
        duration_minutes: validated.durationMinutes,
        attendees: validated.attendees,
        meeting_link: validated.meetingLink || null,
        location: validated.location || null,
        notes: validated.notes || null,
        is_completed: false,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('associate_activities').insert({
      case_id: validated.caseId,
      associate_id: user.id,
      activity_type: 'meeting_scheduled',
      description: `Scheduled meeting: "${validated.title}"`,
      metadata: { meeting_id: data.id, scheduled_at: validated.scheduledAt },
    })

    revalidatePath(`/associate/cases/${validated.caseId}`)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to schedule meeting.' }
  }
}

export async function completeMeeting(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = completeMeetingSchema.parse(rawInput)

    const { data, error } = await supabase
      .from('associate_case_meetings')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        outcome: validated.outcome,
        notes: validated.notes || null,
      })
      .eq('id', validated.meetingId)
      .eq('associate_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('associate_activities').insert({
      case_id: data.case_id,
      associate_id: user.id,
      activity_type: 'meeting_completed',
      description: `Completed meeting: "${data.title}"`,
      metadata: { outcome: validated.outcome },
    })

    revalidatePath(`/associate/cases/${data.case_id}`)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to record meeting outcome.' }
  }
}

export async function shareProfile(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = shareProfileSchema.parse(rawInput)

    // Fetch shared profile details to enforce Match Suggestion Rules (Rule 15)
    const { data: sharedProfile, error: profError } = await supabase
      .from('profiles')
      .select('first_name, last_name, is_verified, photos, education')
      .eq('id', validated.sharedProfileId)
      .single()

    if (profError || !sharedProfile) {
      return { success: false, error: 'Suggested candidate is not registered on the platform.' }
    }

    if (!sharedProfile.is_verified) {
      return { success: false, error: 'Suggested candidate must be verified before sharing.' }
    }

    const hasPhotos = sharedProfile.photos && sharedProfile.photos.length > 0
    const hasEducation = !!sharedProfile.education
    if (!hasPhotos || !hasEducation) {
      return { success: false, error: 'Suggested candidate must have a completed profile (photos and education details required).' }
    }

    const { data, error } = await supabase
      .from('associate_match_shares')
      .insert({
        case_id: validated.caseId,
        associate_id: user.id,
        shared_profile_id: validated.sharedProfileId,
        notes: validated.notes || null,
        client_response: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Get profile name for descriptive activity logs
    const { data: prof } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', validated.sharedProfileId)
      .single()

    const profName = prof ? `${prof.first_name} ${prof.last_name}` : 'Matrimonial Profile'

    // Log activity
    await supabase.from('associate_activities').insert({
      case_id: validated.caseId,
      associate_id: user.id,
      activity_type: 'profile_shared',
      description: `Shared profile of ${profName} with client.`,
      metadata: { share_id: data.id, profile_id: validated.sharedProfileId },
    })

    revalidatePath(`/associate/cases/${validated.caseId}`)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to share profile.' }
  }
}

export async function updateShareResponse(rawInput: any) {
  // Can be called by client/user or associate assisting them
  try {
    const { supabase } = await getAssociateSession()
    // Directly update response
    const { data, error } = await supabase
      .from('associate_match_shares')
      .update({
        client_response: rawInput.clientResponse,
        client_response_at: new Date().toISOString(),
        notes: rawInput.notes || null,
      })
      .eq('id', rawInput.shareId)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('associate_activities').insert({
      case_id: data.case_id,
      associate_id: data.associate_id,
      activity_type: 'match_feedback',
      description: `Client responded "${rawInput.clientResponse}" to shared profile.`,
      metadata: { share_id: data.id, response: rawInput.clientResponse },
    })

    revalidatePath(`/associate/cases/${data.case_id}`)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update profile response.' }
  }
}
