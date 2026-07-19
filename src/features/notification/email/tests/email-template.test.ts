import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailTemplateResolver } from '../services/email-template.resolver'

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

describe('EmailTemplateResolver', () => {
  const resolver = new EmailTemplateResolver()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('resolveTemplate', () => {
    it('should query the database and return the database template if found', async () => {
      mockSupabase.from.mockImplementation(() => {
        return new SupabaseMockBuilder({
          data: [
            {
              event: 'auth.welcome',
              language: 'en',
              subject: 'Welcome DB',
              body: 'Welcome to DB body',
              status: 'active',
              metadata: { theme: 'brand', ctaText: 'Verify Now', templateId: 'welcome-db-1' }
            }
          ],
          error: null
        })
      })

      const resolved = await resolver.resolveTemplate('auth.welcome', 'en')
      expect(resolved).not.toBeNull()
      expect(resolved?.subject).toBe('Welcome DB')
      expect(resolved?.templateId).toBe('welcome-db-1')
    })

    it('should fall back to registry if database match is not found', async () => {
      mockSupabase.from.mockImplementation(() => {
        return new SupabaseMockBuilder({ data: [], error: null })
      })

      const resolved = await resolver.resolveTemplate('auth.welcome', 'en')
      expect(resolved).not.toBeNull()
      expect(resolved?.subject).toContain('Welcome to RishtaJodo Matrimony')
    })
  })

  describe('renderString', () => {
    it('should replace template variables correctly', () => {
      const template = 'Hello {{user_name}}, welcome to {{app_name}}!'
      const variables = { user_name: 'Rishi', app_name: 'RishtaJodo' }
      const rendered = resolver.renderString(template, variables)
      expect(rendered).toBe('Hello Rishi, welcome to RishtaJodo!')
    })

    it('should leave unmatched variables intact', () => {
      const template = 'Hello {{user_name}}, welcome to {{app_name}}!'
      const variables = { user_name: 'Rishi' }
      const rendered = resolver.renderString(template, variables)
      expect(rendered).toBe('Hello Rishi, welcome to {{app_name}}!')
    })
  })
})
