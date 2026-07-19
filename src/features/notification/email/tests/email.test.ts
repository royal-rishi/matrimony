import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailValidator } from '../validators/email.validator'
import { EmailRenderer } from '../services/email-renderer'
import { EmailTemplateResolver } from '../services/email-template.resolver'
import { EmailPreferenceResolver } from '../services/email-preference.resolver'
import { AttachmentService } from '../services/attachment.service'
import { TrackingService } from '../services/tracking.service'
import { MockEmailProvider } from '../providers/mock-email.provider'
import { EmailQueueService } from '../services/email-queue.service'
import { EmailRetryService } from '../services/email-retry.service'

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

describe('Email Validator', () => {
  const validator = new EmailValidator()

  it('should accept valid emails and reject invalid ones', () => {
    expect(validator.isValidEmail('rishi@rishtajodo.com')).toBe(true)
    expect(validator.isValidEmail('invalid-email')).toBe(false)
  })

  it('should restrict domain checks for workspace safety', () => {
    expect(validator.isDomainAllowed('sender@rishtajodo.com')).toBe(true)
  })

  it('should mask sensitive variables in template data', () => {
    const vars = {
      name: 'Rishi Rohan',
      otp: '992200',
      password: 'mypassword123',
    }
    const masked = validator.maskSensitiveData(vars)
    expect(masked.otp).toBe('99****00')
    expect(masked.password).toBe('my****23')
  })
})

describe('Email Layout & Blocks Renderer', () => {
  it('should render brand themes with headers, buttons, and footers', () => {
    const html = EmailRenderer.render('<p>Welcome, User!</p>', 'Welcome Subject', {
      theme: 'brand',
      ctaText: 'Activate Account',
      ctaUrl: 'https://rishtajodo.com/activate',
    })
    
    expect(html).toContain('RishtaJodo Matrimony')
    expect(html).toContain('Welcome Subject')
    expect(html).toContain('Activate Account')
    expect(html).toContain('https://rishtajodo.com/activate')
  })

  it('should render custom block elements like stats card', () => {
    const statsHtml = EmailRenderer.renderStatisticsCard('Profiles Sent', '500+', 'This Month', false)
    expect(statsHtml).toContain('Profiles Sent')
    expect(statsHtml).toContain('500+')
  })
})

describe('Email Resolvers', () => {
  const templateResolver = new EmailTemplateResolver()
  const preferenceResolver = new EmailPreferenceResolver()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fall back to static template registry if database has no active templates', async () => {
    mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ data: [], error: null }))
    const template = await templateResolver.resolveTemplate('auth.welcome')
    expect(template).not.toBeNull()
    expect(template?.subject).toContain('Welcome')
  })

  it('should reject marketing emails if user disabled marketing category toggle', async () => {
    mockSupabase.from.mockImplementation(() =>
      new SupabaseMockBuilder({
        data: { email_enabled: true, marketing_enabled: false },
        error: null,
      })
    )
    const result = await preferenceResolver.isEmailAllowed('user-uuid', 'marketing.premium_offers')
    expect(result.allowed).toBe(false)
  })
})

describe('Attachment Service', () => {
  it('should validate attachment MIME types and payloads', () => {
    const validAttachments = [
      {
        filename: 'invoice.pdf',
        content: 'dGVzdCBjb250ZW50', // base64 'test content'
        contentType: 'application/pdf',
      },
    ]
    const result = AttachmentService.validateAttachments(validAttachments)
    expect(result.isValid).toBe(true)
  })

  it('should reject disallowed MIME types', () => {
    const badAttachments = [
      {
        filename: 'virus.exe',
        content: 'dGVzdA==',
        contentType: 'application/x-msdownload',
      },
    ]
    const result = AttachmentService.validateAttachments(badAttachments)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('not allowed')
  })
})

describe('Tracking Service', () => {
  it('should append transparent open-tracking pixel GIF', () => {
    const body = '<html><body><p>Hello</p></body></html>'
    const tracked = TrackingService.injectOpenTrackingPixel(body, 'queue-uuid-123')
    expect(tracked).toContain('api/notification/email/tracking/open?id=queue-uuid-123')
  })

  it('should wrap eligible anchor tags for click redirection tracking', () => {
    const body = '<p>Click <a href="https://rishtajodo.com/dashboard">here</a> to view matches.</p>'
    const tracked = TrackingService.wrapLinks(body, 'queue-uuid-123')
    expect(tracked).toContain('api/notification/email/tracking/click?id=queue-uuid-123&url=https%3A%2F%2Frishtajodo.com%2Fdashboard')
  })
})

describe('Email Queue Worker', () => {
  let provider: MockEmailProvider
  let worker: EmailQueueService

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new MockEmailProvider()
    worker = new EmailQueueService(provider)
  })

  it('should batch-poll jobs, send using provider, and lock jobs', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'email-job-1',
              notification_id: 'notif-1',
              to_email: 'recipient@workspace.com',
              subject: 'Hello',
              html_body: '<p>HTML</p>',
              attempts: 0,
              max_attempts: 5,
            },
          ],
          error: null,
        })
      }
      return new SupabaseMockBuilder({ data: {}, error: null })
    })

    const report = await worker.processQueue(1)
    expect(report.processed).toBe(1)
    expect(report.succeeded).toBe(1)
  })
})

describe('Email Retry & DLQ Scheduler', () => {
  const retryService = new EmailRetryService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should retry jobs under max attempts limit', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-1',
              attempts: 1,
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

  it('should move exhausted jobs to DLQ table failed_notifications', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-exhausted',
              notification_id: 'notif-1',
              attempts: 5,
              max_attempts: 5,
              provider: 'mock-email',
              last_error: 'Connection timeout',
              subject: 'Alert',
              to_email: 'target@gmail.com',
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
