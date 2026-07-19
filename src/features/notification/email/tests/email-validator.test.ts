import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailValidator } from '../services/email-validator'
import { Msg91EmailError } from '../errors/email-provider.errors'

class SupabaseMockBuilder {
  private resolvedValue: any
  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  eq() { return this }
  gt() { return this }
  in() { return this }
  limit() { return this }
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

describe('EmailValidator', () => {
  const validator = new EmailValidator()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isValidEmail', () => {
    it('should validate standard emails', () => {
      expect(validator.isValidEmail('test@example.com')).toBe(true)
      expect(validator.isValidEmail('rishi.rohan@domain.co.in')).toBe(true)
      expect(validator.isValidEmail('invalid-email')).toBe(false)
      expect(validator.isValidEmail('invalid@domain')).toBe(false)
    })
  })

  describe('isDomainAllowed', () => {
    it('should allow domains based on configuration', () => {
      expect(validator.isDomainAllowed('test@rishtajodo.com')).toBe(true)
    })
  })

  describe('isDuplicateSend', () => {
    it('should identify duplicates correctly', async () => {
      mockSupabase.from.mockImplementation(() => {
        return new SupabaseMockBuilder({ data: [{ id: 'duplicate-1' }], error: null })
      })

      const isDup = await validator.isDuplicateSend('recipient@gmail.com', 'Welcome to RishtaJodo')
      expect(isDup).toBe(true)
    })

    it('should return false if no duplicates are found', async () => {
      mockSupabase.from.mockImplementation(() => {
        return new SupabaseMockBuilder({ data: [], error: null })
      })

      const isDup = await validator.isDuplicateSend('recipient@gmail.com', 'Welcome to RishtaJodo')
      expect(isDup).toBe(false)
    })
  })

  describe('validateAttachments', () => {
    it('should allow valid attachments', () => {
      expect(() => {
        validator.validateAttachments([
          {
            filename: 'document.pdf',
            contentType: 'application/pdf',
            content: 'encodedpdfcontent'
          }
        ])
      }).not.toThrow()
    })

    it('should throw for unsupported MIME types', () => {
      expect(() => {
        validator.validateAttachments([
          {
            filename: 'script.js',
            contentType: 'application/javascript',
            content: 'console.log()'
          }
        ])
      }).toThrow(Msg91EmailError)
    })

    it('should throw for oversized attachments', () => {
      const largeContent = 'a'.repeat(15 * 1024 * 1024) // 15MB
      expect(() => {
        validator.validateAttachments([
          {
            filename: 'large.pdf',
            contentType: 'application/pdf',
            content: largeContent
          }
        ])
      }).toThrow(Msg91EmailError)
    })
  })

  describe('validateVariables', () => {
    it('should allow flat key-value pairs', () => {
      expect(() => {
        validator.validateVariables({ name: 'Rishi', code: 123456 })
      }).not.toThrow()
    })

    it('should throw on nested objects', () => {
      expect(() => {
        validator.validateVariables({ user: { name: 'Rishi' } })
      }).toThrow(Msg91EmailError)
    })
  })

  describe('maskSensitiveData', () => {
    it('should mask sensitive variables', () => {
      const variables = {
        otp: '123456',
        password: 'mysecurepassword',
        user_name: 'Rishi Rohan'
      }

      const masked = validator.maskSensitiveData(variables)
      expect(masked.otp).toBe('12****56')
      expect(masked.password).toBe('my****rd')
      expect(masked.user_name).toBe('Rishi Rohan')
    })
  })
})
