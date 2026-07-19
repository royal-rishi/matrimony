import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailService } from '../services/email.service'
import { MockEmailProvider } from '../providers/mock-email.provider'

class SupabaseMockBuilder {
  private resolvedValue: any
  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
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

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate inputs, resolve template, check anti-spam duplicate, and execute dispatch', async () => {
    // 1. Mock Database Template Selection (none active in DB -> falls back to registry)
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'notification_templates') {
        return new SupabaseMockBuilder({ data: [], error: null })
      }
      if (table === 'email_queue') {
        // Mock duplicate check (returns empty list -> no duplicates)
        // Also mock queue insert returning new ID
        return new SupabaseMockBuilder({ data: { id: 'queue-100' }, error: null })
      }
      if (table === 'notification_logs') {
        return new SupabaseMockBuilder({ data: { id: 'log-100' }, error: null })
      }
      if (table === 'notifications') {
        return new SupabaseMockBuilder({ data: { id: 'notif-100' }, error: null })
      }
      return new SupabaseMockBuilder({ data: null, error: null })
    })

    const provider = new MockEmailProvider()
    const service = new EmailService(provider)

    const result = await service.sendEmail(
      'recipient@gmail.com',
      'auth.welcome',
      { user_name: 'Rishi Rohan' },
      { userId: 'user-100' }
    )

    expect(result.success).toBe(true)
    expect(result.emailQueueId).toBe('queue-100')
    expect(result.status).toBe('sent')
  })

  it('should reject email if recipient format is invalid', async () => {
    const provider = new MockEmailProvider()
    const service = new EmailService(provider)

    const result = await service.sendEmail('invalid-recipient-email', 'auth.welcome', {})

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid email syntax format')
  })
})
