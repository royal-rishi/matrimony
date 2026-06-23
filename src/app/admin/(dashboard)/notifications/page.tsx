import { BroadcastSender } from '@/features/admin'
import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Notifications & Campaigns Manager',
  noIndex: true,
})

export default function AdminNotificationsPage() {
  return <BroadcastSender />
}
