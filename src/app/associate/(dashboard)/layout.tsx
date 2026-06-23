import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'
import { AssociateSidebar, AssociateHeader } from '@/features/associate'

const ASSOCIATE_ROLES = [
  'local_associate',
  'block_associate',
  'district_associate',
  'state_associate',
]

export default async function AssociateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/associate/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single() as unknown as { data: { role: UserRole; first_name: string; last_name: string; avatar_url?: string } | null; error: unknown }

  if (!profile || (!ASSOCIATE_ROLES.includes(profile.role) && profile.role !== 'super_admin')) {
    redirect('/unauthorized')
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Associate Profile'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar navigation */}
      <AssociateSidebar
        role={profile.role}
        fullName={fullName}
        avatarUrl={profile.avatar_url}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header toolbar */}
        <AssociateHeader fullName={fullName} />

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/40 dark:bg-slate-900/10">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
