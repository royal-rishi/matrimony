'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import type { SubscriptionTier } from '@/types/database'

/**
 * Simulates creation of Razorpay Order on server side.
 */
export async function createOrderSimulation(planName: string, amount: number) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Unauthorized session.' }

  const orderId = `order_${Math.random().toString(36).substring(2, 15)}`

  // Insert pending payment record
  const { error } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      razorpay_order_id: orderId,
      amount: amount,
      currency: 'INR',
      status: 'pending'
    })

  if (error) return { error: error.message }
  return { success: true, orderId }
}

/**
 * Simulates Razorpay payment verification webhook / client response.
 * Updates user profile to Premium and inserts subscription records.
 */
export async function verifyPaymentSimulation(
  orderId: string, 
  paymentId: string, 
  signature: string, 
  planName: 'silver' | 'gold' | 'platinum' | 'associate_assist', 
  _amount: number
) {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Unauthorized session.' }

  // 1. Update payment status to success
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'success',
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_order_id', orderId)

  if (paymentError) return { error: paymentError.message }

  // Map input plan to database tier enum
  let dbTier: SubscriptionTier = 'free'
  let durationMonths = 3

  if (planName === 'silver') {
    dbTier = 'premium_gold' // corresponds to Silver plan
    durationMonths = 3
  } else if (planName === 'gold') {
    dbTier = 'premium_platinum' // corresponds to Gold plan
    durationMonths = 6
  } else if (planName === 'platinum') {
    dbTier = 'elite' // corresponds to Platinum plan
    durationMonths = 12
  } else if (planName === 'associate_assist') {
    dbTier = 'elite' // corresponds to Associate Assist plan
    durationMonths = 6
  }

  // 2. Fetch payment ID
  const { data: payment } = await supabase
    .from('payments')
    .select('id')
    .eq('razorpay_order_id', orderId)
    .single()

  const paymentRecordId = payment?.id || null

  // 3. Create or update subscription
  const startsAt = new Date()
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths)

  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      payment_id: paymentRecordId,
      tier: dbTier,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true
    })

  if (subError) return { error: subError.message }

  // 4. Set profile as premium
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_premium: true,
      subscription_tier: dbTier
    })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  // 5. If Platinum or Associate Assist is purchased, auto-assign a Local Associate & create Case CRM records
  if (planName === 'platinum' || planName === 'associate_assist') {
    try {
      // Find a local associate profile in the system to assign to this user
      const { data: assoc } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'local_associate')
        .limit(1)
        .maybeSingle()

      if (assoc) {
        // Check if assignment already exists
        const { data: existingAssignment } = await (supabase.from('user_assignments') as any)
          .select('id')
          .eq('user_id', user.id)
          .eq('local_associate_id', assoc.id)
          .is('unassigned_at', null)
          .maybeSingle()

        if (!existingAssignment) {
          // Create user assignment
          await (supabase.from('user_assignments') as any).insert({
            user_id: user.id,
            local_associate_id: assoc.id,
            assigned_at: new Date().toISOString(),
          })

          // Generate unique case number RC-YYYY-XXXX
          const year = new Date().getFullYear()
          const rand = Math.floor(1000 + Math.random() * 9000)
          const caseNumber = `RC-${year}-${rand}`

          // Create associate case
          const { data: caseRecord } = await (supabase.from('associate_cases') as any)
            .insert({
              case_number: caseNumber,
              user_id: user.id,
              associate_id: assoc.id,
              status: 'new',
              case_priority: 'normal',
              last_activity_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (caseRecord) {
            // Create initial activity
            await (supabase.from('associate_activities') as any).insert({
              case_id: caseRecord.id,
              associate_id: assoc.id,
              activity_type: 'case_creation',
              description: 'Matrimonial personal matchmaking case created via Premium Matchmaker upgrade.',
              metadata: { priority: 'normal' },
            })
          }
        }
      }
    } catch (err) {
      console.error('Failed to auto-assign local associate:', err)
    }
  }

  // Trigger system notification
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Membership Upgrade Active! 🚀',
        message: `Congratulations! Your ${planName.toUpperCase()} plan is now active. Enjoy premium matchmaking benefits.`,
        type: 'payment',
        is_read: false
      })
  } catch (err) {
    console.error('Failed to trigger payment success notification:', err)
  }

  revalidatePath('/membership')
  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return { success: true }
}
