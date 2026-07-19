// ============================================================
// OTP SERVICE DI FACTORY
// ============================================================

import { OTPService } from './otp.service'
import { Msg91SmsProvider } from '../providers/msg91-sms.provider'
import { Msg91WhatsAppProvider } from '../providers/msg91-whatsapp.provider'
import { MockOtpProvider } from '../providers/mock-otp.provider'
import { OTP_CONFIG } from '../config/otp.config'
import type { IOtpProvider } from '../interfaces/otp-provider.interface'

export function createOtpService(): OTPService {
  const providers: IOtpProvider[] = []

  const authKey = OTP_CONFIG.msg91.authKey
  const useMock = !authKey || process.env.NODE_ENV === 'test'

  if (useMock) {
    console.log('[OtpServiceFactory] MSG91 keys not found or testing mode. Wiring mock OTP providers.')
    providers.push(new MockOtpProvider('whatsapp', 'mock-whatsapp-otp'))
    providers.push(new MockOtpProvider('sms', 'mock-sms-otp'))
  } else {
    console.log('[OtpServiceFactory] Wiring live MSG91 OTP providers.')
    providers.push(new Msg91WhatsAppProvider())
    providers.push(new Msg91SmsProvider())
  }

  return new OTPService(providers)
}
