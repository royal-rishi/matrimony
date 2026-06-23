import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/features/profiles'
import { LandingHeader } from '@/features/landing/components/landing-header'

export const metadata = {
  title: 'Profile Onboarding Wizard – Rishtajodo Matrimony',
  description: 'Complete your matrimonial profile details to search and find suitable life partners.',
}

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Verify authentication session
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />
      <main className="flex-grow">
        <OnboardingWizard />
      </main>
    </div>
  )
}
