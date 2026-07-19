// ============================================================
// PRODUCTION READINESS UNIT TESTS — Phase 11
// Validates masking, load calculations, and chaos configurations.
// ============================================================

import { describe, it, expect, vi } from 'vitest'
import { SecurityValidator } from '../production/security/security-validator'
import { LoadTestRunner } from '../production/testing/load-test'
import { ChaosEngine } from '../production/chaos/chaos-engine'
import { RecoveryManager } from '../production/backup/recovery-manager'

const mockSupabase = {
  from: () => ({
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: [{ id: '1' }], error: null }) }) }),
    select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'admin-id' } } }),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

describe('Production Readiness & DevSecOps Test Suite', () => {
  it('should mask sensitive emails and mobile numbers securely', () => {
    const email = 'rishi.kapoor@google.com'
    const maskedEmail = SecurityValidator.maskEmail(email)
    expect(maskedEmail).toBe('ris***@google.com')

    const phone = '+919876543210'
    const maskedPhone = SecurityValidator.maskPhone(phone)
    expect(maskedPhone).toBe('+91******3210')
  })

  it('should run OWASP checks and calculate security scores', () => {
    const audit = SecurityValidator.runOWASPAudit()
    expect(audit.score).toBeGreaterThanOrEqual(0)
    expect(audit.checks.length).toBe(5)
  })

  it('should compute load statistics and latency percentiles under test simulations', async () => {
    const result = await LoadTestRunner.runSimulation(10, 'sms')
    expect(result.totalDispatched).toBe(10)
    expect(result.successCount).toBe(10)
    expect(result.avgLatencyMs).toBeGreaterThan(0)
  })

  it('should toggle and query chaos faults configurations', () => {
    ChaosEngine.configure({ smsProviderDisabled: true })
    const status = ChaosEngine.getStatus()
    expect(status.smsProviderDisabled).toBe(true)

    ChaosEngine.reset()
    const resetStatus = ChaosEngine.getStatus()
    expect(resetStatus.smsProviderDisabled).toBe(false)
  })

  it('should check backup storage statistics', () => {
    const backup = RecoveryManager.runBackupHealthCheck()
    expect(backup.integrityCheck).toBe('passed')
    expect(backup.backupSizeGb).toBeGreaterThan(0)
  })
})
