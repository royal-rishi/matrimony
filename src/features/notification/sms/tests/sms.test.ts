import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SMSValidator } from '../validators/sms.validator'
import { SMSTemplateResolver } from '../services/sms-template.resolver'
import { SMSPreferenceResolver } from '../services/sms-preference.resolver'
import { MockSmsProvider } from '../providers/mock-sms.provider'
import { SMSService } from '../services/sms.service'
import { SMSQueueService } from '../services/sms-queue.service'
import { SMSRetryService } from '../services/sms-retry.service'

// Chainable Supabase Client Mock Builder
class SupabaseMockBuilder {
  private resolvedValue: any
  private countValue: number | null

  constructor(resolvedValue: any = { data: null, error: null }, countValue: number | null = null) {
    this.resolvedValue = resolvedValue
    this.countValue = countValue
  }

  select(columns?: string, options?: { count?: string; head?: boolean }) {
    return this
  }

  insert() { return this }
  update() { return this }
  eq() { return this }
  in() { return this }
  gt() { return this }
  gte() { return this }
  lt() { return this }
  lte() { return this }
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
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

describe('SMS Validator', () => {
  const validator = new SMSValidator()

  it('should accept valid E.164 phone formats', () => {
    expect(validator.isValidPhoneNumber('+919876543210')).toBe(true)
    expect(validator.isValidPhoneNumber('+12025550143')).toBe(true)
  })

  it('should reject invalid phone formats', () => {
    expect(validator.isValidPhoneNumber('9876543210')).toBe(false)
    expect(validator.isValidPhoneNumber('+91')).toBe(false)
  })

  it('should mask sensitive variables in template data', () => {
    const vars = {
      name: 'Rishi',
      otp: '123456',
      secret_token: 'xyz987abc',
      cvv: 123,
    }
    const masked = validator.maskSensitiveData(vars)
    expect(masked.name).toBe('Rishi')
    expect(masked.otp).toBe('12****56')
    expect(masked.secret_token).toBe('xy****bc')
    expect(masked.cvv).toBe('****')
  })
})

describe('SMS Template Resolver & Segment Count', () => {
  const resolver = new SMSTemplateResolver()

  it('should render placeholders in template body correctly', () => {
    const body = 'Hello {{name}}, your account associated with {{profile_id}} is verified.'
    const vars = { name: 'Rishi', profile_id: 'RJ-999' }
    const rendered = resolver.renderBody(body, vars)
    expect(rendered).toBe('Hello Rishi, your account associated with RJ-999 is verified.')
  })

  it('should calculate standard GSM-7 message segments', () => {
    // 100 chars -> 1 segment
    const test1 = 'A'.repeat(100)
    const res1 = resolver.calculateSegments(test1)
    expect(res1.segmentCount).toBe(1)
    expect(res1.isUnicode).toBe(false)

    // 200 chars -> 2 segments (since concat GSM segment length is 153 chars)
    const test2 = 'A'.repeat(200)
    const res2 = resolver.calculateSegments(test2)
    expect(res2.segmentCount).toBe(2)
    expect(res2.isUnicode).toBe(false)
  })

  it('should calculate Unicode message segments (containing regional scripts like Hindi)', () => {
    // Non-ASCII chars -> Unicode
    const text = 'नमस्ते Rishi, आपका प्रोफाइल सत्यापित हो गया है।'
    const res = resolver.calculateSegments(text)
    expect(res.isUnicode).toBe(true)
  })
})

describe('SMS Preference Resolver', () => {
  const prefResolver = new SMSPreferenceResolver()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should deny SMS if sms_enabled toggle is false', async () => {
    mockSupabase.from.mockImplementation(() =>
      new SupabaseMockBuilder({
        data: { sms_enabled: false },
        error: null,
      })
    )

    const result = await prefResolver.isSmsAllowed('user-uuid', 'profile.verified')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('disabled globally')
  })

  it('should deny SMS if category-level toggle is disabled', async () => {
    mockSupabase.from.mockImplementation(() =>
      new SupabaseMockBuilder({
        data: { sms_enabled: true, payment_enabled: false },
        error: null,
      })
    )

    const result = await prefResolver.isSmsAllowed('user-uuid', 'payment.payment_success')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Payment-related SMS notifications are disabled')
  })
})

describe('SMS Queue Worker Engine', () => {
  let mockProvider: MockSmsProvider
  let queueService: SMSQueueService

  beforeEach(() => {
    vi.clearAllMocks()
    mockProvider = new MockSmsProvider()
    queueService = new SMSQueueService(mockProvider)
  })

  it('should poll pending items, send via provider, and update status', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'sms_queue') {
        // Return 1 pending job
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-uuid',
              notification_id: 'notif-uuid',
              to_phone: '+919876543210',
              message_body: 'Mock Message',
              attempts: 0,
              max_attempts: 5,
              segment_count: 1,
              cost_per_segment: 0.12,
            },
          ],
          error: null,
        })
      }
      return new SupabaseMockBuilder({ data: {}, error: null })
    })

    const report = await queueService.processQueue(1)
    expect(report.processed).toBe(1)
    expect(report.succeeded).toBe(1)
  })

  it('should handle and record failures when provider dispatch fails', async () => {
    mockProvider.setFailureMode(true, 'API Error')

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'sms_queue') {
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-uuid-fail',
              notification_id: 'notif-uuid',
              to_phone: '+919876543210',
              message_body: 'Failed Message',
              attempts: 0,
              max_attempts: 5,
              segment_count: 1,
              cost_per_segment: 0.12,
            },
          ],
          error: null,
        })
      }
      return new SupabaseMockBuilder({ data: {}, error: null })
    })

    const report = await queueService.processQueue(1)
    expect(report.processed).toBe(1)
    expect(report.failed).toBe(1)
  })
})

describe('SMS Retry & DLQ Scheduler', () => {
  const retryService = new SMSRetryService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reschedule job under max attempts (attempts < 5)', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'sms_queue') {
        // Mock a failed job on its 2nd attempt
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-retry',
              attempts: 2,
              max_attempts: 5,
            },
          ],
          error: null,
        })
      }
      return new SupabaseMockBuilder({ error: null })
    })

    const result = await retryService.processFailedJobs()
    expect(result.retried).toBe(1)
  })

  it('should move exhausted jobs to DLQ table failed_notifications (attempts >= 5)', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'sms_queue') {
        // First call fetches failed < 5 (returns none)
        // Second call fetches failed >= 5 (returns 1 exhausted job)
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-dlq',
              notification_id: 'notif-uuid-exhausted',
              attempts: 5,
              max_attempts: 5,
              provider: 'mock-sms',
              last_error: 'Timeout',
              segment_count: 1,
              cost_per_segment: 0.12,
            },
          ],
          error: null,
        })
      }
      return new SupabaseMockBuilder({ error: null })
    })

    const result = await retryService.processFailedJobs()
    expect(result.deadLettered).toBe(1)
  })
})
