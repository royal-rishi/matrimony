'use server'

import { getAssociateSession } from './helper'
import { bankAccountSchema, withdrawalRequestSchema } from '../validators/wallet'
import { revalidatePath } from 'next/cache'

export async function getWalletSummary() {
  try {
    const { supabase, user } = await getAssociateSession()

    // Get wallet balance
    const { data: assoc, error: assocError } = await supabase
      .from('associates')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    if (assocError) throw assocError

    // Calculate total earnings (sum of all credits in ledger)
    const { data: earnings, error: earningsError } = await supabase
      .from('associate_commission_ledger')
      .select('amount')
      .eq('associate_id', user.id)
      .eq('is_credit', true)

    if (earningsError) throw earningsError

    const totalEarned = (earnings || []).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)

    // Count pending withdrawals
    const { count: pendingWithdrawals, error: pendingError } = await supabase
      .from('associate_withdrawal_requests')
      .select('*', { count: 'exact', head: true })
      .eq('associate_id', user.id)
      .eq('status', 'pending')

    if (pendingError) throw pendingError

    return {
      success: true,
      data: {
        walletBalance: Number(assoc?.wallet_balance || 0),
        totalEarned,
        pendingWithdrawals: pendingWithdrawals || 0,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch wallet summary.' }
  }
}

export async function getCommissionLedger() {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data, error } = await supabase
      .from('associate_commission_ledger')
      .select('*')
      .eq('associate_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch commission ledger.' }
  }
}

export async function saveBankAccount(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = bankAccountSchema.parse(rawInput)

    // Set all other accounts to not primary if this is primary (or make this primary if first account)
    const { data: existingAccounts } = await supabase
      .from('associate_bank_accounts')
      .select('id')
      .eq('associate_id', user.id)

    const isFirst = !existingAccounts || existingAccounts.length === 0

    // If first, make it primary.
    const isPrimary = isFirst ? true : false

    const { data, error } = await supabase
      .from('associate_bank_accounts')
      .insert({
        associate_id: user.id,
        account_holder_name: validated.accountHolderName,
        bank_name: validated.bankName,
        account_number: validated.accountNumber,
        ifsc_code: validated.ifscCode,
        is_primary: isPrimary,
        is_verified: false, // requires admin verification
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/associate/wallet')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save bank account.' }
  }
}

export async function getSavedBankAccounts() {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data, error } = await supabase
      .from('associate_bank_accounts')
      .select('*')
      .eq('associate_id', user.id)
      .order('is_primary', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch bank accounts.' }
  }
}

export async function requestWithdrawal(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = withdrawalRequestSchema.parse(rawInput)

    // Check balance
    const { data: assoc } = await supabase
      .from('associates')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    const balance = Number(assoc?.wallet_balance || 0)
    if (balance < validated.amount) {
      throw new Error(`Insufficient wallet balance. You only have ₹${balance.toFixed(2)}`)
    }

    // Debit wallet balance first, or record withdrawal request (our DB trigger or server action must handle balance deduction)
    // Wait, the migration doesn't automatically deduct from wallet_balance when withdrawal request is created;
    // but the commission ledger trigger `sync_wallet_from_ledger` deducts wallet balance whenever a DEBIT is inserted.
    // So when withdrawal request is approved or created, let's deduct.
    // The implementation plan says: "Withdrawal requests require status = pending ... and admin approval step before wallet_balance changes."
    // So the balance is deducted when withdrawal is approved/processed.
    // Wait, let's lock the balance or check it. In this action we insert the withdrawal request.

    const { data, error } = await supabase
      .from('associate_withdrawal_requests')
      .insert({
        associate_id: user.id,
        bank_account_id: validated.bankAccountId,
        amount: validated.amount,
        status: 'pending',
        notes: validated.notes || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/associate/wallet')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to submit withdrawal request.' }
  }
}

export async function getWithdrawalHistory() {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data, error } = await supabase
      .from('associate_withdrawal_requests')
      .select(`
        *,
        bank_account:associate_bank_accounts(*)
      `)
      .eq('associate_id', user.id)
      .order('requested_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch withdrawal history.' }
  }
}
