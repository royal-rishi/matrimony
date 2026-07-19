// ============================================================
// WHATSAPP COMPONENT LAYOUT RENDERER
// ============================================================

import type { WhatsAppTemplateSchema, WhatsAppMediaType } from '../types/whatsapp.types'

export class WhatsAppRenderer {
  /**
   * Translates named variables and media attachments into Meta/MSG91 positional components.
   */
  static renderComponents(
    schema: WhatsAppTemplateSchema,
    variables: Record<string, string | number | boolean>,
    options: {
      mediaUrl?: string
      mediaType?: WhatsAppMediaType
    } = {}
  ): any[] {
    const components: any[] = []

    // 1. Build Body parameters (substitutes positional variables {{1}}, {{2}} based on order)
    const bodyParams = schema.variablesMapping.map((key) => {
      const val = variables[key]
      return {
        type: 'text',
        text: val !== undefined ? String(val) : '',
      }
    })

    if (bodyParams.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParams,
      })
    }

    // 2. Build Header media parameter (image | video | document)
    const activeMediaType = options.mediaType || schema.mediaType
    const activeMediaUrl = options.mediaUrl

    if (activeMediaUrl && activeMediaType) {
      const mediaParam: Record<string, any> = { type: activeMediaType }

      if (activeMediaType === 'image') {
        mediaParam.image = { link: activeMediaUrl }
      } else if (activeMediaType === 'video') {
        mediaParam.video = { link: activeMediaUrl }
      } else if (activeMediaType === 'document') {
        mediaParam.document = {
          link: activeMediaUrl,
          filename: activeMediaUrl.split('/').pop() || 'document.pdf',
        }
      }

      components.push({
        type: 'header',
        parameters: [mediaParam],
      })
    }

    // 3. Build Button parameters (dynamic URL links, quick replies, or OTP copy codes)
    if (schema.buttonVariablesMapping && schema.buttonVariablesMapping.length > 0) {
      for (const btn of schema.buttonVariablesMapping) {
        const val = variables[btn.valueKey]
        if (val !== undefined) {
          components.push({
            type: 'button',
            sub_type: btn.type,
            index: String(btn.index),
            parameters: [
              {
                type: 'text',
                text: String(val),
              },
            ],
          })
        }
      }
    }

    return components
  }
}
