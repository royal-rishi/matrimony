import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OTPValidator } from '../validators/otp.validator'
import { FallbackResolver } from '../services/fallback-resolver'
import { OTPService } from '../services/otp.service'
import type { IOtpProvider } from '../interfaces/otp-provider.interface'
import crypto from 'crypto'

// A flexible and chainable Supabase Client Mock Builder
class SupabaseMockBuilder {
  private resolvedValue: any
  private countValue: number | null

  constructor(resolvedValue: any = { data: null, error: null }, countValue: number | null = null) {
    this.resolvedValue = resolvedValue
    this.countValue = countValue
  }

  select(columns?: string, options?: { count?: string; head?: boolean }) {
    if (options?.count === 'exact') {
      return new SupabaseMockBuilder({ count: this.countValue, data: null, error: null })
    }
    return this
  }

  insert() { return this }
  update() { return this }
  eq() { return this }
  in() { return this }
  gt() { return this }
  is() { return this }
  order() { return this }
  limit() { return this }
  maybeSingle() { return this }

  then(onfulfilled: any) {
    return Promise.resolve(this.resolvedValue).then(onfulfilled)
  }
}

const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

describe('OTP Format Validation', () => {
  const validator = new OTPValidator()

  it('should accept valid E.164 phone numbers', () => {
    expect(validator.isValidPhoneNumber('+919876543210')).toBe(true)
    expect(validator.isValidPhoneNumber('+12025550143')).toBe(true)
    expect(validator.isValidPhoneNumber('+447911123456')).toBe(true)
  })

  it('should reject invalid phone numbers', () => {
    expect(validator.isValidPhoneNumber('9876543210')).toBe(false)
    expect(validator.isValidPhoneNumber('+91')).toBe(false)
    expect(validator.isValidPhoneNumber('+0123456789')).toBe(false)
    expect(validator.isValidPhoneNumber('invalid-phone')).toBe(false)
  })

  it('should accept valid 6-digit codes', () => {
    expect(validator.isValidOtpCode('123456')).toBe(true)
    expect(validator.isValidOtpCode('000000')).toBe(true)
    expect(validator.isValidOtpCode('999999')).toBe(true)
  })

  it('should reject invalid codes', () => {
    expect(validator.isValidOtpCode('12345')).toBe(false)
    expect(validator.isValidOtpCode('1234567')).toBe(false)
    expect(validator.isValidOtpCode('123a56')).toBe(false)
    expect(validator.isValidOtpCode('abcdef')).toBe(false)
  })
})

describe('OTP Validator - Abuse Prevention & Blocks', () => {
  const validator = new OTPValidator()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return not blocked when no database blocks are active', async () => {
    mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ data: [], error: null }))

    const result = await validator.checkBlocks('+919876543210', '127.0.0.1')
    expect(result.blocked).toBe(false)
  })

  it('should return blocked when there is an active block in the database', async () => {
    const blockedUntil = new Date(Date.now() + 60000)
    mockSupabase.from.mockImplementation(() => 
      new SupabaseMockBuilder({
        data: [{ block_type: 'brute_force', blocked_until: blockedUntil.toISOString() }],
        error: null,
      })
    )

    const result = await validator.checkBlocks('+919876543210', '127.0.0.1')
    expect(result.blocked).toBe(true)
    expect(result.reason).toBe('brute_force')
    expect(result.blockedUntil?.getTime()).toBe(blockedUntil.getTime())
  })
})

describe('OTP Validator - Rate Limiting & Cooldowns', () => {
  const validator = new OTPValidator()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject requests within the cooldown window (30 seconds)', async () => {
    const lastRequestTime = new Date(Date.now() - 10000)
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'otp_requests') {
        return new SupabaseMockBuilder({ data: { created_at: lastRequestTime.toISOString() }, error: null })
      }
      return new SupabaseMockBuilder()
    })

    const result = await validator.checkRateLimits('+919876543210', '127.0.0.1')
    expect(result.allowed).toBe(false)
    expect(result.error).toContain('wait before requesting another OTP')
    expect(result.cooldownRemaining).toBeLessThanOrEqual(20)
  })

  it('should reject request when daily limit is exceeded and apply a block', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'otp_requests') {
        // First call is cooldown (select created_at -> null)
        // Second call is daily limits check (select with count option -> 10)
        return new SupabaseMockBuilder({ data: null, error: null }, 10)
      }
      return new SupabaseMockBuilder({ error: null })
    })

    const result = await validator.checkRateLimits('+919876543210', '127.0.0.1')
    expect(result.allowed).toBe(false)
    expect(result.error).toContain('Daily limit exceeded')
  })
})

describe('OTP Fallback Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should deliver via primary channel (whatsapp) when it succeeds', async () => {
    const mockWhatsappProvider: IOtpProvider = {
      channel: 'whatsapp',
      providerName: 'msg91-whatsapp',
      sendOtp: vi.fn().mockResolvedValue({ success: true, providerMessageId: 'wa-123' }),
    }
    const mockSmsProvider: IOtpProvider = {
      channel: 'sms',
      providerName: 'msg91-sms',
      sendOtp: vi.fn().mockResolvedValue({ success: true, providerMessageId: 'sms-123' }),
    }

    const resolver = new FallbackResolver([mockWhatsappProvider, mockSmsProvider])
    const result = await resolver.sendWithFallback('+919876543210', '123456', 'whatsapp')

    expect(result.success).toBe(true)
    expect(result.channelUsed).toBe('whatsapp')
    expect(result.providerName).toBe('msg91-whatsapp')
    expect(mockWhatsappProvider.sendOtp).toHaveBeenCalledWith('+919876543210', '123456')
    expect(mockSmsProvider.sendOtp).not.toHaveBeenCalled()
  })

  it('should automatically fall back to alternative channel (sms) when primary (whatsapp) fails', async () => {
    const mockWhatsappProvider: IOtpProvider = {
      channel: 'whatsapp',
      providerName: 'msg91-whatsapp',
      sendOtp: vi.fn().mockResolvedValue({ success: false, error: 'Connection timeout' }),
    }
    const mockSmsProvider: IOtpProvider = {
      channel: 'sms',
      providerName: 'msg91-sms',
      sendOtp: vi.fn().mockResolvedValue({ success: true, providerMessageId: 'sms-999' }),
    }

    const resolver = new FallbackResolver([mockWhatsappProvider, mockSmsProvider])
    const result = await resolver.sendWithFallback('+919876543210', '123456', 'whatsapp')

    expect(result.success).toBe(true)
    expect(result.channelUsed).toBe('sms')
    expect(result.providerName).toBe('msg91-sms')
    expect(mockWhatsappProvider.sendOtp).toHaveBeenCalledWith('+919876543210', '123456')
    expect(mockSmsProvider.sendOtp).toHaveBeenCalledWith('+919876543210', '123456')
  })
})

describe('OTP Service - Core Verification & Brute-force Prevention', () => {
  let service: OTPService
  let mockWhatsappProvider: IOtpProvider
  let mockSmsProvider: IOtpProvider

  beforeEach(() => {
    vi.clearAllMocks()

    mockWhatsappProvider = {
      channel: 'whatsapp',
      providerName: 'msg91-whatsapp',
      sendOtp: vi.fn().mockResolvedValue({ success: true, providerMessageId: 'wa-msg-id' }),
    }
    mockSmsProvider = {
      channel: 'sms',
      providerName: 'msg91-sms',
      sendOtp: vi.fn().mockResolvedValue({ success: true, providerMessageId: 'sms-msg-id' }),
    }

    service = new OTPService([mockWhatsappProvider, mockSmsProvider])
  })

  it('should successfully verify when matching code is entered', async () => {
    const rawCode = '987654'
    const hashedCode = crypto.createHash('sha256').update(rawCode).digest('hex')

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'otp_requests') {
        return new SupabaseMockBuilder({
          data: {
            id: 'req-uuid',
            mobile: '+919876543210',
            hashed_code: hashedCode,
            attempts: 0,
            channel: 'whatsapp',
          },
          error: null,
        })
      }
      return new SupabaseMockBuilder({ data: [], error: null })
    })

    const result = await service.verifyOtp({
      mobile: '+919876543210',
      code: '987654',
      purpose: 'phone_verification',
      ipAddress: '127.0.0.1',
    })

    expect(result.success).toBe(true)
    expect(result.verified).toBe(true)
  })

  it('should increment attempts and fail verification on code mismatch', async () => {
    const correctCode = '111111'
    const hashedCode = crypto.createHash('sha256').update(correctCode).digest('hex')

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'otp_requests') {
        return new SupabaseMockBuilder({
          data: {
            id: 'req-uuid',
            mobile: '+919876543210',
            hashed_code: hashedCode,
            attempts: 1, // Had 1 attempt
            channel: 'whatsapp',
          },
          error: null,
        })
      }
      return new SupabaseMockBuilder({ data: [], error: null })
    })

    const result = await service.verifyOtp({
      mobile: '+919876543210',
      code: '222222', // wrong code
      purpose: 'phone_verification',
      ipAddress: '127.0.0.1',
    })

    expect(result.success).toBe(false)
    expect(result.verified).toBe(false)
    expect(result.attemptsRemaining).toBe(3) // 5 maxAttempts - 2 = 3 attempts remaining
  })

  it('should expire request and trigger brute force locks when max incorrect attempts (5) is exceeded', async () => {
    const correctCode = '111111'
    const hashedCode = crypto.createHash('sha256').update(correctCode).digest('hex')

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'otp_requests') {
        return new SupabaseMockBuilder({
          data: {
            id: 'req-uuid',
            mobile: '+919876543210',
            hashed_code: hashedCode,
            attempts: 4, // Had 4 attempts. Next wrong code will make it 5, triggering brute-force lock.
            channel: 'whatsapp',
          },
          error: null,
        })
      }
      return new SupabaseMockBuilder({ data: [], error: null }) // no blocks
    })

    const result = await service.verifyOtp({
      mobile: '+919876543210',
      code: '333333', // 5th wrong code
      purpose: 'phone_verification',
      ipAddress: '127.0.0.1',
    })

    expect(result.success).toBe(false)
    expect(result.verified).toBe(false)
    expect(result.attemptsRemaining).toBe(0)
    expect(result.error).toContain('Too many incorrect attempts')
    expect(result.errorCode).toBe('BLOCKED')
  })
})
