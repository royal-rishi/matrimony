// ============================================================
// AUDIT SERVICE — Phase 10
// Queries template audits and campaign updates for logging admin interactions.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { AuditEvent } from '../types/observability.types'

export class AuditService {
  async getAuditTrail(params?: { entityType?: string; limit?: number; from?: string; to?: string }): Promise<AuditEvent[]> {
    const supabase = await createClient()
    const limitVal = params?.limit ?? 50

    let query = supabase
      .from('notification_template_audit')
      .select('id, template_id, action, changed_by, changed_at, before_state, after_state, change_summary')

    if (params?.entityType) {
      if (params.entityType !== 'template') {
        return []
      }
    }
    if (params?.from) query = query.gte('changed_at', params.from)
    if (params?.to) query = query.lte('changed_at', params.to)

    const { data } = await query
      .order('changed_at', { ascending: false })
      .limit(limitVal)

    return (data ?? []).map((row: any) => ({
      id: row.id,
      entityType: 'template',
      entityId: row.template_id,
      entityName: `Template ID: ${row.template_id.slice(0, 8)}`,
      action: row.action as any,
      changedBy: row.changed_by ?? 'System Admin',
      changedAt: row.changed_at,
      before: row.before_state,
      after: row.after_state,
      ipAddress: null,
      notes: row.change_summary,
    }))
  }

  async getTemplateAuditHistory(templateId: string): Promise<AuditEvent[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notification_template_audit')
      .select('id, template_id, action, changed_by, changed_at, before_state, after_state, change_summary')
      .eq('template_id', templateId)
      .order('changed_at', { ascending: false })

    return (data ?? []).map((row: any) => ({
      id: row.id,
      entityType: 'template',
      entityId: row.template_id,
      entityName: `Template: ${templateId.slice(0, 8)}`,
      action: row.action as any,
      changedBy: row.changed_by ?? 'Admin Staff',
      changedAt: row.changed_at,
      before: row.before_state,
      after: row.after_state,
      ipAddress: null,
      notes: row.change_summary,
    }))
  }

  async getCampaignAuditHistory(campaignId: string): Promise<AuditEvent[]> {
    const supabase = await createClient()
    const { data: campaign } = await supabase
      .from('broadcast_campaigns')
      .select('id, name, status, created_at, started_at, completed_at, approved_at, approved_by')
      .eq('id', campaignId)
      .maybeSingle()

    if (!campaign) return []

    const events: AuditEvent[] = []

    if (campaign.created_at) {
      events.push({
        id: `c-create-${campaign.id}`,
        entityType: 'campaign',
        entityId: campaign.id,
        entityName: campaign.name,
        action: 'created',
        changedBy: 'Admin Composer',
        changedAt: campaign.created_at,
        before: null,
        after: { status: 'draft' },
        ipAddress: null,
        notes: 'Campaign created as draft',
      })
    }

    if (campaign.approved_at) {
      events.push({
        id: `c-approve-${campaign.id}`,
        entityType: 'campaign',
        entityId: campaign.id,
        entityName: campaign.name,
        action: 'approved',
        changedBy: campaign.approved_by ?? 'Approver Admin',
        changedAt: campaign.approved_at,
        before: { status: 'draft' },
        after: { status: 'approved' },
        ipAddress: null,
        notes: 'Campaign approved for broadcast dispatch',
      })
    }

    if (campaign.started_at) {
      events.push({
        id: `c-start-${campaign.id}`,
        entityType: 'campaign',
        entityId: campaign.id,
        entityName: campaign.name,
        action: 'activated',
        changedBy: 'Engine System',
        changedAt: campaign.started_at,
        before: { status: 'approved' },
        after: { status: 'running' },
        ipAddress: null,
        notes: 'Campaign execution sequence started',
      })
    }

    if (campaign.completed_at) {
      events.push({
        id: `c-complete-${campaign.id}`,
        entityType: 'campaign',
        entityId: campaign.id,
        entityName: campaign.name,
        action: 'replay',
        changedBy: 'Engine System',
        changedAt: campaign.completed_at,
        before: { status: 'running' },
        after: { status: 'completed' },
        ipAddress: null,
        notes: 'Campaign finished dispatching to all targets',
      })
    }

    return events.reverse()
  }

  async searchAuditLogs(query: string): Promise<AuditEvent[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notification_template_audit')
      .select('id, template_id, action, changed_by, changed_at, before_state, after_state, change_summary')
      .ilike('change_summary', `%${query}%`)
      .order('changed_at', { ascending: false })
      .limit(50)

    return (data ?? []).map((row: any) => ({
      id: row.id,
      entityType: 'template',
      entityId: row.template_id,
      entityName: `Template ID: ${row.template_id.slice(0, 8)}`,
      action: row.action as any,
      changedBy: row.changed_by ?? 'System Admin',
      changedAt: row.changed_at,
      before: row.before_state,
      after: row.after_state,
      ipAddress: null,
      notes: row.change_summary,
    }))
  }
}
