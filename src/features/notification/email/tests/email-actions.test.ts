import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sendEmail,
  scheduleEmail,
  retryEmail,
  cancelEmail,
  previewEmail,
  sendTestEmail
} from '../actions/email.actions'

class SupabaseMockBuilder {
  private resolvedValue: any
  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  insert() { return this }
  update() { return this }
  eq() { return this }
  gt() { return this }
  in() { return this }
  limit() { return this }
  single() { return this }
  maybeSingle() { return this }
  then(onfulfilled: any) {
    return Promise.resolve(this.resolvedValue).then(onfulfilled)
  }
}

const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

describe('Email Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendEmail', () => {
    it('should invoke the EmailService and return output', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'email_queue') {
          return new SupabaseMockBuilder({ data: { id: 'queue-1' }, error: null })
        }
        if (table === 'notifications') {
          return new SupabaseMockBuilder({ data: { id: 'notif-1' }, error: null })
        }
        return new SupabaseMockBuilder({ data: null, error: null })
      })

      const res = await sendEmail('recipient@gmail.com', 'auth.welcome', { user_name: 'Test' }, 'user-123')
      expect(res.success).toBe(true)
      expect(res.emailQueueId).toBe('queue-1')
    })
  })

  describe('scheduleEmail', () => {
    it('should validate scheduledFor date and schedule email', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'email_queue') {
          return new SupabaseMockBuilder({ data: { id: 'queue-2' }, error: null })
        }
        if (table === 'notifications') {
          return new SupabaseMockBuilder({ data: { id: 'notif-2' }, error: null })
        }
        return new SupabaseMockBuilder({ data: null, error: null })
      })

      const futureDate = new Date(Date.now() + 100000).toISOString()
      const res = await scheduleEmail('recipient@gmail.com', 'auth.welcome', { user_name: 'Test' }, futureDate, 'user-123')
      expect(res.success).toBe(true)
    })

    it('should return error if date is not in future', async () => {
      const pastDate = new Date(Date.now() - 100000).toISOString()
      const res = await scheduleEmail('recipient@gmail.com', 'auth.welcome', {}, pastDate, 'user-123')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Invalid scheduling date')
    })
  })

  describe('cancelEmail', () => {
    it('should cancel pending/scheduled jobs', async () => {
      mockSupabase.from.mockImplementation(() => {
        return new SupabaseMockBuilder({ data: { status: 'scheduled' }, error: null })
      })

      const res = await cancelEmail('job-1')
      expect(res.success).toBe(true)
    })

    it('should reject cancellation if job is already completed', async () => {
      mockSupabase.from.mockImplementation(() => {
        return new SupabaseMockBuilder({ data: { status: 'completed' }, error: null })
      })

      const res = await cancelEmail('job-1')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Cannot cancel job')
    })
  })
})
