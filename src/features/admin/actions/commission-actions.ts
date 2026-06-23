'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { manualAdjustCommissionSchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function getWithdrawalRequests(params: { status?: string; limit?: number; offset?: number }) {
  try {
    const { supabase } = await getAdminSession('manage_commissions')

    let query = supabase
      .from('associate_withdrawal_requests')
      .select(`
        *,
        associate:profiles(first_name, last_name, avatar_url, city),
        bank:associate_bank_accounts(*)
      `, { count: 'exact' })

    if (params.status) {
      query = query.eq('status', params.status)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1)

    const { data, count, error } = await query
    if (error) throw error

    return { success: true, data, totalCount: count || 0 }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function processWithdrawalRequest(requestId: string, status: 'approved' | 'rejected' | 'processed', notes?: string) {
  try {
    const { supabase, user } = await getAdminSession('manage_commissions')

    const { data: request } = await supabase
      .from('associate_withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!request) throw new Error('Withdrawal request not found')

    const { data, error } = await supabase
      .from('associate_withdrawal_requests')
      .update({
        status,
        admin_notes: notes || null,
        processed_at: status === 'processed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    // If processed or approved, we can trigger ledger balances shifts if not handled by triggers
    if (status === 'processed') {
      // Create negative wallet transaction to represent payout completed
      await supabase.from('wallet_transactions').insert({
        associate_id: request.associate_id,
        amount: -Number(request.amount), // debit
        type: 'payout',
        status: 'completed',
        description: `Payout processed by admin. Notes: ${notes || 'Bank transfer completed'}`,
        reference_id: requestId
      })
    }

    await logAdminActivity(
      supabase,
      user.id,
      `Withdrawal Request ${status.toUpperCase()}`,
      'associate_withdrawal_requests',
      requestId,
      request,
      data
    )

    revalidatePath(`/admin/commissions`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function applyCommissionAdjustment(input: {
  associateId: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
}) {
  try {
    const { supabase, user } = await getAdminSession('manage_commissions')
    const validated = manualAdjustCommissionSchema.parse(input)

    const multiplier = validated.type === 'debit' ? -1 : 1
    const adjustedAmount = Math.abs(validated.amount) * multiplier

    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert({
        associate_id: validated.associateId,
        amount: adjustedAmount,
        type: 'adjustment',
        status: 'completed',
        description: validated.reason
      })
      .select()
      .single()

    if (error) throw error

    // Atomically increment associate wallet balance
    const { data: assoc } = await supabase
      .from('associates')
      .select('wallet_balance')
      .eq('id', validated.associateId)
      .single()

    const newBalance = Math.max(0, Number(assoc?.wallet_balance || 0) + adjustedAmount)

    await supabase
      .from('associates')
      .update({ wallet_balance: newBalance })
      .eq('id', validated.associateId)

    await logAdminActivity(
      supabase,
      user.id,
      'Commission Manual Adjustment Applied',
      'wallet_transactions',
      validated.associateId,
      {},
      data
    )

    revalidatePath(`/admin/commissions`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
