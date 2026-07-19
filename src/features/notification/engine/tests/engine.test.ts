import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventBus } from '../events/event-bus'
import { NotificationMiddleware } from '../middleware/notification-middleware'
import { NotificationResolver } from '../resolver/notification-resolver'
import { NotificationRouter } from '../routing/notification-router'
import { NotificationEngine } from '../services/notification-engine'
import type { NotificationChannel } from '../../interfaces/notification-provider.interface'

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

const mockEmailProvider = {
  channel: 'email',
  isEnabled: true,
  healthCheck: vi.fn().mockResolvedValue({ isHealthy: true }),
}

const mockSmsProvider = {
  channel: 'sms',
  isEnabled: true,
  healthCheck: vi.fn().mockResolvedValue({ isHealthy: true }),
}

const mockWhatsAppProvider = {
  channel: 'whatsapp',
  isEnabled: true,
  healthCheck: vi.fn().mockResolvedValue({ isHealthy: true }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

vi.mock('../../services/notification-service.factory', () => ({
  createNotificationService: vi.fn().mockImplementation(() => ({
    providers: [mockEmailProvider, mockSmsProvider, mockWhatsAppProvider],
  })),
}))

describe('Notification Event Bus', () => {
  it('should subscribe and trigger callbacks when publishing events', async () => {
    const subscriberMock = vi.fn()
    eventBus.subscribe('PAYMENT_SUCCESS', subscriberMock)

    const payload = { userId: 'u1', eventType: 'PAYMENT_SUCCESS', variables: { amount: 500 } }
    await eventBus.publish('PAYMENT_SUCCESS', payload)

    expect(subscriberMock).toHaveBeenCalledTimes(1)
    expect(subscriberMock).toHaveBeenCalledWith(payload)
    eventBus.unsubscribe('PAYMENT_SUCCESS', subscriberMock)
  })
})

describe('Notification Pipeline Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should block dispatch if rate limits are exceeded', async () => {
    mockSupabase.from.mockImplementation(() => {
      // Simulate 25 sent notifications in the last hour
      return {
        select: () => new SupabaseMockBuilder({ count: 25, error: null }),
      }
    })

    const ctx = {
      payload: { userId: 'u12', eventType: 'auth.register_otp' },
      allowedChannels: [],
      finalPriority: 'normal' as const,
      isCancelled: false,
      logs: [],
    }

    // Set engine minute limit low for test simulation
    const { ENGINE_CONFIG } = await import('../config/engine.config')
    const originalLimit = ENGINE_CONFIG.rateLimits.maxPerUserPerMinute
    ENGINE_CONFIG.rateLimits.maxPerUserPerMinute = 5

    const res = await NotificationMiddleware.enforceRateLimit(ctx)
    expect(res.isCancelled).toBe(true)
    expect(res.cancelReason).toContain('Rate limit exceeded')

    // Reset limit
    ENGINE_CONFIG.rateLimits.maxPerUserPerMinute = originalLimit
  })

  it('should suppress duplicate triggers within the dedup window', async () => {
    mockSupabase.from.mockImplementation(() => {
      return {
        select: () => new SupabaseMockBuilder({ data: [{ id: 'notif-1' }], error: null }),
      }
    })

    const ctx = {
      payload: { userId: 'u12', eventType: 'payment.success' },
      allowedChannels: [],
      finalPriority: 'normal' as const,
      isCancelled: false,
      logs: [],
    }

    const res = await NotificationMiddleware.preventDuplicates(ctx)
    expect(res.isCancelled).toBe(true)
    expect(res.cancelReason).toContain('Duplicate suppression active')
  })
})

describe('Notification Resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should resolve email and mobile based on user profile', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return new SupabaseMockBuilder({
          data: { email_address: 'rishi@example.com', mobile_number: '+919999999999' },
          error: null,
        })
      }
      if (table === 'notification_preferences') {
        return new SupabaseMockBuilder({
          data: {
            whatsapp_enabled: true,
            email_enabled: true,
            sms_enabled: true,
            marketing_enabled: true,
            quiet_hours_start: null,
            quiet_hours_end: null,
          },
          error: null,
        })
      }
      return new SupabaseMockBuilder({ error: null })
    })

    const ctx = {
      payload: { userId: 'u-user', eventType: 'marketing.promo' },
      allowedChannels: [],
      finalPriority: 'normal' as const,
      isCancelled: false,
      logs: [],
    }

    const res = await NotificationResolver.resolveUserAndPreferences(ctx)
    expect(res.resolvedEmail).toBe('rishi@example.com')
    expect(res.resolvedPhone).toBe('+919999999999')
    expect(res.allowedChannels).toContain('whatsapp')
    expect(res.allowedChannels).toContain('email')
  })
})

describe('Notification Failovers & Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEmailProvider.healthCheck.mockResolvedValue({ isHealthy: true })
    mockSmsProvider.healthCheck.mockResolvedValue({ isHealthy: true })
    mockWhatsAppProvider.healthCheck.mockResolvedValue({ isHealthy: true })
  })

  it('should trigger WhatsApp -> SMS fallback if WhatsApp provider is unhealthy', async () => {
    mockWhatsAppProvider.healthCheck.mockResolvedValue({ isHealthy: false })

    const ctx = {
      payload: { userId: 'u1', eventType: 'payment.success', channels: ['whatsapp'] as NotificationChannel[] },
      allowedChannels: ['whatsapp', 'sms'] as NotificationChannel[], // preferences allow both
      finalPriority: 'normal' as const,
      isCancelled: false,
      logs: [],
    }

    const res = await NotificationRouter.routeAndFailover(ctx)
    expect(res.allowedChannels).toContain('sms')
    expect(res.allowedChannels).not.toContain('whatsapp')
  })
})
