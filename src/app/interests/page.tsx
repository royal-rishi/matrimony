import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InterestsClient } from '@/features/matching/components/interests-client'
import { LandingHeader } from '@/features/landing/components/landing-header'

export const metadata = {
  title: 'Matrimonial Invitations – Rishtajodo',
  description: 'Manage invitations and accept connections to unlock private chat.',
}

export const dynamic = 'force-dynamic'

export default async function InterestsPage() {
  const supabase = await createClient()

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch matches (interests)
  const { data: matches } = (await supabase
    .from('matches')
    .select(`
      id,
      status,
      initiated_by_id,
      created_at,
      profile_id_1,
      profile_id_2
    `)
    .or(`profile_id_1.eq.${user.id},profile_id_2.eq.${user.id}`)) as any

  // 3. Hydrate profiles
  const received: any[] = []
  const sent: any[] = []
  const accepted: any[] = []
  const declined: any[] = []

  if (matches && matches.length > 0) {
    const otherProfileIds = matches.map((m: any) => 
      m.profile_id_1 === user.id ? m.profile_id_2 : m.profile_id_1
    )

    const { data: profiles } = (await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, city, state, religion, occupation, education, date_of_birth')
      .in('id', otherProfileIds)) as any

    matches.forEach((m: any) => {
      const otherId = m.profile_id_1 === user.id ? m.profile_id_2 : m.profile_id_1
      const otherProfile = profiles?.find((p: any) => p.id === otherId)
      if (!otherProfile) return

      const record = {
        id: m.id,
        status: m.status,
        initiated_by_id: m.initiated_by_id,
        created_at: m.created_at,
        other_profile: otherProfile
      }

      if (m.status === 'accepted' || m.status === 'connected') {
        accepted.push(record)
      } else if (m.status === 'rejected') {
        declined.push(record)
      } else if (m.status === 'pending') {
        if (m.initiated_by_id === user.id) {
          sent.push(record)
        } else {
          received.push(record)
        }
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />
      <main className="flex-grow">
        <InterestsClient
          initialReceived={received}
          initialSent={sent}
          initialAccepted={accepted}
          initialDeclined={declined}
        />
      </main>
    </div>
  )
}
