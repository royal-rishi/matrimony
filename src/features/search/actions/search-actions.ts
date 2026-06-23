'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { searchFilterSchema, type SearchFilterOutput } from '../validators/search-validators'
import type { Profile } from '@/types/database'

export interface SearchResultsResponse {
  profiles: Profile[]
  hasMore: boolean
  totalCount: number
}

/**
 * Server Action to search seeker matrimonial profiles with privacy guards and pagination.
 */
export async function searchProfiles(rawFilters: SearchFilterOutput): Promise<{ data?: SearchResultsResponse; error?: string }> {
  // 1. Validate search filter parameters
  const validated = searchFilterSchema.safeParse(rawFilters)
  if (!validated.success) {
    return { error: 'Invalid search parameters submitted.' }
  }

  const supabase = (await createClient()) as unknown as SupabaseClient
  
  // 2. Fetch searcher authentication session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  let searcherId = ''
  let searcherIsVerified = false
  let connectionIds: string[] = []

  if (user && !authError) {
    searcherId = user.id
    
    // Fetch searcher verification status
    const { data: searcherProfile } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', searcherId)
      .single()
      
    if (searcherProfile) {
      searcherIsVerified = (searcherProfile as { is_verified: boolean }).is_verified || false
    }

    // Fetch accepted matched connection IDs for photo privacy tier validation
    const { data: matchedConnections } = await supabase
      .from('matches')
      .select('profile_id_1, profile_id_2')
      .eq('status', 'connected')
      .or(`profile_id_1.eq.${searcherId},profile_id_2.eq.${searcherId}`)

    if (matchedConnections) {
      connectionIds = (matchedConnections as Array<{ profile_id_1: string; profile_id_2: string }>).map((m) =>
        m.profile_id_1 === searcherId ? m.profile_id_2 : m.profile_id_1
      )
    }
  }

  // 3. Calculate date of birth boundaries from age parameters
  const today = new Date()
  
  // Born on or before maxBirthDate (Must be at least ageMin years old)
  const maxBirthDate = new Date()
  maxBirthDate.setFullYear(today.getFullYear() - validated.data.ageMin)
  const maxBirthStr = maxBirthDate.toISOString().split('T')[0]

  // Born on or after minBirthDate (Must be at most ageMax years old)
  const minBirthDate = new Date()
  minBirthDate.setFullYear(today.getFullYear() - validated.data.ageMax - 1)
  minBirthDate.setDate(minBirthDate.getDate() + 1)
  const minBirthStr = minBirthDate.toISOString().split('T')[0]

  // 4. Construct dynamic supabase database query
  // We limit search results to 'user' role only and active seekers (is_deleted = false)
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'user')
    .eq('is_deleted', false)
    .eq('gender', validated.data.gender)
    .lte('date_of_birth', maxBirthStr)
    .gte('date_of_birth', minBirthStr)

  // Exclude searcher's own profile from results
  if (searcherId) {
    query = query.neq('id', searcherId)
  }

  // Apply optional filters if supplied
  if (validated.data.religion) {
    query = query.eq('religion', validated.data.religion)
  }
  if (validated.data.caste) {
    query = query.eq('caste', validated.data.caste)
  }
  if (validated.data.state) {
    query = query.eq('state', validated.data.state)
  }
  if (validated.data.city) {
    query = query.eq('city', validated.data.city)
  }
  if (validated.data.isVerified) {
    query = query.eq('is_verified', true)
  }
  if (validated.data.isPremium) {
    query = query.eq('is_premium', true)
  }
  
  // Education matching (partial text search)
  if (validated.data.education) {
    query = query.ilike('education', `%${validated.data.education}%`)
  }
  
  // Occupation matching (partial text search)
  if (validated.data.occupation) {
    query = query.ilike('occupation', `%${validated.data.occupation}%`)
  }

  // Income ranges
  if (validated.data.incomeMin !== undefined && validated.data.incomeMin !== null) {
    query = query.gte('annual_income', validated.data.incomeMin)
  }
  if (validated.data.incomeMax !== undefined && validated.data.incomeMax !== null) {
    query = query.lte('annual_income', validated.data.incomeMax)
  }

  // 5. Apply sorting: Premium members display first, then newly registered profiles
  query = query
    .order('is_premium', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  // 6. Pagination Range
  const pageSize = 12
  const startOffset = (validated.data.page - 1) * pageSize
  const endOffset = startOffset + pageSize - 1
  query = query.range(startOffset, endOffset)

  const { data: dbProfiles, count, error: queryError } = await query

  if (queryError) {
    return { error: queryError.message }
  }

  const totalCount = count || 0
  const hasMore = startOffset + (dbProfiles?.length || 0) < totalCount

  // 7. Post-process profiles applying privacy rules (masking names & blurring photos)
  const processedProfiles: Profile[] = (dbProfiles as unknown as Profile[] || []).map((p: Profile) => {
    // Mask last name if set to private
    let lastName = p.last_name
    if (p.last_name_privacy !== false) {
      lastName = lastName ? `${lastName.charAt(0)}.` : ''
    }

    // Check photo visibility restrictions
    let photos = p.photos || []
    const isOwner = p.id === searcherId
    
    if (!isOwner) {
      const tier = p.photo_privacy_tier || 'verified_members'
      
      const shouldBlur = 
        (tier === 'verified_members' && !searcherIsVerified) ||
        (tier === 'connections' && !connectionIds.includes(p.id))

      if (shouldBlur) {
        // Substitute real photos with locked blurred placeholder
        photos = ['/logo/blurred-photo-placeholder.jpg']
      }
    }

    return {
      ...p,
      last_name: lastName,
      photos: photos,
      avatar_url: photos[0] || p.avatar_url || null,
    }
  })

  // 8. Track Search query analytics event
  try {
    console.log(`[PostHog Analytics] Event "profile_search" triggered by user: ${searcherId || 'anonymous'}`, {
      filters: validated.data,
      resultsCount: processedProfiles.length,
      totalMatches: totalCount,
    })
  } catch {
    // Fail silently on analytics to prevent breaking user search
  }

  return {
    data: {
      profiles: processedProfiles,
      hasMore,
      totalCount,
    }
  }
}
