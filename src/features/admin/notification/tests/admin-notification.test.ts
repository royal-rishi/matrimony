import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTemplate, updateTemplate, deleteTemplate, sendCampaign, retryNotification } from '../actions/admin-notifications.actions'
import { createClient } from '@/lib/supabase/server'

class SupabaseMockBuilder {
  private resolvedValue: any
  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  insert() { return this }
  update() { return this }
  delete() { return this }
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
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'admin-uuid-123' } },
      error: null,
    }),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/features/notification/engine/services/notification-engine', () => ({
  notificationEngine: {
    dispatch: vi.fn().mockResolvedValue({ success: true, notificationId: 'notif-dispatched-123' }),
  },
}))

describe('Admin Notifications Templates Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ data: { id: 't1' }, error: null }))
  })

  it('should create template successfully', async () => {
    const res = await createTemplate({
      name: 'Welcome Template',
      body: 'Hello {{user_name}}',
      channel: 'email',
      event: 'auth.register_otp',
      language: 'en',
    })
    expect(res.success).toBe(true)
    expect(res.data?.id).toBe('t1')
  })

  it('should update template successfully', async () => {
    const res = await updateTemplate('t1', { name: 'Updated Welcome' })
    expect(res.success).toBe(true)
    expect(res.data?.id).toBe('t1')
  })

  it('should delete template successfully', async () => {
    mockSupabase.from.mockImplementation(() => new SupabaseMockBuilder({ error: null }))
    const res = await deleteTemplate('t1')
    expect(res.success).toBe(true)
  })
})

describe('Admin Campaigns Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should broadcast campaigns to targeted audience', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'broadcast_campaigns') {
        return new SupabaseMockBuilder({
          data: {
            id: 'camp-123',
            name: 'Promo Campaign',
            template_id: 'temp-123',
            channel: 'email',
            audience_filter: { gender: 'female' },
          },
          error: null,
        })
      }
      if (table === 'notification_templates') {
        return new SupabaseMockBuilder({
          data: { id: 'temp-123', event: 'marketing.promo' },
          error: null,
        })
      }
      if (table === 'profiles') {
        return new SupabaseMockBuilder({
          data: [
            { id: 'user-female-1', email_address: 'female1@example.com' },
            { id: 'user-female-2', email_address: 'female2@example.com' },
          ],
          error: null,
        })
      }
      return new SupabaseMockBuilder({ error: null })
    })

    const res = await sendCampaign('camp-123')
    expect(res.success).toBe(true)
    expect(res.actualReach).toBe(2)
    expect(res.sent).toBe(2)
  })
})

describe('Admin DLQ Manual Retry Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should retry failed notification from DLQ and mark resolved', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'failed_notifications') {
        return new SupabaseMockBuilder({
          data: {
            id: 'failed-item-123',
            user_id: 'user-1',
            event: 'payment.success',
            channel: 'email',
            request_payload: { variables: { user_name: 'Rishi' } },
          },
          error: null,
        })
      }
      return new SupabaseMockBuilder({ error: null })
    })

    const res = await retryNotification('failed-item-123')
    expect(res.success).toBe(true)
    expect(res.notificationId).toBe('notif-dispatched-123')
  })
})
