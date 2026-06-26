import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingHeader } from '@/features/landing/components/landing-header'
import { MembershipPlans } from '@/features/landing/components/membership-plans'
import { Footer } from '@/features/landing/components/footer'
import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Membership Plans & Pricing | Dil Se Dil Ka Milan',
  description: 'Choose a matrimonial plan and upgrade your membership to unlock direct contact details, verified matching, and dedicated personal matchmaker support.',
  path: '/pricing',
})

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/membership')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />
      <main className="flex-grow pt-10">
        <MembershipPlans />
      </main>
      <Footer />
    </div>
  )
}
