import { NextResponse } from 'next/server'
import { getWalletSummary, getWithdrawalHistory, requestWithdrawal, getSavedBankAccounts } from '@/features/associate/actions/wallet-actions'

export async function GET() {
  try {
    const summary = await getWalletSummary()
    const history = await getWithdrawalHistory()
    const accounts = await getSavedBankAccounts()

    return NextResponse.json({
      success: true,
      data: {
        summary: summary.success ? summary.data : null,
        withdrawals: history.success ? history.data : [],
        bankAccounts: accounts.success ? accounts.data : [],
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await requestWithdrawal(body)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
