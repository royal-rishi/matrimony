// ============================================================
// SMS MODULE — STUB
// Phase 2: MSG91 DLT-compliant SMS templates.
// ============================================================

/**
 * India DLT (Distributed Ledger Technology) requires pre-approved
 * SMS templates registered with the TRAI regulatory body.
 *
 * TODO [Phase 2]:
 *   1. Register entity with MSG91 / Airtel / Vodafone DLT portal
 *   2. Get DLT Entity ID and register all SMS templates
 *   3. Map event types to their DLT Template IDs below
 *   4. Configure MSG91 authkey in environment variables
 */

export interface DltSmsTemplate {
  templateId: string     // DLT registered template ID
  templateBody: string   // DLT-approved message body with #VAR# placeholders
  senderId: string       // 6-character sender ID (e.g. RSTJDO)
}

/**
 * DLT template registry — to be populated in Phase 2.
 * Keys are NotificationEventType strings.
 */
export const DLT_TEMPLATE_REGISTRY: Record<string, DltSmsTemplate> = {
  // Example structure (to be filled with actual DLT IDs):
  // 'match.interest_received': {
  //   templateId: '1234567890123456789',
  //   templateBody: 'You have received an interest from #VAR# on RishtaJodo. Login to view.',
  //   senderId: 'RSTJDO',
  // },
}

export function getSmsTemplate(eventType: string): DltSmsTemplate | null {
  return DLT_TEMPLATE_REGISTRY[eventType] ?? null
}
