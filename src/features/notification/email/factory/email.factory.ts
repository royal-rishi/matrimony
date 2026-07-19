// ============================================================
// EMAIL SERVICE FACTORY
// ============================================================

import { Msg91EmailProvider } from '../providers/msg91-email.provider'
import { MockEmailProvider } from '../providers/mock-email.provider'
import type { IEmailProvider } from '../providers/email-provider.interface'
import { EmailService } from '../services/email.service'
import { PROVIDER_CONFIG } from '../config/provider.config'

export class EmailFactory {
  /**
   * Instantiates an Email Service with a given provider.
   * If no provider type is specified, resolves automatically based on environment settings.
   */
  static create(providerType?: 'msg91' | 'mock' | IEmailProvider): EmailService {
    let resolvedProvider: IEmailProvider

    if (providerType && typeof providerType !== 'string') {
      resolvedProvider = providerType
    } else if (providerType === 'msg91') {
      resolvedProvider = new Msg91EmailProvider()
    } else if (providerType === 'mock') {
      resolvedProvider = new MockEmailProvider()
    } else {
      // Default to MSG91 in production/development if configured, mock in testing
      const authKey = PROVIDER_CONFIG.msg91.authKey
      const useMock = !authKey || process.env.NODE_ENV === 'test'
      resolvedProvider = useMock ? new MockEmailProvider() : new Msg91EmailProvider()
    }

    return new EmailService(resolvedProvider)
  }
}

// Keep legacy creator function wrapper to prevent compilation breaking changes in other files
export function createEmailService(): EmailService {
  return EmailFactory.create()
}
