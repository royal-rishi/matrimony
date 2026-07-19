import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as webhookHandler } from '@/app/api/webhooks/msg91/email/route'

class SupabaseMockBuilder {
  private resolvedValue: any
  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  update() { return this }
  eq() { return this }
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

describe('MSG91 Webhook Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should process webhook event and update queue job status', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        return new SupabaseMockBuilder({
          data: { id: 'job-50', notification_id: 'notif-50' },
          error: null
        })
      }
      return new SupabaseMockBuilder({ data: { id: 'log-50' }, error: null })
    })

    mockSupabase.rpc.mockImplementation(() => {
      return Promise.resolve({ error: null })
    })

    const req = new NextRequest('http://localhost/api/webhooks/msg91/email', {
      method: 'POST',
      body: JSON.stringify({
        event: 'delivered',
        message_id: 'msg-91823',
        recipient: 'recipient@gmail.com'
      })
    })

    const res = await webhookHandler(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('should return error for invalid payload without message_id', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/msg91/email', {
      method: 'POST',
      body: JSON.stringify({
        event: 'delivered'
      })
    })

    const res = await webhookHandler(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('Missing mandatory payload variables')
  })
})
