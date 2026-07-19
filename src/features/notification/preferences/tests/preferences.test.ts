import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PreferenceValidator } from '../validators/preferences.validator'
import { NotificationPreferenceService } from '../services/preferences.service'
import { PREFERENCES_CONFIG } from '../config/preferences.config'

const updateSpy = vi.fn()

class SupabaseMockBuilder {
  private resolvedValue: any
  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  insert() { return this }
  update(args?: any) { updateSpy(args); return this }
  eq() { return this }
  in() { return this }
  gt() { return this }
  is() { return this }
  maybeSingle() { return this }
  upsert() { return this }
  then(onfulfilled: any) {
    return Promise.resolve(this.resolvedValue).then(onfulfilled)
  }
}

export { updateSpy }

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

describe('Preferences Validator', () => {
  it('should validate timezone formats', () => {
    const valGood = PreferenceValidator.validate({ timezone: 'Asia/Kolkata' })
    expect(valGood.isValid).toBe(true)

    const valBad = PreferenceValidator.validate({ timezone: 'Invalid/City' })
    expect(valBad.isValid).toBe(false)
    expect(valBad.errors[0]).toContain('Invalid timezone')
  })

  it('should validate quiet hours time formats', () => {
    const valGood = PreferenceValidator.validate({ quietHoursStart: '22:00', quietHoursEnd: '08:00' })
    expect(valGood.isValid).toBe(true)

    const valBad = PreferenceValidator.validate({ quietHoursStart: '22:99' })
    expect(valBad.isValid).toBe(false)
    expect(valBad.errors[0]).toContain('Invalid quietHoursStart')
  })

  it('should prevent disabling mandatory security alerts', () => {
    const data = {
      categories: {
        email: { security: false } as any,
        sms: { security: true } as any,
        whatsapp: { otp: true } as any,
      },
    }
    const val = PreferenceValidator.validate(data)
    expect(val.isValid).toBe(false)
    expect(val.errors[0]).toContain('Security alerts cannot be disabled')
  })

  it('should block OTP preferred conflict choices', () => {
    const data = {
      otpPreference: 'whatsapp' as const,
      whatsappEnabled: false,
    }
    const val = PreferenceValidator.validate(data)
    expect(val.isValid).toBe(false)
    expect(val.errors[0]).toContain('WhatsApp is preferred for OTP')
  })
})

describe('Preferences Core Service', () => {
  const service = new NotificationPreferenceService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should seed default preferences if user record is missing', async () => {
    mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ data: null, error: null }))
    const prefs = await service.getPreferences('user-uuid')
    expect(prefs.timezone).toBe('Asia/Kolkata')
    expect(prefs.language).toBe('en')
  })

  it('should prevent writing duplicate updates', async () => {
    // Mock getPreferences lookup returning seeded preferences
    mockSupabase.from.mockImplementation(() =>
      new SupabaseMockBuilder({
        data: {
          user_id: 'user-1',
          email_enabled: true,
          sms_enabled: false,
          whatsapp_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          event_preferences: {
            language: 'en',
            timezone: 'Asia/Kolkata',
            privacy: PREFERENCES_CONFIG.defaultPreferences.privacy,
            digest: PREFERENCES_CONFIG.defaultPreferences.digest,
            categories: PREFERENCES_CONFIG.defaultPreferences.categories,
          },
        },
        error: null,
      })
    )

    // No updates needed, duplicate update call
    updateSpy.mockClear()
    const res = await service.updatePreferences('user-1', { emailEnabled: true })
    expect(res.success).toBe(true)
    // Verify that Supabase update was never called by checking update spy
    expect(updateSpy).not.toHaveBeenCalled()
  })
})
