import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { ChatLayout } from '@/features/chat'
import { LandingHeader } from '@/features/landing/components/landing-header'

export const metadata = {
  title: 'Messages – Rishtajodo Matrimony',
  description: 'Chat securely with your matched connections on Rishtajodo.',
}

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as unknown as Profile | null

  if (profileError || !profile) {
    redirect('/onboarding')
  }

  if (profile.is_deleted) {
    redirect('/account-deleted')
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <LandingHeader />
      <main className="flex-grow">
        <ChatLayout currentProfile={profile!} />
      </main>
    </div>
  )
}
