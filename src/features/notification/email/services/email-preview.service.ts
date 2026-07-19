// ============================================================
// EMAIL PREVIEW ENGINE (Admin visual tools)
// ============================================================

import { EmailTemplateResolver } from './email-template.resolver'
import { EmailRenderer } from './email-renderer'
import { EMAIL_CONFIG } from '../config/email.config'

export class EmailPreviewService {
  private readonly templateResolver = new EmailTemplateResolver()

  /**
   * Generates rendered HTML previews for any supported event type,
   * replacing placeholders with either user-specified or mock variables.
   */
  async renderPreview(
    eventType: string,
    customVariables: Record<string, string | number | boolean> = {},
    theme: 'light' | 'dark' | 'brand' | 'auto' = 'brand'
  ): Promise<{ html: string; subject: string; templateFound: boolean }> {
    const template = await this.templateResolver.resolveTemplate(eventType)

    if (!template) {
      return {
        html: `<p style="font-family: sans-serif; color: red;">Error: Template for event '${eventType}' not found.</p>`,
        subject: 'Template Not Found',
        templateFound: false,
      }
    }

    // Merge mock variables with provided variables
    const mockVariables = this.getMockVariables(eventType)
    const mergedVariables = { ...mockVariables, ...customVariables }

    const renderedSubject = this.templateResolver.renderString(template.subject, mergedVariables)
    const renderedBody = this.templateResolver.renderString(template.body, mergedVariables)

    const finalHtml = EmailRenderer.render(renderedBody, renderedSubject, {
      theme: theme || template.theme,
      ctaText: template.ctaText ? this.templateResolver.renderString(template.ctaText, mergedVariables) : undefined,
      ctaUrl: template.ctaUrl ? this.templateResolver.renderString(template.ctaUrl, mergedVariables) : undefined,
    })

    return {
      html: finalHtml,
      subject: renderedSubject,
      templateFound: true,
    }
  }

  /**
   * Helper to return dummy mock values for preview purposes.
   */
  private getMockVariables(eventType: string): Record<string, string | number | boolean> {
    return {
      user_name: 'Rishi Rohan',
      user_id: 'usr-889922',
      profile_id: 'RJ-77382',
      otp: '672910',
      associate_name: 'Priya Sharma',
      meeting_date: 'July 24, 2026',
      meeting_time: '04:30 PM (IST)',
      invoice_number: 'INV-2026-00452',
      payment_amount: 'INR 4,999',
      membership: 'Super Premium Gold',
      renewal_date: 'October 24, 2026',
      support_email: EMAIL_CONFIG.replyTo,
      company_name: EMAIL_CONFIG.branding.companyName,
      website: EMAIL_CONFIG.branding.websiteUrl,
      dashboard_url: EMAIL_CONFIG.branding.dashboardUrl,
      new_email: 'new.rishi@workspace.com',
      match_name: 'Anjali Verma',
      referral_link: 'https://rishtajodo.com/invite/RJS77382',
    }
  }
}
