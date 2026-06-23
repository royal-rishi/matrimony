import { ClientProfileView } from '@/features/associate'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  return <ClientProfileView clientId={userId} />
}
