'use server'

import { getAssociateSession } from './helper'

export async function getReferralStats() {
  try {
    const { supabase, user } = await getAssociateSession()

    // Query all referrals by this associate (using user.id as referrer_id)
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)

    if (error) throw error

    const stats = {
      total_referrals: referrals?.length || 0,
      registered: 0,
      verified: 0,
      premium: 0,
      personal_matchmaking: 0,
      married: 0,
      total_commission_earned: 0,
    }

    referrals?.forEach((ref: any) => {
      if (ref.referred_user_id || ref.registered_at) stats.registered++
      if (ref.verified_at) stats.verified++
      if (ref.premium_at) stats.premium++
      if (ref.matchmaking_plan_at) stats.personal_matchmaking++
      if (ref.married_at) stats.married++
    })

    // Fetch commission ledger entries for referrals to sum earnings
    const { data: commissions, error: commError } = await supabase
      .from('associate_commission_ledger')
      .select('amount')
      .eq('associate_id', user.id)
      .eq('is_credit', true)
      .not('referral_id', 'is', null)

    if (!commError && commissions) {
      stats.total_commission_earned = commissions.reduce((sum: number, item: any) => sum + Number(item.amount), 0)
    }

    return { success: true, data: stats }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch referral stats.' }
  }
}

export async function getReferralList() {
  try {
    const { supabase, user } = await getAssociateSession()

    // Fetch referrals with referred profile details
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_profile:profiles!referrals_referred_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          city,
          state,
          is_verified,
          is_premium
        )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch referrals.' }
  }
}

export async function generateQRCodeData() {
  try {
    const { user } = await getAssociateSession()
    // Referral code is profile.referral_code
    // Let's build a clean signup URL containing the referral code
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://rishtajodo.in'
    const referralCode = user.id.slice(0, 8).toUpperCase() // Fallback if referral code isn't on profile
    
    // Check actual referral code
    const { supabase } = await getAssociateSession()
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single()

    const code = profile?.referral_code || referralCode
    const url = `${origin}/signup?ref=${code}`

    return { success: true, data: { url, code } }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate referral QR code.' }
  }
}
