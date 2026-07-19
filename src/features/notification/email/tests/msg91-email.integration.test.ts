import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Msg91EmailProvider } from '../providers/msg91-email.provider'
import { EmailTemplateResolver } from '../services/email-template.resolver'
import { EmailRetryService } from '../services/email-retry.service'
import { POST as webhookHandler } from '@/app/api/webhooks/msg91/email/route'
import { NextRequest } from 'next/server'
import { PROVIDER_CONFIG } from '../config/provider.config'

// Mock Supabase Server Client with smart query filtering
class SupabaseMockBuilder {
  private resolvedValue: any
  private isExhaustedQuery = false

  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  insert() { return this }
  update() { return this }
  eq() { return this }
  in() { return this }
  gt() { return this }
  gte(col: string, val: any) {
    if (col === 'attempts') {
      this.isExhaustedQuery = true
    }
    return this
  }
  lt(col: string, val: any) {
    if (col === 'attempts') {
      this.isExhaustedQuery = false
    }
    return this
  }
  lte() { return this }
  is() { return this }
  order() { return this }
  limit() { return this }
  maybeSingle() { return this }
  then(onfulfilled: any) {
    let result = { ...this.resolvedValue }
    if (Array.isArray(result.data)) {
      if (this.isExhaustedQuery) {
        result.data = result.data.filter((job: any) => job.attempts >= (job.max_attempts || 5))
      } else {
        result.data = result.data.filter((job: any) => job.attempts < (job.max_attempts || 5))
      }
    }
    return Promise.resolve(result).then(onfulfilled)
  }
}

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

// Mock Global Fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('MSG91 Email Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Dynamically override config settings to prevent cached import-time issues
    process.env.MSG91_EMAIL_AUTH_KEY = 'test_auth_key_12345'
    process.env.MSG91_EMAIL_BASE_URL = 'https://control.msg91.com/api/v5/email/send'
    process.env.MSG91_EMAIL_DOMAIN = 'rishtajodo.com'
    
    PROVIDER_CONFIG.msg91.authKey = 'test_auth_key_12345'
    PROVIDER_CONFIG.msg91.baseUrl = 'https://control.msg91.com/api/v5/email/send'
    PROVIDER_CONFIG.msg91.domain = 'rishtajodo.com'
  })

  describe('Template Resolver Mapping (Step 4 & 5)', () => {
    const resolver = new EmailTemplateResolver()

    it('should load correct MSG91 Template ID for auth.welcome', async () => {
      mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ data: [], error: null }))
      const template = await resolver.resolveTemplate('auth.welcome')
      expect(template).not.toBeNull()
      expect(template?.templateId).toBe('WELCOME_EMAIL_ID')
    })

    it('should load correct MSG91 Template ID for auth.password_reset', async () => {
      mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ data: [], error: null }))
      const template = await resolver.resolveTemplate('auth.password_reset')
      expect(template).not.toBeNull()
      expect(template?.templateId).toBe('PASSWORD_RESET_ID')
    })

    it('should load correct MSG91 Template ID for payment.success', async () => {
      mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ data: [], error: null }))
      const template = await resolver.resolveTemplate('payment.success')
      expect(template).not.toBeNull()
      expect(template?.templateId).toBe('PAYMENT_SUCCESS_ID')
    })
  })

  describe('Msg91EmailProvider (Step 2 & 10)', () => {
    const provider = new Msg91EmailProvider()

    it('should serialize payload correctly and send POST request to MSG91 API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ status: 'success', data: { message_id: 'msg-91823' } })),
      })

      const result = await provider.sendEmail({
        toEmail: 'recipient@gmail.com',
        toName: 'Rishi Rohan',
        subject: 'Welcome',
        htmlBody: '<p>Welcome</p>',
        templateId: 'WELCOME_EMAIL_ID',
        variables: { user_name: 'Rishi Rohan' },
        replyTo: 'reply@rishtajodo.com',
        attachments: [
          { filename: 'doc.pdf', content: 'JVBERi0xLjQK...', contentType: 'application/pdf' }
        ]
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [calledUrl, calledOptions] = mockFetch.mock.calls[0] as [string, RequestInit]

      expect(calledUrl).toBe('https://control.msg91.com/api/v5/email/send')
      expect(calledOptions.method).toBe('POST')
      expect(calledOptions.headers).toEqual({
        'Content-Type': 'application/json',
        authkey: 'test_auth_key_12345',
      })

      const body = JSON.parse(calledOptions.body as string)
      expect(body.template_id).toBe('WELCOME_EMAIL_ID')
      expect(body.domain).toBe('rishtajodo.com')
      expect(body.recipients[0].to[0]).toEqual({ name: 'Rishi Rohan', email: 'recipient@gmail.com' })
      expect(body.recipients[0].variables).toEqual({ user_name: 'Rishi Rohan' })
      expect(body.reply_to[0].email).toBe('reply@rishtajodo.com')
      expect(body.attachments[0].name).toBe('doc.pdf')
      expect(body.attachments[0].path).toContain('data:application/pdf;base64,JVBERi0xLjQK')

      expect(result.success).toBe(true)
      expect(result.providerMessageId).toBe('msg-91823')
    })

    it('should mask authKey when throwing unconfigured error', async () => {
      process.env.MSG91_EMAIL_AUTH_KEY = ''
      PROVIDER_CONFIG.msg91.authKey = ''
      
      // Reload provider config
      vi.resetModules()
      const { Msg91EmailProvider: ProviderFresh } = await import('../providers/msg91-email.provider')
      const providerFresh = new ProviderFresh()

      await expect(
        providerFresh.sendEmail({
          toEmail: 'recipient@gmail.com',
          subject: 'Welcome',
          htmlBody: '<p>Welcome</p>',
          templateId: 'WELCOME_EMAIL_ID',
        })
      ).rejects.toThrow('Missing MSG91_EMAIL_AUTH_KEY. Provider not configured.')
    })
  })

  describe('Retry Logic (Step 9)', () => {
    const retryService = new EmailRetryService()

    it('should schedule retry for 429 or 500 failed jobs', async () => {
      // Mock failed jobs in queue
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'email_queue') {
          return new SupabaseMockBuilder({
            data: [
              {
                id: 'job-1',
                attempts: 1,
                max_attempts: 5,
                provider_response: { statusCode: 429 },
                notification_id: 'notif-1',
                to_email: 'test@gmail.com',
                subject: 'Test',
                provider: 'msg91-email',
              },
            ],
            error: null,
          })
        }
        return new SupabaseMockBuilder({ data: [], error: null })
      })

      const result = await retryService.processFailedJobs()

      expect(result.retried).toBe(1)
      expect(result.deadLettered).toBe(0)
    })

    it('should skip retry and move 400, 401, 403, 404 immediately to DLQ', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'email_queue') {
          return new SupabaseMockBuilder({
            data: [
              {
                id: 'job-2',
                attempts: 1,
                max_attempts: 5,
                provider_response: { statusCode: 400 },
                notification_id: 'notif-2',
                to_email: 'test@gmail.com',
                subject: 'Test',
                provider: 'msg91-email',
              },
            ],
            error: null,
          })
        }
        if (table === 'notifications') {
          return new SupabaseMockBuilder({
            data: { user_id: 'user-1', type: 'auth.welcome' },
            error: null,
          })
        }
        return new SupabaseMockBuilder({ data: [], error: null })
      })

      const result = await retryService.processFailedJobs()

      expect(result.retried).toBe(0)
      expect(result.deadLettered).toBe(1)
    })
  })

  describe('Webhook Endpoint (Step 7)', () => {
    it('should process webhook event and update database status + run analytics RPC', async () => {
      // Mock email_queue match
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'email_queue') {
          return new SupabaseMockBuilder({
            data: {
              id: 'queue-1',
              notification_id: 'notif-1',
              created_at: '2026-07-19T10:00:00Z',
            },
            error: null,
          })
        }
        if (table === 'notification_logs') {
          return new SupabaseMockBuilder({
            data: { id: 'log-1' },
            error: null,
          })
        }
        return new SupabaseMockBuilder({ data: [], error: null })
      })

      const req = new NextRequest('http://localhost:3000/api/webhooks/msg91/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'delivered',
          message_id: 'msg-91823',
          recipient: 'recipient@gmail.com',
        }),
      })

      const res = await webhookHandler(req)
      expect(res.status).toBe(200)

      // Verify that the daily analytics rollup RPC was called
      expect(mockSupabase.rpc).toHaveBeenCalledWith('fn_upsert_daily_analytics', { p_date: '2026-07-19' })
    })
  })
})
