// ============================================================
// SMS SERVICE DI FACTORY
// ============================================================

import { Msg91SmsProvider } from '../providers/msg91-sms.provider'
import { MockSmsProvider } from '../providers/mock-sms.provider'
import { PROVIDER_CONFIG } from '../config/provider.config'
import { SMSService } from './sms.service'

export function createSmsService(): SMSService {
  const authKey = PROVIDER_CONFIG.msg91.authKey
  const useMock = !authKey || process.env.NODE_ENV === 'test'

  const provider = useMock
    ? new MockSmsProvider()
    : new Msg91SmsProvider()

  return new SMSService(provider)
}
