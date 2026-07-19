// ============================================================
// EMAIL MODULE — STUB
// Phase 2: React Email templates and Resend integration.
// ============================================================

/**
 * EmailTemplateRenderer — Phase 2 stub.
 *
 * In Phase 2, this will use the `react-email` package to render
 * JSX-based email templates into HTML strings for delivery via Resend.
 *
 * TODO [Phase 2]:
 *   1. Install: npm install react-email @react-email/components resend
 *   2. Create templates/ directory with .tsx email template files
 *   3. Render templates with: render(<MyTemplate data={...} />)
 *   4. Pass rendered HTML to EmailNotificationProvider
 */

export interface EmailRenderInput {
  templateKey: string
  data: Record<string, string | number | boolean>
  recipientEmail: string
  recipientName?: string
}

export interface EmailRenderResult {
  html: string
  plainText: string
  subject: string
}

export async function renderEmailTemplate(
  _input: EmailRenderInput
): Promise<EmailRenderResult> {
  // TODO [Phase 2]: Implement with react-email
  throw new Error('Email template rendering not yet implemented (Phase 2)')
}
