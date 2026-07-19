// ============================================================
// WHATSAPP SERVICE DI FACTORY
// ============================================================

import { Msg91WhatsAppProvider } from '../providers/msg91-whatsapp.provider'
import { MockWhatsAppProvider } from '../providers/mock-whatsapp.provider'
import { PROVIDER_CONFIG } from '../config/provider.config'
import { WhatsAppService } from './whatsapp.service'

export function createWhatsAppService(): WhatsAppService {
  const authKey = PROVIDER_CONFIG.msg91.authKey
  const useMock = !authKey || process.env.NODE_ENV === 'test'

  const provider = useMock
    ? new MockWhatsAppProvider()
    : new Msg91WhatsAppProvider()

  return new WhatsAppService(provider)
}
export type { WhatsAppService }
