import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as sendHandler } from '@/app/api/email/send/route'
import { POST as scheduleHandler } from '@/app/api/email/schedule/route'
import { POST as cancelHandler } from '@/app/api/email/cancel/route'
import { GET as previewHandler } from '@/app/api/email/preview/route'

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

describe('Email API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('/api/email/send should send email and return success', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        return new SupabaseMockBuilder({ data: { id: 'queue-10' }, error: null })
      }
      if (table === 'notifications') {
        return new SupabaseMockBuilder({ data: { id: 'notif-10' }, error: null })
      }
      return new SupabaseMockBuilder({ data: null, error: null })
    })

    const req = new NextRequest('http://localhost/api/email/send', {
      method: 'POST',
      body: JSON.stringify({
        toEmail: 'recipient@gmail.com',
        eventType: 'auth.welcome',
        variables: { user_name: 'Test User' },
        userId: 'user-123'
      })
    })

    const res = await sendHandler(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('/api/email/schedule should schedule email', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        return new SupabaseMockBuilder({ data: { id: 'queue-11' }, error: null })
      }
      if (table === 'notifications') {
        return new SupabaseMockBuilder({ data: { id: 'notif-11' }, error: null })
      }
      return new SupabaseMockBuilder({ data: null, error: null })
    })

    const futureDate = new Date(Date.now() + 100000).toISOString()
    const req = new NextRequest('http://localhost/api/email/schedule', {
      method: 'POST',
      body: JSON.stringify({
        toEmail: 'recipient@gmail.com',
        eventType: 'auth.welcome',
        scheduledFor: futureDate,
        userId: 'user-123'
      })
    })

    const res = await scheduleHandler(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('/api/email/cancel should cancel scheduled email', async () => {
    mockSupabase.from.mockImplementation(() => {
      return new SupabaseMockBuilder({ data: { status: 'scheduled' }, error: null })
    })

    const req = new NextRequest('http://localhost/api/email/cancel', {
      method: 'POST',
      body: JSON.stringify({ emailQueueId: 'job-12' })
    })

    const res = await cancelHandler(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('/api/email/preview should generate preview HTML', async () => {
    const req = new NextRequest('http://localhost/api/email/preview?eventType=auth.welcome&theme=light')
    const res = await previewHandler(req)
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(text).toContain('Welcome to RishtaJodo Matrimony')
  })
})
