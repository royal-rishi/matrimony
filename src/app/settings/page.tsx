import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'
import { SupabaseClient } from '@supabase/supabase-js'
import { Profile } from '@/types/database'
import { LandingHeader } from '@/features/landing/components/landing-header'

export const metadata = {
  title: 'Account Settings | RishtaJodo Matrimony',
  description: 'Manage your credentials, notification channels, and photo privacy tags.',
}

export default async function SettingsPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch complete profile details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // If profile is missing, send user to onboarding
    redirect('/onboarding')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />
      <main className="flex-grow py-8 max-w-4xl mx-auto w-full px-4">
        <SettingsClient 
          profile={profile as Profile} 
          userEmail={user.email || ''} 
        />
      </main>
    </div>
  )
}
