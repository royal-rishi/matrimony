// ============================================================
// EMAIL TEMPLATE RESOLVER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { EMAIL_TEMPLATES_REGISTRY } from '../templates/email-templates.registry'
import type { RegisteredEmailTemplate } from '../templates/email-templates.registry'
import { EMAIL_CONFIG } from '../config/email.config'
import { MSG91_TEMPLATE_MAP } from '../templates/template-map'

export class EmailTemplateResolver {
  /**
   * Resolves email template details (subject, body, theme, CTA details).
   * First queries the `notification_templates` table in the database.
   * If not found or inactive, falls back to the local static EMAIL_TEMPLATES_REGISTRY.
   */
  async resolveTemplate(
    eventType: string,
    language: string = EMAIL_CONFIG.defaultLocale
  ): Promise<RegisteredEmailTemplate | null> {
    try {
      const supabase = await createClient()

      // 1. Fetch matching active email templates from database
      const { data: dbTemplates, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('channel', 'email')
        .eq('event', eventType)
        .eq('status', 'active')

      if (!error && dbTemplates && dbTemplates.length > 0) {
        // Try exact match on language, otherwise fallback to default
        const matched = dbTemplates.find((t: any) => t.language === language)
        if (matched) {
          return {
            subject: matched.subject || matched.name,
            body: matched.body,
            theme: (matched.metadata?.theme || 'brand') as any,
            ctaText: matched.metadata?.ctaText,
            ctaUrl: matched.metadata?.ctaUrl,
            templateId: matched.metadata?.templateId || MSG91_TEMPLATE_MAP[eventType],
          }
        }

        const defaultMatched = dbTemplates.find((t: any) => t.language === EMAIL_CONFIG.defaultLocale)
        if (defaultMatched) {
          return {
            subject: defaultMatched.subject || defaultMatched.name,
            body: defaultMatched.body,
            theme: (defaultMatched.metadata?.theme || 'brand') as any,
            ctaText: defaultMatched.metadata?.ctaText,
            ctaUrl: defaultMatched.metadata?.ctaUrl,
            templateId: defaultMatched.metadata?.templateId || MSG91_TEMPLATE_MAP[eventType],
          }
        }
      }
    } catch (err) {
      console.warn('[EmailTemplateResolver] Database resolve warning, falling back to registry:', err)
    }

    // 2. Fall back to static templates registry
    const registryTemplate = EMAIL_TEMPLATES_REGISTRY[eventType]
    if (registryTemplate) {
      return {
        ...registryTemplate,
        templateId: MSG91_TEMPLATE_MAP[eventType],
      }
    }

    console.error(`[EmailTemplateResolver] Template not resolved for event: ${eventType}`)
    return null
  }

  /**
   * Replaces double curly bracket variables in template content.
   */
  renderString(str: string, variables: Record<string, string | number | boolean>): string {
    let rendered = str
    
    // Substitute all {{variable}} occurrences
    const regex = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g
    rendered = rendered.replace(regex, (match, key) => {
      const value = variables[key]
      return value !== undefined ? String(value) : match
    })

    return rendered
  }
}
