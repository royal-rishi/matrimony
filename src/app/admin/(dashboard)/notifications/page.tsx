import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'
import { NotificationDashboardWrapper } from '@/features/admin/notification/components/NotificationDashboardWrapper'

export const metadata: Metadata = generateMetadata({
  title: 'Notification Operations Center',
  noIndex: true,
})

export default function AdminNotificationsPage() {
  return <NotificationDashboardWrapper defaultTab="dashboard" />
}
