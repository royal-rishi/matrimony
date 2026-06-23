import { CaseDetail } from '@/features/associate'

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const { caseId } = await params
  return <CaseDetail caseId={caseId} />
}
