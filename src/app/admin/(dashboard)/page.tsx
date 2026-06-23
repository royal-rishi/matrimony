import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

import { getDashboardKPIs } from '@/features/admin'
import { DashboardOverview } from '@/features/admin'

export const metadata: Metadata = generateMetadata({
  title: 'Admin Dashboard',
  noIndex: true,
})

export default async function AdminDashboardPage() {
  const res = await getDashboardKPIs()
  const kpis = res.success ? res.data : null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-none">
            Welcome to the RishtaJoro Operations Control Center.
          </p>
        </div>
      </div>

      <DashboardOverview kpis={kpis} />
    </div>
  )
}
