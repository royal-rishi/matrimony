// ============================================================
// WHATSAPP PREVIEW SERVICE
// ============================================================

import { WhatsAppTemplateResolver } from './whatsapp-template.resolver'

export class WhatsAppPreviewService {
  private readonly templateResolver = new WhatsAppTemplateResolver()

  /**
   * Generates mock visual WhatsApp bubble UI previews.
   */
  async renderPreview(
    eventType: string,
    customVariables: Record<string, string | number | boolean> = {}
  ): Promise<{ templateName: string; bodyPreview: string; components: any[]; templateFound: boolean }> {
    const schema = await this.templateResolver.resolveTemplate(eventType)

    if (!schema) {
      return {
        templateName: 'Not Found',
        bodyPreview: 'Template not found.',
        components: [],
        templateFound: false,
      }
    }

    const mockVariables = this.getMockVariables()
    const mergedVariables = { ...mockVariables, ...customVariables }

    // Map named vars to parameter values
    const parameters = schema.variablesMapping.map((key) => {
      const val = mergedVariables[key]
      return val !== undefined ? String(val) : `{{${key}}}`
    })

    // Construct body preview string
    const bodyPreview = `[WhatsApp Template: ${schema.templateName}]\n` +
      `Parameters: ${parameters.join(' | ')}`

    return {
      templateName: schema.templateName,
      bodyPreview,
      components: parameters,
      templateFound: true,
    }
  }

  private getMockVariables(): Record<string, string | number | boolean> {
    return {
      user_name: 'Rishi Rohan',
      otp: '445511',
      associate_name: 'Priya Sharma',
      meeting_date: 'July 24, 2026',
      meeting_time: '04:30 PM (IST)',
      invoice_number: 'INV-2026-00452',
      payment_amount: 'INR 4,999',
      membership: 'Super Premium Gold',
      profile_link: 'https://rishtajodo.com/profile/RJ-77382',
      support_email: 'support@rishtajodo.com',
      website: 'https://rishtajodo.com',
    }
  }
}
