// ============================================================
// NOTIFICATION DATABASE TYPES — Phase 2
// Mirrors every table in 0012_notification_system.sql exactly.
// Single source of truth for all notification DB row shapes.
// ============================================================

// ---- Enum Types ----

export type NotificationEvent =
  | 'match.interest_received'
  | 'match.interest_accepted'
  | 'match.interest_rejected'
  | 'match.connected'
  | 'match.profile_viewed'
  | 'match.shortlisted'
  | 'match.profile_liked'
  | 'chat.new_message'
  | 'chat.message_read'
  | 'chat.request'
  | 'chat.request_accepted'
  | 'profile.verified'
  | 'profile.rejected'
  | 'profile.incomplete'
  | 'profile.photo_approved'
  | 'profile.photo_rejected'
  | 'profile.kyc_rejected'
  | 'payment.subscription_started'
  | 'payment.subscription_renewed'
  | 'payment.subscription_expiring'
  | 'payment.subscription_expired'
  | 'payment.payment_failed'
  | 'payment.payment_refunded'
  | 'payment.payment_success'
  | 'payment.membership_activated'
  | 'payment.refund_success'
  | 'associate.new_assignment'
  | 'associate.case_updated'
  | 'associate.meeting_scheduled'
  | 'associate.commission_released'
  | 'associate.review_received'
  | 'associate.marriage_completed'
  | 'associate.dispute_opened'
  | 'associate.withdrawal_approved'
  | 'associate.withdrawal_rejected'
  | 'associate.reminder_due'
  | 'associate.assigned'
  | 'associate.plan_activated'
  | 'associate.meeting_reminder'
  | 'associate.case_closed'
  | 'associate.commission_credited'
  | 'system.announcement'
  | 'system.maintenance'
  | 'system.fraud_alert'
  | 'system.kyc_required'
  | 'system.account_suspended'
  | 'system.account_restored'
  | 'system.support_reply'
  | 'system.new_device_login'
  | 'system.email_changed'
  | 'system.mobile_changed'
  | 'system.security_alert'
  | 'otp.requested'
  | 'otp.verified'
  | 'otp.failed'
  | 'marketing.broadcast'
  | 'marketing.campaign'
  | 'marketing.weekly_digest'
  | 'marketing.match_digest'

export type DeliveryStatus =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'failed'
  | 'bounced'
  | 'rejected'
  | 'unsubscribed'
  | 'pending'

export type OtpPreference = 'sms' | 'whatsapp' | 'email'

export type QueueStatus =
  | 'pending'
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'
  | 'dead_lettered'

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type TemplateStatus = 'draft' | 'active' | 'inactive' | 'archived'

// Re-export Phase 1 types for convenience
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type NotificationStatus = 'pending' | 'dispatched' | 'delivered' | 'failed' | 'cancelled' | 'archived'

// ============================================================
// TABLE ROW TYPES
// ============================================================

// ---- notification_templates ----

export interface NotificationTemplate {
  id: string
  name: string
  slug: string
  channel: NotificationChannel
  category: string
  event: NotificationEvent
  language: string
  subject: string | null
  body: string
  html_body: string | null
  variables: string[]
  dlt_template_id: string | null
  sender_id: string | null
  status: TemplateStatus
  version: number
  is_default: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type NotificationTemplateInsert = Omit<
  NotificationTemplate,
  'id' | 'created_at' | 'updated_at' | 'version'
> & { version?: number }

export type NotificationTemplateUpdate = Partial<NotificationTemplateInsert>

// ---- notification_variables ----

export type VariableDataType = 'string' | 'number' | 'date' | 'boolean' | 'url' | 'currency'

export interface NotificationVariable {
  id: string
  name: string
  key: string
  description: string | null
  example_value: string | null
  data_type: VariableDataType
  is_required: boolean
  is_sensitive: boolean
  category: string
  created_at: string
  updated_at: string
}

// ---- notification_preferences (Phase 2 extended) ----

export interface NotificationPreferencesRow {
  user_id: string
  id: string
  // Phase 1 columns
  in_app_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  whatsapp_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  event_preferences: Record<string, { inApp: boolean; email: boolean; sms: boolean; push: boolean }>
  // Phase 2 columns
  marketing_enabled: boolean
  security_enabled: boolean
  payment_enabled: boolean
  associate_enabled: boolean
  match_digest_enabled: boolean
  weekly_digest_enabled: boolean
  otp_preference: OtpPreference
  fallback_enabled: boolean
  created_at: string
  updated_at: string
}

// ---- notification_logs ----

export interface NotificationLog {
  id: string
  notification_id: string
  user_id: string
  event: NotificationEvent
  channel: NotificationChannel
  status: DeliveryStatus
  provider: string | null
  template_id: string | null
  request_payload: Record<string, unknown>
  response_payload: Record<string, unknown> | null
  error_message: string | null
  error_code: string | null
  provider_message_id: string | null
  recipient: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  failed_at: string | null
  bounced_at: string | null
  retry_count: number
  cost_units: string  // numeric from DB
  created_at: string
}

export type NotificationLogInsert = Omit<NotificationLog, 'id' | 'created_at'>

// ---- notification_queue ----

export interface NotificationQueue {
  id: string
  notification_id: string
  priority: NotificationPriority
  status: QueueStatus
  channel: NotificationChannel
  scheduled_for: string
  attempts: number
  max_attempts: number
  worker_id: string | null
  last_error: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ---- email_queue ----

export interface EmailQueue {
  id: string
  notification_id: string
  queue_id: string | null
  to_email: string
  to_name: string | null
  from_email: string
  from_name: string
  reply_to: string | null
  subject: string
  html_body: string
  text_body: string | null
  template_id: string | null
  template_variables: Record<string, string | number | boolean>
  priority: NotificationPriority
  status: QueueStatus
  scheduled_for: string
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  provider: string | null
  provider_message_id: string | null
  attempts: number
  max_attempts: number
  last_error: string | null
  headers: Record<string, string>
  attachments: unknown[]
  tags: string[]
  created_at: string
  updated_at: string
}

// ---- sms_queue ----

export interface SmsQueue {
  id: string
  notification_id: string
  queue_id: string | null
  to_phone: string
  country_code: string
  message_body: string
  dlt_template_id: string | null
  sender_id: string
  is_unicode: boolean
  is_flash: boolean
  template_id: string | null
  template_variables: Record<string, string | number | boolean>
  priority: NotificationPriority
  status: QueueStatus
  scheduled_for: string
  sent_at: string | null
  delivered_at: string | null
  failed_at: string | null
  provider: string
  provider_message_id: string | null
  provider_response: Record<string, unknown> | null
  segment_count: number
  cost_per_segment: string  // numeric
  total_cost: string        // generated numeric
  attempts: number
  max_attempts: number
  last_error: string | null
  created_at: string
  updated_at: string
}

// ---- whatsapp_queue ----

export interface WhatsAppQueue {
  id: string
  notification_id: string
  queue_id: string | null
  to_phone: string
  template_name: string
  template_language: string
  template_variables: Record<string, unknown>
  media_url: string | null
  media_type: string | null
  button_payload: Record<string, unknown> | null
  template_id: string | null
  priority: NotificationPriority
  status: QueueStatus
  scheduled_for: string
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  provider: string
  provider_message_id: string | null
  provider_response: Record<string, unknown> | null
  attempts: number
  max_attempts: number
  last_error: string | null
  cost_units: string  // numeric
  created_at: string
  updated_at: string
}

// ---- failed_notifications ----

export interface FailedNotification {
  id: string
  notification_id: string
  log_id: string
  user_id: string
  event: NotificationEvent
  channel: NotificationChannel
  provider: string | null
  failure_reason: string
  provider_error_code: string | null
  provider_error_msg: string | null
  request_payload: Record<string, unknown>
  retry_count: number
  max_retries: number
  is_resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  escalated: boolean
  escalated_at: string | null
  created_at: string
  updated_at: string
}

// ---- retry_queue ----

export interface RetryQueue {
  id: string
  failed_id: string
  notification_id: string
  channel: NotificationChannel
  attempt_number: number
  scheduled_for: string
  status: QueueStatus
  worker_id: string | null
  executed_at: string | null
  result: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// ---- delivery_reports ----

export interface DeliveryReport {
  id: string
  notification_id: string
  user_id: string
  event: NotificationEvent
  channels_attempted: number
  channels_delivered: number
  channels_failed: number
  // Email
  email_sent: boolean
  email_delivered: boolean
  email_opened: boolean
  email_clicked: boolean
  email_bounced: boolean
  // SMS
  sms_sent: boolean
  sms_delivered: boolean
  sms_failed: boolean
  // WhatsApp
  whatsapp_sent: boolean
  whatsapp_delivered: boolean
  whatsapp_read: boolean
  // In-App
  in_app_delivered: boolean
  in_app_read: boolean
  // Timing
  first_sent_at: string | null
  first_delivered_at: string | null
  first_read_at: string | null
  first_clicked_at: string | null
  // Overall
  overall_status: DeliveryStatus
  total_cost: string  // numeric
  created_at: string
  updated_at: string
}

// ---- notification_analytics ----

export interface NotificationAnalytics {
  id: string
  date: string
  channel: NotificationChannel | null
  event: string | null
  provider: string | null
  total_sent: number
  emails_sent: number
  sms_sent: number
  whatsapp_sent: number
  in_app_sent: number
  otp_sent: number
  delivered: number
  opened: number
  clicked: number
  failed: number
  bounced: number
  rejected: number
  // Generated columns (read-only)
  delivery_rate: string
  open_rate: string
  success_rate: string
  total_cost: string
  avg_cost_per_msg: string
  created_at: string
  updated_at: string
}

// ---- broadcast_campaigns ----

export interface BroadcastCampaign {
  id: string
  name: string
  description: string | null
  slug: string
  type: string
  channel: NotificationChannel
  template_id: string
  status: CampaignStatus
  audience_type: string
  audience_filter: Record<string, unknown>
  estimated_reach: number
  actual_reach: number
  scheduled_for: string | null
  started_at: string | null
  completed_at: string | null
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_failed: number
  total_cost: string  // numeric
  tags: string[]
  is_ab_test: boolean
  created_by: string | null
  updated_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export type BroadcastCampaignInsert = Omit<
  BroadcastCampaign,
  'id' | 'created_at' | 'updated_at' | 'total_sent' | 'total_delivered' |
  'total_opened' | 'total_clicked' | 'total_failed' | 'total_cost' | 'actual_reach'
>

// ---- broadcast_recipients ----

export interface BroadcastRecipient {
  id: string
  campaign_id: string
  user_id: string
  notification_id: string | null
  channel: NotificationChannel
  status: DeliveryStatus
  recipient_address: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  unsubscribed_at: string | null
  failed_at: string | null
  failure_reason: string | null
  provider_message_id: string | null
  cost: string  // numeric
  created_at: string
  updated_at: string
}

// ---- notification_template_audit ----

export interface NotificationTemplateAudit {
  id: string
  template_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  changed_by: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_fields: string[] | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ============================================================
// VIEW TYPES
// ============================================================

export interface NotificationDashboardView {
  user_id: string
  total_count: number
  unread_count: number
  urgent_unread: number
  high_unread: number
  last_notification_at: string | null
  recent_notifications: Array<{
    id: string
    type: string
    title: string
    body: string
    priority: NotificationPriority
    is_read: boolean
    action_url: string | null
    created_at: string
  }> | null
}

export interface DeliverySummaryView {
  channel: NotificationChannel
  provider: string | null
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_failed: number
  total_bounced: number
  delivery_rate_pct: string | null
  email_open_rate_pct: string | null
  click_through_rate_pct: string | null
  total_cost_units: string
  first_sent_at: string | null
  last_sent_at: string | null
}

export interface DailyAnalyticsView extends NotificationAnalytics {
  rolling_7d_avg_sent: string | null
  rolling_7d_delivery_rate: string | null
  rolling_7d_success_rate: string | null
  wow_sent_delta: number | null
}

export interface ProviderPerformanceView {
  provider: string
  channel: NotificationChannel
  total_attempts: number
  successful: number
  failed: number
  success_rate_pct: string | null
  avg_delivery_latency_secs: string | null
  first_used_at: string
  last_used_at: string
  last_active_date: string
}

// ============================================================
// FUNCTION PARAMETER TYPES (for RPC calls)
// ============================================================

export interface CreateNotificationParams {
  p_user_id: string
  p_event: NotificationEvent
  p_channels: NotificationChannel[]
  p_template_id: string | null
  p_title: string
  p_body: string
  p_action_url?: string
  p_image_url?: string
  p_priority?: NotificationPriority
  p_metadata?: Record<string, unknown>
  p_scheduled_for?: string
}

export interface QueueNotificationParams {
  p_notification_id: string
  p_channel: NotificationChannel
  p_priority?: NotificationPriority
  p_scheduled_for?: string
}

export interface MarkDeliveredParams {
  p_log_id: string
  p_notification_id: string
  p_channel: NotificationChannel
  p_provider_message_id?: string
  p_response_payload?: Record<string, unknown>
}

export interface MarkFailedParams {
  p_log_id: string
  p_notification_id: string
  p_channel: NotificationChannel
  p_error_message: string
  p_error_code?: string
  p_provider?: string
}

export interface RetryNotificationParams {
  p_failed_id: string
  p_reason?: string
}

export interface UpsertDailyAnalyticsParams {
  p_date?: string
}
