import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WhatsAppValidator } from '../validators/whatsapp.validator'
import { WhatsAppRenderer } from '../services/whatsapp-renderer'
import { WhatsAppTemplateResolver } from '../services/whatsapp-template.resolver'
import { WhatsAppPreferenceResolver } from '../services/whatsapp-preference.resolver'
import { MockWhatsAppProvider } from '../providers/mock-whatsapp.provider'
import { WhatsAppQueueService } from '../services/whatsapp-queue.service'
import { WhatsAppRetryService } from '../services/whatsapp-retry.service'

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

describe('WhatsApp Validator', () => {
  const validator = new WhatsAppValidator()

  it('should validate phone formats and reject invalid ones', () => {
    expect(validator.isValidPhoneNumber('+919876543210')).toBe(true)
    expect(validator.isValidPhoneNumber('9876543210')).toBe(false)
  })

  it('should mask sensitive variables', () => {
    const vars = {
      name: 'Rishi Rohan',
      otp: '887711',
    }
    const masked = validator.maskSensitiveData(vars)
    expect(masked.otp).toBe('88****11')
  })
})

describe('WhatsApp Renderer', () => {
  it('should map named variables to positional body components', () => {
    const schema = {
      templateName: 'test_template',
      variablesMapping: ['user_name', 'otp'],
    }
    const variables = { user_name: 'Rishi Rohan', otp: '123456' }
    const components = WhatsAppRenderer.renderComponents(schema, variables)

    expect(components).toHaveLength(1)
    expect(components[0].type).toBe('body')
    expect(components[0].parameters).toHaveLength(2)
    expect(components[0].parameters[0].text).toBe('Rishi Rohan')
    expect(components[0].parameters[1].text).toBe('123456')
  })

  it('should build header parameters for image media', () => {
    const schema = {
      templateName: 'media_template',
      variablesMapping: ['user_name'],
      mediaType: 'image' as const,
    }
    const variables = { user_name: 'Rishi' }
    const components = WhatsAppRenderer.renderComponents(schema, variables, {
      mediaUrl: 'https://rishtajodo.com/assets/banner.jpg',
      mediaType: 'image',
    })

    expect(components).toHaveLength(2)
    expect(components.find(c => c.type === 'header').parameters[0].image.link).toBe('https://rishtajodo.com/assets/banner.jpg')
  })
})

describe('WhatsApp Resolvers', () => {
  const templateResolver = new WhatsAppTemplateResolver()
  const preferenceResolver = new WhatsAppPreferenceResolver()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fall back to static template registry', async () => {
    mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ data: [], error: null }))
    const template = await templateResolver.resolveTemplate('auth.register_otp')
    expect(template).not.toBeNull()
    expect(template?.templateName).toBe('rj_auth_otp')
  })

  it('should reject WhatsApp messages if globally disabled', async () => {
    mockSupabase.from.mockImplementation(() =>
      new SupabaseMockBuilder({
        data: { whatsapp_enabled: false },
        error: null,
      })
    )
    const result = await preferenceResolver.isWhatsAppAllowed('user-uuid', 'auth.register_otp')
    expect(result.allowed).toBe(false)
  })
})

describe('WhatsApp Queue Worker', () => {
  let provider: MockWhatsAppProvider
  let worker: WhatsAppQueueService

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new MockWhatsAppProvider()
    worker = new WhatsAppQueueService(provider)
  })

  it('should lock and process queue jobs', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'whatsapp_queue') {
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-1',
              notification_id: 'notif-1',
              to_phone: '+919876543210',
              template_name: 'rj_auth_otp',
              template_language: 'en',
              template_variables: { user_name: 'Rishi', otp: '123' },
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

describe('WhatsApp Retry & DLQ Scheduler', () => {
  const retryService = new WhatsAppRetryService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should schedule retry for eligible failed jobs', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'whatsapp_queue') {
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-1',
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

  it('should move exhausted jobs to DLQ table failed_notifications', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'whatsapp_queue') {
        return new SupabaseMockBuilder({
          data: [
            {
              id: 'job-exhausted',
              notification_id: 'notif-1',
              attempts: 5,
              max_attempts: 5,
              provider: 'mock-whatsapp',
              last_error: 'Timeout',
              template_name: 'rj_auth_otp',
              to_phone: '+919876543210',
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
