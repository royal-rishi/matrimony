// ============================================================
// WHATSAPP TEMPLATE RESOLVER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { WHATSAPP_TEMPLATES_REGISTRY } from '../templates/whatsapp-templates.registry'
import type { WhatsAppTemplateSchema } from '../types/whatsapp.types'
import { WHATSAPP_CONFIG } from '../config/whatsapp.config'

export class WhatsAppTemplateResolver {
  /**
   * Resolves template specifications based on eventType and locale.
   * Checks database notification_templates first, falling back to static registry.
   */
  async resolveTemplate(
    eventType: string,
    language: string = WHATSAPP_CONFIG.defaultLanguage
  ): Promise<WhatsAppTemplateSchema | null> {
    try {
      const supabase = await createClient()

      const { data: dbTemplates, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('channel', 'whatsapp')
        .eq('event', eventType)
        .eq('status', 'active')

      if (!error && dbTemplates && dbTemplates.length > 0) {
        const matched = dbTemplates.find((t: any) => t.language === language)
        if (matched) {
          return {
            templateName: matched.subject || matched.name, // Holds Wa template name in subject/name fields
            variablesMapping: matched.metadata?.variablesMapping || [],
            mediaType: matched.metadata?.mediaType,
            buttonVariablesMapping: matched.metadata?.buttonVariablesMapping,
          }
        }

        const defaultMatched = dbTemplates.find((t: any) => t.language === WHATSAPP_CONFIG.defaultLanguage)
        if (defaultMatched) {
          return {
            templateName: defaultMatched.subject || defaultMatched.name,
            variablesMapping: defaultMatched.metadata?.variablesMapping || [],
            mediaType: defaultMatched.metadata?.mediaType,
            buttonVariablesMapping: defaultMatched.metadata?.buttonVariablesMapping,
          }
        }
      }
    } catch (err) {
      console.warn('[WhatsAppTemplateResolver] DB resolve warning, using registry fallback:', err)
    }

    const registryTemplate = WHATSAPP_TEMPLATES_REGISTRY[eventType]
    if (registryTemplate) {
      return registryTemplate
    }

    console.error(`[WhatsAppTemplateResolver] Wa template not found for event: ${eventType}`)
    return null
  }
}
