import { createClient } from '@/lib/supabase/server'

export async function getAssociateSession() {
  const supabase = (await createClient()) as any
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized: No active session')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Unauthorized: Profile not found')
  }

  const ASSOCIATE_ROLES = [
    'local_associate',
    'block_associate',
    'district_associate',
    'state_associate',
    'super_admin',
  ]

  if (!ASSOCIATE_ROLES.includes(profile.role)) {
    throw new Error('Unauthorized: Insufficient privileges')
  }

  return { supabase, user, profile }
}

export async function checkAssociateTerritoryAccess(
  supabase: any,
  associateId: string,
  userId: string
): Promise<boolean> {
  // Fetch associate profile to check role
  const { data: associateProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', associateId)
    .single()

  if (associateProfile?.role === 'super_admin') {
    return true // super_admin bypasses territory restriction
  }

  // Fetch user profile state/city
  const { data: userProfile, error: userErr } = await supabase
    .from('profiles')
    .select('state, city')
    .eq('id', userId)
    .single()

  if (userErr || !userProfile) {
    return false // User profile not found
  }

  // Fetch associate territory assignment
  const { data: territory, error: terrErr } = await supabase
    .from('territory_assignments')
    .select('*')
    .eq('associate_id', associateId)
    .maybeSingle()

  if (terrErr || !territory) {
    return false // Associate has no territory assigned, deny access
  }

  // Validate based on territory level
  const level = territory.level // 'state' | 'district' | 'block'
  const stateMatches = territory.state.toLowerCase() === userProfile.state.toLowerCase()

  if (!stateMatches) {
    return false
  }

  if (level === 'state') {
    return true
  }

  if (level === 'district') {
    // Compare district with user's city
    return !!territory.district && territory.district.toLowerCase() === userProfile.city.toLowerCase()
  }

  if (level === 'block') {
    // Compare block with user's city
    return !!territory.block && territory.block.toLowerCase() === userProfile.city.toLowerCase()
  }

  return false
}

export async function getAssociateProfileDetails() {
  const { supabase, user, profile } = await getAssociateSession()

  const { data: associate } = await (supabase.from('associates') as any)
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: kyc } = await (supabase.from('associate_kyc') as any)
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: bankAccount } = await (supabase.from('associate_bank_accounts') as any)
    .select('*')
    .eq('associate_id', user.id)
    .maybeSingle()

  const { data: territory } = await (supabase.from('territory_assignments') as any)
    .select('*')
    .eq('associate_id', user.id)
    .maybeSingle()

  return {
    success: true,
    data: {
      profile,
      associate,
      kyc,
      bankAccount,
      territory
    }
  }
}
