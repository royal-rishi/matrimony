import { createClient } from '@/lib/supabase/server'
import { SupportClient } from './support-client'
import { SupabaseClient } from '@supabase/supabase-js'
import { LandingHeader } from '@/features/landing/components/landing-header'

export const metadata = {
  title: 'Help & Support Center | RishtaJodo Matrimony',
  description: 'Submit tickets to our support managers, read FAQs, and report profile safety issues.',
}

export default async function SupportPage() {
  const supabase = (await createClient()) as unknown as SupabaseClient
  const { data: { user } } = await supabase.auth.getUser()

  let defaultName = ''
  let defaultEmail = ''
  const isAuthenticated = !!user

  if (user) {
    defaultEmail = user.email || ''
    
    // Fetch profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profile) {
      defaultName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />
      <main className="flex-grow py-8 max-w-5xl mx-auto w-full px-4">
        <SupportClient 
          isAuthenticated={isAuthenticated}
          defaultName={defaultName}
          defaultEmail={defaultEmail}
        />
      </main>
    </div>
  )
}
