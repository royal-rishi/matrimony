import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Msg91EmailProvider } from '../providers/msg91-email.provider'
import { MockEmailProvider } from '../providers/mock-email.provider'
import { PROVIDER_CONFIG } from '../config/provider.config'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Email Providers Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    PROVIDER_CONFIG.msg91.authKey = 'test_auth_key_12345'
    PROVIDER_CONFIG.msg91.baseUrl = 'https://control.msg91.com/api/v5/email/send'
    PROVIDER_CONFIG.msg91.domain = 'rishtajodo.com'
  })

  describe('Msg91EmailProvider', () => {
    const provider = new Msg91EmailProvider()

    it('should format payload correctly and send immediate post request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ status: 'success', data: { message_id: 'msg-992' } })),
      })

      const res = await provider.send({
        toEmail: 'member@gmail.com',
        toName: 'Rishi Rohan',
        subject: 'Welcome to RishtaJodo',
        htmlBody: '<p>Welcome</p>',
        templateId: 'WELCOME_EMAIL_ID',
        variables: { user: 'Rishi' },
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(res.success).toBe(true)
      expect(res.providerMessageId).toBe('msg-992')
    })

    it('should return isHealthy true if authKey is configured', async () => {
      const health = await provider.health()
      expect(health.isHealthy).toBe(true)
    })
  })

  describe('MockEmailProvider', () => {
    const provider = new MockEmailProvider()

    it('should support send, schedule, cancel, retry, validate, health', async () => {
      const sendRes = await provider.send({
        toEmail: 'test@example.com',
        subject: 'Hello',
        htmlBody: '<p>Hello</p>',
      })
      expect(sendRes.success).toBe(true)

      const schedRes = await provider.schedule({
        toEmail: 'test@example.com',
        subject: 'Hello',
        htmlBody: '<p>Hello</p>',
      }, new Date())
      expect(schedRes.success).toBe(true)

      const cancelRes = await provider.cancel('msg-123')
      expect(cancelRes.success).toBe(true)

      const retryRes = await provider.retry('msg-123')
      expect(retryRes.success).toBe(true)

      const valRes = await provider.validate({
        toEmail: 'test@example.com',
        subject: 'Hello',
        htmlBody: '<p>Hello</p>',
      })
      expect(valRes.isValid).toBe(true)

      const healthRes = await provider.health()
      expect(healthRes.isHealthy).toBe(true)
    })
  })
})
