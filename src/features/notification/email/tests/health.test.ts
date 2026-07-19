import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as healthHandler } from '@/app/api/email/health/route'

class SupabaseMockBuilder {
  private resolvedValue: any
  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  eq() { return this }
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

describe('Email Health API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('/api/email/health should return provider and queue status', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'email_queue') {
        return new SupabaseMockBuilder({
          data: [
            { status: 'pending' },
            { status: 'completed' },
            { status: 'failed' }
          ],
          error: null
        })
      }
      return new SupabaseMockBuilder({ data: [], error: null })
    })

    const res = await healthHandler()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.queue.total).toBe(3)
    expect(body.queue.pending).toBe(1)
    expect(body.queue.completed).toBe(1)
    expect(body.queue.failed).toBe(1)
  })
})
