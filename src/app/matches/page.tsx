import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MatchesClient } from '@/features/matching/components/matches-client'
import { LandingHeader } from '@/features/landing/components/landing-header'

export const metadata = {
  title: 'Find Life Partners | Dil Se Dil Ka Milan',
  description: 'Search compatible matrimonial matches based on age, caste, state, and career status.',
}

export const dynamic = 'force-dynamic'

interface MatchesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const resolvedParams = await searchParams
  const initialCategory = (resolvedParams.category as string) || 'recommended'

  const supabase = await createClient()

  // Verify auth session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch current user details to check premium subscription
  const { data: profile } = (await supabase
    .from('profiles')
    .select('is_premium, subscription_tier')
    .eq('id', user.id)
    .single()) as any

  const isPremium = profile?.is_premium ?? false

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />
      <main className="flex-grow">
        <MatchesClient 
          initialCategory={initialCategory} 
          isPremium={isPremium} 
        />
      </main>
    </div>
  )
}
