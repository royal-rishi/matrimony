import { redirect } from 'next/navigation'
import { getAdminSession } from '@/features/admin'
import { AdminSidebar, AdminHeader } from '@/features/admin'

/**
 * Admin Panel Root Layout.
 * Enforces admin staff permissions and role-based access.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let adminSession
  try {
    adminSession = await getAdminSession()
  } catch (e: any) {
    if (e?.message?.includes('No active admin session found')) {
      redirect('/admin/login')
    }
    redirect('/unauthorized')
  }

  const { roleId, permissions, profile } = adminSession
  const fullName = `${profile.first_name} ${profile.last_name}`

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminSidebar roleName={roleId} permissions={permissions} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader fullName={fullName} roleName={roleId} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/10">
          {children}
        </main>
      </div>
    </div>
  )
}
