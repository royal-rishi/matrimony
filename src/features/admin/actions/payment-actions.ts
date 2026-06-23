'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { refundApproveSchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function searchPayments(params: {
  search?: string
  status?: string
  limit?: number
  offset?: number
}) {
  try {
    const { supabase } = await getAdminSession('manage_payments')

    let query = supabase
      .from('payments')
      .select(`
        *,
        user:profiles(first_name, last_name, avatar_url, city)
      `, { count: 'exact' })

    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.search) {
      query = query.or(`razorpay_order_id.ilike.%${params.search}%,razorpay_payment_id.ilike.%${params.search}%`)
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

export async function approveRefund(input: { paymentId: string; approved: boolean; reason: string }) {
  try {
    const { supabase, user } = await getAdminSession('manage_payments')
    const validated = refundApproveSchema.parse(input)

    const { data: oldData } = await supabase.from('payments').select('*').eq('id', validated.paymentId).single()
    if (!oldData) throw new Error('Payment record not found')

    if (!validated.approved) {
      await logAdminActivity(supabase, user.id, 'Refund Request Rejected', 'payments', validated.paymentId, { reason: validated.reason })
      return { success: true, message: 'Refund request declined.' }
    }

    // Trigger update to refunded
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', validated.paymentId)
      .select()
      .single()

    if (error) throw error

    // Deactivate subscriptions if any
    await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('payment_id', validated.paymentId)

    await logAdminActivity(supabase, user.id, 'Refund Approved', 'payments', validated.paymentId, oldData, data)
    revalidatePath(`/admin/payments`)

    return { success: true, message: 'Refund approved and transaction updated.' }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
