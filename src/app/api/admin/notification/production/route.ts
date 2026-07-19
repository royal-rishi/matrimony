// ============================================================
// PRODUCTION READINESS TELEMETRY API — Phase 11
// Handles status fetches for DevSecOps dashboard parameters.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SecurityValidator } from '@/features/admin/notification/production/security/security-validator'
import { ChaosEngine } from '@/features/admin/notification/production/chaos/chaos-engine'
import { RecoveryManager } from '@/features/admin/notification/production/backup/recovery-manager'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user credentials' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') ?? 'status'

    if (type === 'security') {
      const owasp = SecurityValidator.runOWASPAudit()
      const envs = SecurityValidator.validateEnvVariables()
      return NextResponse.json({
        success: true,
        data: { owasp, envs },
      })
    }

    if (type === 'chaos') {
      const chaos = ChaosEngine.getStatus()
      return NextResponse.json({
        success: true,
        data: chaos,
      })
    }

    if (type === 'backup') {
      const backups = RecoveryManager.runBackupHealthCheck()
      return NextResponse.json({
        success: true,
        data: backups,
      })
    }

    // Default status summary payload
    const owaspSummary = SecurityValidator.runOWASPAudit()
    const envsSummary = SecurityValidator.validateEnvVariables()
    const chaosSummary = ChaosEngine.getStatus()
    const backupSummary = RecoveryManager.runBackupHealthCheck()

    return NextResponse.json({
      success: true,
      data: {
        securityScore: owaspSummary.score,
        envVarsConfigured: envsSummary.isValid,
        chaosActive: Object.values(chaosSummary).some(Boolean),
        backupIntegrity: backupSummary.integrityCheck,
        lastBackupAt: backupSummary.lastBackupAt,
      },
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown server diagnostic failure',
    }, { status: 500 })
  }
}
