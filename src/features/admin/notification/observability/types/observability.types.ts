// ============================================================
// Phase 10 — Observability Platform Types
// RishtaJodo Matrimony — Enterprise Notification Analytics
// ============================================================

// ─── Primitive Enums ─────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical'

export type AlertMetric =
  | 'failure_rate'
  | 'queue_size'
  | 'dlq_size'
  | 'provider_down'
  | 'high_cost'
  | 'slow_delivery'
  | 'spam_detection'
  | 'retry_explosion'
  | 'dlq_growth'

export type AlertComparison = 'gt' | 'lt' | 'gte' | 'lte'

export type ForecastMetric = 'volume' | 'cost' | 'queue_size'

export type ReportType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'provider'
  | 'cost'
  | 'delivery'
  | 'failure'
  | 'executive'

export type ExportFormat = 'csv' | 'json'

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

// ─── Analytics Params ─────────────────────────────────────────────────────────

export interface AnalyticsParams {
  period: '1d' | '7d' | '30d' | '90d'
  channel?: string
  provider?: string
  event?: string
  from?: string
  to?: string
}

// ─── Executive Summary ────────────────────────────────────────────────────────

export interface ExecutiveSummary {
  date: string
  totalSent: number
  totalDelivered: number
  totalFailed: number
  deliveryRate: number
  failureRate: number
  totalOTP: number
  otpVerified: number
  totalSMS: number
  totalEmail: number
  totalWhatsApp: number
  totalInApp: number
  costToday: number
  costMonth: number
  queueSize: number
  retryQueueSize: number
  dlqSize: number
  avgDeliveryTimeMs: number
  activeAlerts: number
}

// ─── Channel Analytics ────────────────────────────────────────────────────────

export interface ChannelAnalytics {
  channel: string
  sent: number
  delivered: number
  failed: number
  deliveryRate: number
  avgLatencyMs: number
  costUnits: number
}

// ─── Volume Data ──────────────────────────────────────────────────────────────

export interface HourlyVolume {
  hour: number
  total: number
  delivered: number
  failed: number
}

export interface DailyVolume {
  date: string
  total: number
  email: number
  sms: number
  whatsapp: number
  inApp: number
  otp: number
  deliveryRate: number
}

// ─── Channel-Specific Analytics ───────────────────────────────────────────────

export interface OTPAnalytics {
  period: string
  requested: number
  verified: number
  failed: number
  expired: number
  abuseSuspected: number
  rateLimitHits: number
  verificationRate: number
}

export interface EmailAnalytics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  spam: number
  unsubscribed: number
  openRate: number
  ctr: number
  deliveryRate: number
}

export interface SMSAnalytics {
  sent: number
  delivered: number
  failed: number
  retried: number
  avgLatencyMs: number
  totalCost: number
  avgCostPerMsg: number
}

export interface WhatsAppAnalytics {
  sent: number
  delivered: number
  read: number
  replied: number
  failed: number
  deliveryRate: number
  readRate: number
  totalCost: number
}

// ─── Provider Health ──────────────────────────────────────────────────────────

export interface ProviderHealthSnapshot {
  provider: string
  displayName: string
  channel: string
  isHealthy: boolean
  responseTimeMs: number | null
  availability: number
  successRate: number
  totalRequests: number
  totalFailed: number
  errorMessage: string | null
  checkedAt: string
}

// ─── Queue Stats ─────────────────────────────────────────────────────────────

export interface QueueStats {
  channel: string
  pending: number
  processing: number
  scheduled: number
  retrying: number
  deadLettered: number
  oldestPendingMinutes: number | null
}

// ─── Alert Rules ─────────────────────────────────────────────────────────────

export interface AlertRule {
  id: string
  name: string
  description: string | null
  metric: AlertMetric
  threshold: number
  comparison: AlertComparison
  windowMinutes: number
  channelFilter: string | null
  providerFilter: string | null
  severity: AlertSeverity
  isActive: boolean
  isTriggered: boolean
  triggeredAt: string | null
  triggeredValue: number | null
  resolvedAt: string | null
  resolutionNotes: string | null
  createdAt: string
}

// ─── Cost Analytics ───────────────────────────────────────────────────────────

export interface CostBreakdown {
  period: string
  totalCost: number
  emailCost: number
  smsCost: number
  whatsappCost: number
  inAppCost: number
  avgCostPerMessage: number
  avgCostPerUser: number
  projectedMonthEnd: number
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export interface ForecastPoint {
  date: string
  value: number
  lowerBound: number
  upperBound: number
  confidence: number
  isProjected: boolean
}

export interface ForecastResult {
  metric: ForecastMetric
  channel: string | null
  historicalPoints: ForecastPoint[]
  forecastPoints: ForecastPoint[]
  trend: 'up' | 'down' | 'stable'
  growthRate: number
  model: string
  generatedAt: string
}

// ─── Performance Metrics ──────────────────────────────────────────────────────

export interface PerformanceMetrics {
  windowMinutes: number
  totalProcessed: number
  perSecond: number
  p50Ms: number | null
  p95Ms: number | null
  p99Ms: number | null
  avgMs: number | null
  errorRate: number
}

// ─── Health Checks ────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  component: string
  status: HealthStatus
  responseTimeMs: number | null
  message: string
  checkedAt: string
  details: Record<string, unknown>
}

export interface SystemHealthReport {
  overallStatus: HealthStatus
  components: HealthCheckResult[]
  checkedAt: string
  version: string
}

// ─── Audit Events ─────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string
  entityType: 'template' | 'campaign' | 'alert' | 'settings' | 'provider'
  entityId: string
  entityName: string
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated' | 'retry' | 'replay' | 'approved'
  changedBy: string
  changedAt: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ipAddress: string | null
  notes: string | null
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportSummary {
  type: ReportType
  period: string
  generatedAt: string
  totalNotifications: number
  deliveryRate: number
  failureRate: number
  totalCost: number
  topChannel: string
  topEvent: string
  alertsTriggered: number
  data: Record<string, unknown>
}

// ─── Internal DB Row Shapes (raw from Supabase) ───────────────────────────────

/** Raw row from notification_alerts table */
export interface NotificationAlertRow {
  id: string
  name: string
  description: string | null
  metric: string
  threshold: number
  comparison: string
  window_minutes: number
  channel_filter: string | null
  provider_filter: string | null
  severity: string
  is_active: boolean
  is_triggered: boolean
  triggered_at: string | null
  triggered_value: number | null
  resolved_at: string | null
  resolved_by: string | null
  notify_email: string[] | null
  notify_slack: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/** Raw row from notification_health_checks table */
export interface NotificationHealthCheckRow {
  id: string
  checked_at: string
  provider: string
  is_healthy: boolean
  response_time_ms: number | null
  error_message: string | null
  http_status: number | null
  details: Record<string, unknown>
}

/** Raw row from notification_performance_snapshots table */
export interface NotificationPerformanceSnapshotRow {
  id: string
  snapshot_at: string
  window_minutes: number
  channel: string | null
  total_processed: number
  per_second: number
  p50_ms: number | null
  p95_ms: number | null
  p99_ms: number | null
  avg_ms: number | null
  error_rate: number
}

/** Raw row from notification_forecast_data table */
export interface NotificationForecastRow {
  id: string
  generated_at: string
  forecast_date: string
  metric: string
  channel: string | null
  forecast_value: number
  lower_bound: number | null
  upper_bound: number | null
  confidence: number | null
  model: string
}

export interface LiveDeliveryEvent {
  id: string
  event: string
  channel: string
  status: string
  provider: string
  recipient: string
  createdAt: string
}

export interface CostByChannel {
  channel: string
  cost: number
  messageCount: number
  percentage: number
}

export interface CostByProvider {
  provider: string
  cost: number
  messageCount: number
  avgCostPerMsg: number
}

export interface CostTrendPoint {
  date: string
  cost: number
}

export interface CategoryBreakdown {
  event: string
  count: number
  deliveryRate: number
  channel: string
}

export interface ProviderComparison {
  provider: string
  sent: number
  delivered: number
  successRate: number
  avgLatencyMs: number
  totalCost: number
}


