# RishtaJodo Matrimony — Notification System Database Documentation

> **Phase 2 — Enterprise Notification Database Architecture**
> Migration: `0012_notification_system.sql`
> Phase 1 Foundation: `0011_notification_foundation.sql`

---

## Table of Contents

1. [Overview](#overview)
2. [ER Diagram](#er-diagram)
3. [Enums](#enums)
4. [Tables](#tables)
5. [Relationships](#relationships)
6. [Indexes](#indexes)
7. [Triggers](#triggers)
8. [Functions](#functions)
9. [Views](#views)
10. [Row Level Security](#row-level-security)
11. [Partitioning](#partitioning)
12. [Audit Logging](#audit-logging)
13. [Performance Notes](#performance-notes)
14. [Migration Order](#migration-order)

---

## Overview

The notification system consists of **16 tables** across 4 functional domains:

| Domain | Tables |
|--------|--------|
| **Core** | `notifications`, `notification_preferences`, `notification_templates`, `notification_variables` |
| **Queues** | `notification_queue`, `email_queue`, `sms_queue`, `whatsapp_queue` |
| **Reliability** | `notification_logs`, `failed_notifications`, `retry_queue`, `delivery_reports` |
| **Analytics & Campaigns** | `notification_analytics`, `broadcast_campaigns`, `broadcast_recipients`, `notification_template_audit` |

---

## ER Diagram

```
profiles
  │
  ├─── notifications (1:N)
  │       │
  │       ├─── notification_queue (1:N)
  │       │       ├─── email_queue (1:N)
  │       │       ├─── sms_queue (1:N)
  │       │       └─── whatsapp_queue (1:N)
  │       │
  │       ├─── notification_logs (1:N) [partitioned by month]
  │       │       └─── failed_notifications (1:N)
  │       │               └─── retry_queue (1:N)
  │       │
  │       ├─── delivery_reports (1:1)
  │       └─── broadcast_recipients (N:1) ──── broadcast_campaigns
  │
  ├─── notification_preferences (1:1)
  │
  └─── [created_by/updated_by] ──── notification_templates (N:1)
                                          │
                                          ├─── notification_template_audit (1:N)
                                          └─── notification_variables (M:N via variables[] array)

notification_analytics [standalone — aggregated from notification_logs]
```

---

## Enums

### `notification_channel`
```sql
'in_app' | 'email' | 'sms' | 'push' | 'whatsapp'
```

### `notification_priority`
```sql
'low' | 'normal' | 'high' | 'urgent'
```

### `notification_status`
```sql
'pending' | 'dispatched' | 'delivered' | 'failed' | 'cancelled' | 'archived'
```

### `notification_event`
44 event types across 8 categories:
- **Match**: interest_received, interest_accepted, interest_rejected, connected, profile_viewed, shortlisted, profile_liked
- **Chat**: new_message, message_read, request, request_accepted
- **Profile**: verified, rejected, incomplete, photo_approved, photo_rejected
- **Payment**: subscription_started/renewed/expiring/expired, payment_failed/refunded
- **Associate**: new_assignment, case_updated, meeting_scheduled, commission_released, review_received, marriage_completed, dispute_opened, withdrawal_approved/rejected, reminder_due
- **System**: announcement, maintenance, fraud_alert, kyc_required, account_suspended/restored, support_reply
- **OTP**: requested, verified, failed
- **Marketing**: broadcast, campaign, weekly_digest, match_digest

### `delivery_status`
```sql
'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced' | 'rejected' | 'unsubscribed' | 'pending'
```

### `otp_preference`
```sql
'sms' | 'whatsapp' | 'email'
```

### `queue_status`
```sql
'pending' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying' | 'dead_lettered'
```

### `campaign_status`
```sql
'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled' | 'archived'
```

### `template_status`
```sql
'draft' | 'active' | 'inactive' | 'archived'
```

---

## Tables

### `notifications` (Phase 1 — core)
The primary notification record. One row per notification sent to a user, regardless of channel count.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Unique notification ID |
| `user_id` | UUID FK→profiles | Recipient user |
| `type` | TEXT | NotificationEvent string key |
| `title` | TEXT ≤255 | Display title |
| `body` | TEXT ≤2000 | Display body |
| `action_url` | TEXT | Deep-link CTA URL |
| `image_url` | TEXT | Optional notification image |
| `metadata` | JSONB | Arbitrary extra data |
| `priority` | notification_priority | Delivery urgency |
| `channels` | notification_channel[] | Channels this was dispatched to |
| `status` | notification_status | Current lifecycle status |
| `is_read` | BOOLEAN | Has the user read this? |
| `read_at` | TIMESTAMPTZ | When it was read |
| `is_deleted` | BOOLEAN | Soft-delete flag |

---

### `notification_templates`
CMS-backed message templates. One unique template per `(channel, event, language)` tuple.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `name` | TEXT | Human-readable name |
| `slug` | TEXT UNIQUE | URL-safe identifier |
| `channel` | notification_channel | Target delivery channel |
| `category` | TEXT | transactional / otp / marketing / system |
| `event` | notification_event | Triggering event |
| `language` | TEXT | ISO 639-1 (en, hi, mr, etc.) |
| `subject` | TEXT | Email subject (NULL for non-email) |
| `body` | TEXT ≤4000 | Template body with `{{variable}}` placeholders |
| `html_body` | TEXT | HTML version for email |
| `variables` | JSONB (array) | List of `{{variable}}` names expected |
| `dlt_template_id` | TEXT | India DLT registration ID for SMS |
| `sender_id` | TEXT | 6-char DLT sender ID (e.g. RSTJDO) |
| `status` | template_status | Lifecycle state |
| `version` | INTEGER | Increments on each update |
| `is_default` | BOOLEAN | System default — cannot be deleted |

**Constraint**: `UNIQUE (channel, event, language)` — prevents duplicate templates.

---

### `notification_variables`
Registry of every `{{variable}}` used across all templates. 28 standard variables seeded.

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT UNIQUE | Template placeholder, e.g. `otp`, `name`, `amount` |
| `name` | TEXT | Human label |
| `data_type` | TEXT | string / number / date / boolean / url / currency |
| `is_sensitive` | BOOLEAN | PII — masked in audit logs |
| `category` | TEXT | general / user / payment / match / associate |
| `example_value` | TEXT | Sample value for template preview |

---

### `notification_preferences` (Phase 2 extended)
Per-user channel and category opt-in settings. Auto-created on profile INSERT.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `user_id` | UUID PK→profiles | | |
| `in_app_enabled` | BOOLEAN | TRUE | |
| `email_enabled` | BOOLEAN | TRUE | |
| `sms_enabled` | BOOLEAN | FALSE | |
| `push_enabled` | BOOLEAN | FALSE | |
| `whatsapp_enabled` | BOOLEAN | FALSE | |
| `marketing_enabled` | BOOLEAN | FALSE | Marketing/promotional notifications |
| `security_enabled` | BOOLEAN | TRUE | Security alerts (cannot be disabled in UI) |
| `payment_enabled` | BOOLEAN | TRUE | Payment/subscription alerts |
| `associate_enabled` | BOOLEAN | TRUE | Associate case updates |
| `match_digest_enabled` | BOOLEAN | TRUE | Daily match digest emails |
| `weekly_digest_enabled` | BOOLEAN | TRUE | Weekly activity digest |
| `otp_preference` | otp_preference | 'sms' | Preferred OTP delivery channel |
| `fallback_enabled` | BOOLEAN | TRUE | Try next channel on primary failure |
| `quiet_hours_start` | TIME | NULL | Start of DND window (e.g. 22:00) |
| `quiet_hours_end` | TIME | NULL | End of DND window (e.g. 08:00) |
| `event_preferences` | JSONB | `{}` | Per-event channel overrides |

---

### `notification_logs` ⚡ PARTITIONED
Immutable master delivery audit log. **One row per send attempt per channel.** Partitioned by month on `created_at`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (composite PK with created_at) | |
| `notification_id` | UUID | Parent notification |
| `user_id` | UUID FK→profiles | |
| `event` | notification_event | |
| `channel` | notification_channel | |
| `status` | delivery_status | Current delivery state |
| `provider` | TEXT | resend / msg91 / twilio / supabase / fcm |
| `template_id` | UUID FK→notification_templates | |
| `request_payload` | JSONB | Exact payload sent to provider |
| `response_payload` | JSONB | Provider's raw response |
| `error_message` | TEXT | Failure description |
| `provider_message_id` | TEXT | External ID from provider |
| `recipient` | TEXT | Masked phone/email for audit |
| `cost_units` | NUMERIC(10,4) | Provider cost (SMS segments, email units) |
| `retry_count` | INTEGER | How many retries so far |

**Partitions**: Created for 6 months ahead. New partition auto-created by pg_cron on 25th of each month.

> ⚠️ **Important**: Always include `created_at` in WHERE clauses on `notification_logs` to enable partition pruning and avoid full-table scans.

---

### `notification_queue`
Master fan-out queue. After INSERT, channel-specific queues are populated.

| Column | Type | Description |
|--------|------|-------------|
| `notification_id` | UUID FK→notifications | |
| `priority` | notification_priority | Higher priority = processed first |
| `status` | queue_status | State machine |
| `channel` | notification_channel | Target channel |
| `scheduled_for` | TIMESTAMPTZ | When to process (supports scheduling) |
| `attempts` | SMALLINT | Current attempt count |
| `max_attempts` | SMALLINT (1-10) | Maximum delivery attempts |
| `worker_id` | TEXT | ID of the worker holding this lock |

---

### `email_queue`
Dedicated email delivery queue. Populated by `fn_queue_notification()`.

Key columns beyond the base queue columns:
- `to_email`, `from_email`, `reply_to`
- `subject`, `html_body`, `text_body`
- `headers`, `attachments`, `tags`
- Delivery timestamps: `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `bounced_at`
- `provider`: default `resend`

---

### `sms_queue`
Dedicated SMS queue. MSG91 DLT-compliant.

Key columns:
- `to_phone`: E.164 format (`+91XXXXXXXXXX`)
- `dlt_template_id`: **Required** for Indian numbers (TRAI regulation)
- `sender_id`: 6-char DLT sender ID (`RSTJDO`)
- `is_unicode`: TRUE for Hindi/Marathi/regional scripts
- `segment_count` + `cost_per_segment` → `total_cost` (GENERATED COLUMN)

---

### `whatsapp_queue`
WhatsApp Business API queue.

Key columns:
- `template_name`: WhatsApp-approved template name (required)
- `template_language`: e.g. `en`, `hi`
- `template_variables`: positional component parameters (JSONB)
- `media_url` + `media_type`: optional image/video/document
- `provider_message_id`: WhatsApp `wamid`

---

### `failed_notifications`
Dead-letter store. Auto-populated by trigger when `retry_count >= 2` on a failed log entry.

| Column | Type | Description |
|--------|------|-------------|
| `failure_reason` | TEXT | Human-readable failure description |
| `provider_error_code` | TEXT | Raw provider error code |
| `retry_count` | SMALLINT | Attempts made so far |
| `max_retries` | SMALLINT | Maximum before escalation |
| `is_resolved` | BOOLEAN | Admin has manually resolved |
| `escalated` | BOOLEAN | Flagged for manual intervention |

---

### `retry_queue`
Scheduled retry attempts with exponential backoff.

| Attempt | Delay |
|---------|-------|
| 1st retry | 30 seconds |
| 2nd retry | 2 minutes |
| 3rd retry | 8 minutes |
| 4th retry | 32 minutes |
| 5th retry | ~2 hours |

---

### `delivery_reports`
Aggregated delivery analytics per notification. Auto-created by trigger on `notifications` INSERT.

Tracks per-channel metrics (sent, delivered, opened, clicked, bounced) with timestamps. `overall_status` reflects the best delivery outcome across all channels.

---

### `notification_analytics`
Daily aggregated delivery statistics. Populated by `fn_upsert_daily_analytics()` via pg_cron.

**Generated columns** (computed, stored for fast reads):
- `delivery_rate` = `delivered / total_sent * 100`
- `open_rate` = `opened / emails_sent * 100`
- `success_rate` = `(total_sent - failed) / total_sent * 100`
- `avg_cost_per_msg` = `total_cost / total_sent`

Unique constraint: `(date, channel, event, provider)`

---

### `broadcast_campaigns`
Marketing and system broadcast campaigns with audience targeting.

| Column | Type | Description |
|--------|------|-------------|
| `audience_type` | TEXT | all / segment / list / manual |
| `audience_filter` | JSONB | Filter criteria (age range, location, subscription, etc.) |
| `estimated_reach` | INTEGER | Pre-send audience size estimate |
| `is_ab_test` | BOOLEAN | A/B test campaign |
| `approved_by` | UUID FK→profiles | Admin who approved the campaign |

---

### `broadcast_recipients`
Per-user delivery tracking for each campaign.

Unique constraint: `(campaign_id, user_id, channel)` — prevents duplicate sends.

---

### `notification_template_audit`
Immutable audit trail. No FK to `notification_templates` — history is preserved even after template deletion.

Tracks `INSERT`, `UPDATE`, `DELETE` with `old_data` and `new_data` JSONB snapshots and `changed_fields` array.

---

## Relationships

| From | To | Type | FK |
|------|----|----|---|
| `notifications` | `profiles` | N:1 | `user_id` |
| `notification_queue` | `notifications` | N:1 | `notification_id` |
| `email_queue` | `notifications` | N:1 | `notification_id` |
| `email_queue` | `notification_queue` | N:1 | `queue_id` |
| `sms_queue` | `notifications` | N:1 | `notification_id` |
| `whatsapp_queue` | `notifications` | N:1 | `notification_id` |
| `notification_logs` | `notifications` | N:1 | `notification_id` |
| `notification_logs` | `profiles` | N:1 | `user_id` |
| `notification_logs` | `notification_templates` | N:1 | `template_id` |
| `failed_notifications` | `notifications` | N:1 | `notification_id` |
| `failed_notifications` | `profiles` | N:1 | `user_id` |
| `retry_queue` | `failed_notifications` | N:1 | `failed_id` |
| `retry_queue` | `notifications` | N:1 | `notification_id` |
| `delivery_reports` | `notifications` | 1:1 | `notification_id` |
| `delivery_reports` | `profiles` | N:1 | `user_id` |
| `broadcast_campaigns` | `notification_templates` | N:1 | `template_id` |
| `broadcast_recipients` | `broadcast_campaigns` | N:1 | `campaign_id` |
| `broadcast_recipients` | `profiles` | N:1 | `user_id` |
| `broadcast_recipients` | `notifications` | N:1 | `notification_id` |
| `notification_preferences` | `profiles` | 1:1 | `user_id` |
| `notification_templates` | `profiles` | N:1 | `created_by`, `updated_by` |
| `notification_template_audit` | `profiles` | N:1 | `changed_by` |

---

## Indexes

### Strategy
- **Composite indexes** on frequent query patterns (user_id + created_at DESC)
- **Partial indexes** on status columns (WHERE status = 'pending') — smaller, faster
- **No over-indexing** — write-heavy tables (logs, queues) only indexed on critical poll paths

### Key Indexes

| Table | Index | Columns | Rationale |
|-------|-------|---------|-----------|
| `notification_logs` | `idx_nl_user_created` | `(user_id, created_at DESC)` | User history query |
| `notification_queue` | `idx_nq_status_scheduled` | `(status, scheduled_for)` WHERE pending/scheduled | Queue worker poll |
| `notification_queue` | `idx_nq_channel_priority` | `(channel, priority, scheduled_for)` | Priority-ordered dispatch |
| `email_queue` | `idx_eq_status_scheduled` | `(status, scheduled_for)` WHERE pending/scheduled | Email worker poll |
| `failed_notifications` | `idx_fn_unresolved` | `(is_resolved, created_at DESC)` WHERE not resolved | Admin dashboard |
| `notification_analytics` | `idx_na_date` | `(date DESC)` | Dashboard date range queries |
| `broadcast_recipients` | `idx_brec_campaign_status` | `(campaign_id, status)` | Campaign delivery report |

---

## Triggers

### `fn_set_updated_at()` — Generic
Applied to all tables with `updated_at`. Sets `NEW.updated_at = NOW()` on every UPDATE.

### `fn_auto_move_to_failed()` — Dead-letter
**Fires**: AFTER INSERT on `notification_logs`
**When**: `status IN ('failed','bounced','rejected') AND retry_count >= 2`
**Action**: Inserts to `failed_notifications` as dead-letter record.

### `fn_audit_template_change()` — Immutable Audit
**Fires**: AFTER INSERT, UPDATE, DELETE on `notification_templates`
**Action**: Writes a row to `notification_template_audit` with old/new JSON snapshots and list of changed columns.

### `fn_archive_completed_queue()` — Status Sync
**Fires**: AFTER UPDATE on `notification_queue`
**When**: `NEW.status = 'completed'`
**Action**: Updates parent `notifications.status = 'dispatched'`.

### `fn_create_delivery_report()` — Auto-init
**Fires**: AFTER INSERT on `notifications`
**Action**: Creates a `delivery_reports` row for the new notification.

### `fn_init_notification_preferences()` — Auto-init
**Fires**: AFTER INSERT on `profiles`
**When**: `NEW.role = 'user'`
**Action**: Creates default `notification_preferences` row for new user.

---

## Functions

### `fn_create_notification(p_user_id, p_event, p_channels, p_template_id, p_title, p_body, ...)`
**Returns**: `UUID` (notification_id)
High-level entry point. Creates the `notifications` record and fans out to `notification_queue` for each channel.

### `fn_queue_notification(p_notification_id, p_channel, p_priority, p_scheduled_for)`
**Returns**: `UUID` (queue_id)
Routes a notification to `notification_queue`. Updates parent notification status to `pending`.

### `fn_mark_delivered(p_log_id, p_notification_id, p_channel, p_provider_message_id, p_response_payload)`
**Returns**: `VOID`
Records successful delivery. Updates `notification_logs`, `delivery_reports`, and `notifications.status`.

### `fn_mark_failed(p_log_id, p_notification_id, p_channel, p_error_message, p_error_code, p_provider)`
**Returns**: `VOID`
Records delivery failure. Updates `notification_logs` and `delivery_reports`.

### `fn_retry_notification(p_failed_id, p_reason)`
**Returns**: `UUID` (retry_queue.id)
Schedules an exponential-backoff retry. Raises exception if max retries exhausted.

### `fn_archive_notification(p_notification_id)`
**Returns**: `VOID`
Soft-archives notification. Cancels all pending/scheduled queue entries across all channel queues.

### `fn_upsert_daily_analytics(p_date)`
**Returns**: `VOID`
Rolls up `notification_logs` into `notification_analytics` for the given date. Safe to run multiple times (ON CONFLICT DO UPDATE). Schedule via pg_cron at `5 0 * * *`.

---

## Views

### `notification_dashboard_view`
Per-user unread counts and 10 most recent notifications. Used by the `NotificationBell` component.

**Columns**: `user_id`, `total_count`, `unread_count`, `urgent_unread`, `high_unread`, `last_notification_at`, `recent_notifications` (JSONB array)

### `delivery_summary_view`
Channel and provider delivery rates across all time. Admin analytics.

**Key metrics**: `delivery_rate_pct`, `email_open_rate_pct`, `click_through_rate_pct`

### `daily_analytics_view`
Rolling 30-day analytics with 7-day moving averages and week-over-week deltas.

**Window functions**: Rolling 7d avg sent, delivery rate, success rate; WoW sent delta.

### `provider_performance_view`
Per-provider reliability scores and average delivery latency in seconds.

---

## Row Level Security

| Table | Users Can | Admins Can |
|-------|-----------|-----------|
| `notifications` | SELECT/UPDATE own rows | ALL |
| `notification_preferences` | ALL own rows | ALL |
| `notification_templates` | SELECT active | ALL |
| `notification_variables` | SELECT | ALL |
| `notification_logs` | SELECT own | ALL |
| `notification_queue` | — | ALL |
| `email_queue` | — | ALL |
| `sms_queue` | — | ALL |
| `whatsapp_queue` | — | ALL |
| `failed_notifications` | SELECT own | ALL |
| `retry_queue` | — | ALL |
| `delivery_reports` | SELECT own | ALL |
| `notification_analytics` | — | ALL |
| `broadcast_campaigns` | — | ALL |
| `broadcast_recipients` | SELECT own | ALL |
| `notification_template_audit` | — | ALL |

**Service role** (used by Server Actions / API routes): INSERT on all queue and log tables.

**Admin check**: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))`

---

## Partitioning

### Table: `notification_logs`
- **Strategy**: RANGE on `created_at`
- **Interval**: Monthly partitions
- **Initial**: 6 months created at migration time (current month + 5 forward)
- **Maintenance**: pg_cron job creates next-next month partition on 25th of each month

**Partition naming**: `notification_logs_YYYY_MM`
Example: `notification_logs_2026_07`, `notification_logs_2026_08`

> ⚡ **Performance Tip**: Always include `created_at >= '...' AND created_at < '...'` in WHERE clauses to enable partition pruning.

---

## Audit Logging

Every template change is recorded in `notification_template_audit`:
- Full `old_data` and `new_data` JSON snapshots
- `changed_fields` array listing which columns changed
- `changed_by` FK to profiles
- No FK from audit table to templates — records survive template deletion

---

## Performance Notes

1. **Partial indexes** on queue tables (`WHERE status IN ('pending','scheduled')`) dramatically reduce index size for polling queries.
2. **Generated columns** in `sms_queue.total_cost` and `notification_analytics` avoid runtime computation on reads.
3. **JSONB `request_payload`** in logs — query with `@>` operator and GIN index if needed in future.
4. **`notification_dashboard_view`** uses `ROW_NUMBER()` window function — consider materialized view if user count exceeds 100K.
5. **Dead-letter trigger** fires AFTER INSERT — does not block the insert path.

---

## Migration Order

```
0001_initial_schema.sql          ← profiles table (required for FKs)
0002_upgrade_schema.sql          ← extended profile columns
0003_search_indexes.sql          ← GIN search indexes
0004_chat_system.sql             ← chat tables
0005_associate_network.sql       ← associate tables
0006_super_admin_platform.sql    ← admin tables
0007_profile_photos_bucket.sql   ← storage buckets
0008_fix_profile_photos_bucket.sql
0009_unique_mobile_number.sql
0010_feature_flags.sql
0011_notification_foundation.sql ← Phase 1: notifications, notification_preferences (basic)
0012_notification_system.sql     ← Phase 2: full enterprise notification architecture ← YOU ARE HERE
```

---

## pg_cron Schedule Reference

Enable pg_cron in Supabase Dashboard → Database → Extensions.

```sql
-- Daily analytics rollup (midnight + 5min UTC)
SELECT cron.schedule('daily-notification-analytics', '5 0 * * *',
  $$ SELECT fn_upsert_daily_analytics(CURRENT_DATE - 1) $$
);

-- Monthly partition creation (25th of each month, 1 AM UTC)
SELECT cron.schedule('create-notification-log-partition', '0 1 25 * *', $$ ... $$);

-- Retry queue cleanup (2 AM UTC daily)
SELECT cron.schedule('cleanup-retry-queue', '0 2 * * *',
  $$ DELETE FROM retry_queue WHERE status IN ('completed','failed') AND created_at < NOW() - INTERVAL '30 days' $$
);
```

Full cron SQL is commented out at the bottom of `0012_notification_system.sql`.
