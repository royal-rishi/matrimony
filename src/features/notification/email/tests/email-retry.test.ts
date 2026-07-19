import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailRetryService } from '../services/email-retry.service'

class SupabaseMockBuilder {
  private resolvedValue: any
  private filterLessThan: boolean = false
  private filterGreaterEqual: boolean = false

  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  insert() { return this }
  update() { return this }
  eq() { return this }
  lt(col: string, val: any) { 
    this.filterLessThan = true
    return this 
  }
  gte(col: string, val: any) { 
    this.filterGreaterEqual = true
    return this 
  }
  maybeSingle() { return this }
  then(onfulfilled: any) {
    let result = { ...this.resolvedValue }
    if (result.data && Array.isArray(result.data)) {
      if (this.filterLessThan) {
        result.data = result.data.filter((item: any) => item.attempts < 5)
      } else if (this.filterGreaterEqual) {
        result.data = result.data.filter((item: any) => item.attempts >= 5)
      }
    }
    return Promise.resolve(result).then(onfulfilled)
  }
}

const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

describe('EmailRetryService', () => {
  const retryService = new EmailRetryService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should process failed jobs with transient errors by retrying them', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        // Return 1 failed job with transient error 500
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-1',
              status: 'failed',
              attempts: 1,
              max_attempts: 5,
              notification_id: 'notif-1',
              provider: 'msg91-email',
              provider_response: { statusCode: 500 },
              last_error: 'Server error',
              to_email: 'recipient@gmail.com',
              subject: 'Hello',
            }
          ],
          error: null
        })
      }
      return new SupabaseMockBuilder({ data: [], error: null })
    })

    const result = await retryService.processFailedJobs()
    expect(result.retried).toBe(1)
    expect(result.deadLettered).toBe(0)
  })

  it('should dead letter jobs with non-transient client errors immediately', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        // Return 1 failed job with permanent 400 error
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-2',
              status: 'failed',
              attempts: 1,
              max_attempts: 5,
              notification_id: 'notif-2',
              provider: 'msg91-email',
              provider_response: { statusCode: 400 },
              last_error: 'Bad request',
              to_email: 'recipient@gmail.com',
              subject: 'Hello',
            }
          ],
          error: null
        })
      }
      return new SupabaseMockBuilder({ data: {}, error: null })
    })

    const result = await retryService.processFailedJobs()
    expect(result.retried).toBe(0)
    expect(result.deadLettered).toBe(1)
  })

  it('should dead letter jobs when they exceed maximum retries', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-3',
              status: 'failed',
              attempts: 5,
              max_attempts: 5,
              notification_id: 'notif-3',
              provider: 'msg91-email',
              last_error: 'Failed 5 times',
              to_email: 'recipient@gmail.com',
              subject: 'Hello',
            }
          ],
          error: null
        })
      }
      return new SupabaseMockBuilder({ data: {}, error: null })
    })

    const result = await retryService.processFailedJobs()
    expect(result.retried).toBe(0)
    expect(result.deadLettered).toBe(1)
  })
})
