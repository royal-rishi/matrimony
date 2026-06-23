'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Star, Check, CheckCircle2, UserRound,
  CreditCard, Loader2, ArrowRight, FileText
} from 'lucide-react'
import { toast } from 'sonner'

import { LandingHeader } from '@/features/landing/components/landing-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { createOrderSimulation, verifyPaymentSimulation } from '@/features/payments/actions/payment-actions'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    id: 'silver',
    name: 'Silver Plan',
    price: 1999,
    duration: '3 Months',
    desc: 'Perfect for active seekers wanting direct contact.',
    color: 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900',
    btnColor: 'border-zinc-300 text-zinc-800 hover:bg-zinc-50',
    features: [
      'View 50 verified contact numbers',
      'Direct chat with matches',
      'Standout profile badge',
      'Standard customer support'
    ]
  },
  {
    id: 'gold',
    name: 'Gold Plan',
    price: 3999,
    duration: '6 Months',
    desc: 'Our most popular plan with coordinator assist.',
    color: 'border-pink-500 shadow-lg shadow-pink-100/50 dark:shadow-none bg-white dark:bg-zinc-900 -translate-y-1',
    btnColor: 'bg-pink-600 hover:bg-pink-700 text-white shadow-sm',
    popular: true,
    features: [
      'View 150 verified contact numbers',
      'Direct chat with matches',
      'Highlighted search listing',
      '1 Relationship Coordinator call/month',
      'Priority support response'
    ]
  },
  {
    id: 'associate_assist',
    name: 'Matchmaker Assist',
    price: 4999,
    duration: '6 Months',
    desc: 'Hire a dedicated local associate to find, screen & introduce the best matches personally.',
    color: 'border-rose-400 shadow-lg shadow-rose-100/50 dark:shadow-none bg-white dark:bg-zinc-900',
    btnColor: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    popular: false,
    highlight: true,
    features: [
      'Dedicated Personal Matchmaker',
      'Offline candidate screening',
      'Direct chat with your matchmaker',
      '100 verified contact number views',
      'Direct family introductions'
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum Plan',
    price: 7999,
    duration: '12 Months',
    desc: 'Full elite access with a dedicated personal matchmaker.',
    color: 'border-purple-500 bg-white dark:bg-zinc-900',
    btnColor: 'border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-500',
    features: [
      'Unlimited contact views',
      'Dedicated Personal Matchmaker',
      'Direct family introductions',
      'Offline match meeting support',
      'Advanced AI compatibility matching'
    ]
  }
]

export default function MembershipPage() {
  const [profile, setProfile] = useState<any>(null)
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  
  // Checkout flow states
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'success'>('info')
  const [simulatedOrderId, setSimulatedOrderId] = useState('')
  const router = useRouter()

  // Load user data and billing history
  const loadData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Fetch payments
      const { data: billing } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setBillingHistory(billing || [])
    } catch {
      toast.error('Failed to load billing ledger.')
    } finally {
      setIsLoadingData(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Start Razorpay Checkout Simulation
  const handleUpgradeClick = async (plan: any) => {
    setSelectedPlan(plan)
    setIsCheckoutOpen(true)
    setCheckoutStep('info')
    
    // Create order simulation on backend
    try {
      const result = await createOrderSimulation(plan.id, plan.price)
      if (result.error) {
        toast.error('Failed to create order: ' + result.error)
      } else if (result.orderId) {
        setSimulatedOrderId(result.orderId)
      }
    } catch {
      toast.error('Order creation network failure.')
    }
  }

  // Confirm Simulated Payment
  const handleConfirmPayment = async () => {
    if (!simulatedOrderId || !selectedPlan) return

    setIsProcessingCheckout(true)
    const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 15)}`
    const mockSignature = `sig_${Math.random().toString(36).substring(2, 15)}`

    try {
      const result = await verifyPaymentSimulation(
        simulatedOrderId,
        mockPaymentId,
        mockSignature,
        selectedPlan.id,
        selectedPlan.price
      )

      if (result.error) {
        toast.error('Payment verification failed: ' + result.error)
      } else {
        setCheckoutStep('success')
        toast.success(`Success! Upgraded to ${selectedPlan.name}.`)
        
        // Reload dashboard/billing data
        loadData()
      }
    } catch {
      toast.error('Network error during webhook payment confirmation.')
    } finally {
      setIsProcessingCheckout(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />

      <main className="flex-grow py-12 px-4 max-w-6xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white font-heading">
            Upgrade Matrimonial Plan
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Current subscription status: <span className="font-extrabold text-pink-600 uppercase">{profile?.subscription_tier}</span>
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isActiveTier = (plan.id === 'silver' && profile?.subscription_tier === 'premium_gold') ||
                                 (plan.id === 'gold' && profile?.subscription_tier === 'premium_platinum') ||
                                 (plan.id === 'platinum' && profile?.subscription_tier === 'elite') ||
                                 (plan.id === 'associate_assist' && profile?.subscription_tier === 'elite')

            return (
              <div 
                key={plan.id}
                className={`relative border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-md ${plan.color}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-pink-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-white" />
                    Most Popular
                  </span>
                )}
                {(plan as any).highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <UserRound className="h-3 w-3" />
                    Personal Matchmaker
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-zinc-800 dark:text-white font-serif">{plan.name}</h3>
                    <p className="text-[11px] text-zinc-450 mt-1 leading-snug">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">₹{plan.price.toLocaleString()}</span>
                    <span className="text-zinc-400 text-xs font-semibold">/ {plan.duration}</span>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-zinc-100 text-xs text-zinc-650">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isActiveTier ? (
                    <Button disabled className="w-full h-10 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold uppercase rounded-lg">
                      Active Plan
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleUpgradeClick(plan)}
                      className={`w-full h-10 text-xs font-bold uppercase rounded-lg ${plan.btnColor}`}
                    >
                      {profile?.is_premium ? 'Change Plan' : 'Select Plan'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Invoice / Billing History Table */}
        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-black text-zinc-850 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500" />
              Invoices & Billing History
            </CardTitle>
            <CardDescription className="text-xs">Access past receipts and checkout logs</CardDescription>
          </CardHeader>
          <CardContent>
            {billingHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 font-semibold border border-dashed rounded-xl">
                No billing history recorded. Start search and select a plan to upgrade.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-zinc-600">
                  <thead className="bg-zinc-50 text-zinc-500 font-bold border-b text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Payment ID</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((bill) => (
                      <tr key={bill.id} className="border-b hover:bg-zinc-50/50 transition-colors">
                        <td className="p-3 font-semibold text-zinc-700">{bill.razorpay_order_id}</td>
                        <td className="p-3 font-medium text-zinc-400">{bill.razorpay_payment_id || 'Pending'}</td>
                        <td className="p-3 font-bold">₹{bill.amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            bill.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400" suppressHydrationWarning>{new Date(bill.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      {/* Razorpay Simulation Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-2xl border border-zinc-200">
          {checkoutStep === 'info' ? (
            <div className="space-y-6">
              <DialogHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-pink-50 flex items-center justify-center mb-2">
                  <CreditCard className="h-6 w-6 text-pink-600" />
                </div>
                <DialogTitle className="text-xl font-black text-zinc-800 font-heading">Razorpay Secure Checkout</DialogTitle>
                <DialogDescription className="text-xs">
                  Simulating Order checkout flow for {selectedPlan?.name}
                </DialogDescription>
              </DialogHeader>

              <div className="bg-zinc-50 border p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Order ID:</span>
                  <span className="font-semibold text-zinc-700">{simulatedOrderId || 'Generating...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Upgrade Plan:</span>
                  <span className="font-bold text-pink-600 uppercase">{selectedPlan?.id}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-black">
                  <span>Payable Amount:</span>
                  <span className="text-sm">₹{selectedPlan?.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-pink-50/50 border border-pink-100 text-[10px] text-pink-700 leading-relaxed">
                <strong>💡 Matrimony Checkout Simulation Mode:</strong> RishtaJodo matches Razorpay checkout triggers. Click the &quot;Simulate Payment Success&quot; button below to approve order verification.
              </div>

              <DialogFooter className="flex sm:flex-row gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 border-zinc-200 text-xs font-semibold h-10"
                >
                  Cancel Order
                </Button>
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={isProcessingCheckout || !simulatedOrderId}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold h-10 shadow-sm"
                >
                  {isProcessingCheckout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Simulate Payment Success'
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6 py-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 animate-bounce">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-zinc-800 font-heading">Payment Verified Successfully!</h3>
                <p className="text-xs text-zinc-550 max-w-sm mx-auto leading-relaxed">
                  Your profile has been upgraded to Premium status. Relational visitor logs, unblurred candidate albums, and chat parameters are now unlocked.
                </p>
              </div>

              <Button 
                onClick={() => {
                  setIsCheckoutOpen(false)
                  router.push('/dashboard')
                }}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-10 shadow-md"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
