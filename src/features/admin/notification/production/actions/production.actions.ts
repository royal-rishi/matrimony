// ============================================================
// PRODUCTION READINESS SERVER ACTIONS — Phase 11
// Handles execution of load tests, chaos configs, GDPR purges,
// and security auditing checklists.
// ============================================================

'use server'

import { SecurityValidator } from '../security/security-validator'
import { LoadTestRunner, LoadTestResult } from '../testing/load-test'
import { ChaosEngine, ChaosConfig } from '../chaos/chaos-engine'
import { RecoveryManager } from '../backup/recovery-manager'

// Server Action Simulators to keep Next.js 15 client compatibility
export async function runSecurityOWASPAudit() {
  return SecurityValidator.runOWASPAudit()
}

export async function runLoadTestSimulation(concurrency: number, channel: 'sms' | 'email' | 'whatsapp' | 'mixed') {
  return LoadTestRunner.runSimulation(concurrency, channel)
}

export async function getChaosConfig() {
  return ChaosEngine.getStatus()
}

export async function updateChaosConfig(updates: Partial<ChaosConfig>) {
  return ChaosEngine.configure(updates)
}

export async function resetChaosEngine() {
  return ChaosEngine.reset()
}

export async function triggerDLQReplay(channel?: string) {
  return RecoveryManager.replayDeadLetterQueue(channel)
}

export async function triggerGDPRPurge(userId: string) {
  return RecoveryManager.purgeUserData(userId)
}

export async function getBackupStatus() {
  return RecoveryManager.runBackupHealthCheck()
}
