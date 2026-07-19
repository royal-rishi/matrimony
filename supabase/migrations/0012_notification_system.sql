-- ============================================================
-- MIGRATION: 0012_notification_system.sql
-- RishtaJodo Matrimony — Enterprise Notification Database
-- Phase 2: Complete database layer
--
-- Execution Order:
--   1.  Extended & New Enums
--   2.  Utility trigger function (updated_at)
--   3.  notification_templates
--   4.  notification_variables
--   5.  ALTER notification_preferences (Phase 1 table extended)
--   6.  notification_logs  (monthly partitioned)
--   7.  notification_queue
--   8.  email_queue
--   9.  sms_queue
--  10.  whatsapp_queue
--  11.  failed_notifications
--  12.  retry_queue
--  13.  delivery_reports
--  14.  notification_analytics
--  15.  broadcast_campaigns
--  16.  broadcast_recipients
--  17.  notification_template_audit
--  18.  Indexes
--  19.  Triggers
--  20.  Functions
--  21.  Views
--  22.  Row Level Security
--  23.  Realtime & Comments
-- ============================================================

-- ============================================================
-- SECTION 1: ENUMS
-- ============================================================

-- notification_event: every trigger event across the platform
DO $$ BEGIN
  CREATE TYPE notification_event AS ENUM (
    -- Match events
    'match.interest_received',
    'match.interest_accepted',
    'match.interest_rejected',
    'match.connected',
    'match.profile_viewed',
    'match.shortlisted',
    'match.profile_liked',
    -- Chat events
    'chat.new_message',
    'chat.message_read',
    'chat.request',
    'chat.request_accepted',
    -- Profile events
    'profile.verified',
    'profile.rejected',
    'profile.incomplete',
    'profile.photo_approved',
    'profile.photo_rejected',
    -- Payment events
    'payment.subscription_started',
    'payment.subscription_renewed',
    'payment.subscription_expiring',
    'payment.subscription_expired',
    'payment.payment_failed',
    'payment.payment_refunded',
    -- Associate events
    'associate.new_assignment',
    'associate.case_updated',
    'associate.meeting_scheduled',
    'associate.commission_released',
    'associate.review_received',
    'associate.marriage_completed',
    'associate.dispute_opened',
    'associate.withdrawal_approved',
    'associate.withdrawal_rejected',
    'associate.reminder_due',
    -- System events
    'system.announcement',
    'system.maintenance',
    'system.fraud_alert',
    'system.kyc_required',
    'system.account_suspended',
    'system.account_restored',
    'system.support_reply',
    -- OTP events
    'otp.requested',
    'otp.verified',
    'otp.failed',
    -- Marketing events
    'marketing.broadcast',
    'marketing.campaign',
    'marketing.weekly_digest',
    'marketing.match_digest'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- delivery_status: granular lifecycle of a single delivery attempt
DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM (
    'sent',
    'delivered',
    'opened',
    'clicked',
    'failed',
    'bounced',
    'rejected',
    'unsubscribed',
    'pending'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- otp_preference: user's preferred OTP delivery channel
DO $$ BEGIN
  CREATE TYPE otp_preference AS ENUM (
    'sms',
    'whatsapp',
    'email'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- queue_status: state machine for all queue tables
DO $$ BEGIN
  CREATE TYPE queue_status AS ENUM (
    'pending',
    'scheduled',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'retrying',
    'dead_lettered'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- campaign_status: broadcast campaign lifecycle
DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM (
    'draft',
    'scheduled',
    'running',
    'paused',
    'completed',
    'cancelled',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- template_status: notification template lifecycle
DO $$ BEGIN
  CREATE TYPE template_status AS ENUM (
    'draft',
    'active',
    'inactive',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend existing notification_status with 'archived'
DO $$ BEGIN
  ALTER TYPE notification_status ADD VALUE IF NOT EXISTS 'archived';
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================
-- SECTION 2: GENERIC UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- SECTION 3: notification_templates
-- Purpose: CMS-backed message templates per channel/event/language.
-- One template per (channel, event, language) combination.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT          NOT NULL,
  slug            TEXT          NOT NULL,                  -- unique identifier, e.g. 'match-interest-received-sms-hi'
  channel         notification_channel NOT NULL,
  category        TEXT          NOT NULL DEFAULT 'transactional', -- transactional | otp | marketing | system
  event           notification_event NOT NULL,
  language        TEXT          NOT NULL DEFAULT 'en',     -- ISO 639-1 language code
  subject         TEXT,                                    -- email subject line (NULL for non-email channels)
  body            TEXT          NOT NULL,                  -- raw template body with {{variable}} placeholders
  html_body       TEXT,                                    -- HTML version for email (NULL for non-email)
  variables       JSONB         NOT NULL DEFAULT '[]',     -- array of variable names expected in this template
  dlt_template_id TEXT,                                    -- India DLT registration ID for SMS/WhatsApp
  sender_id       TEXT,                                    -- DLT sender ID (e.g. 'RSTJDO')
  status          template_status NOT NULL DEFAULT 'draft',
  version         INTEGER       NOT NULL DEFAULT 1,
  is_default      BOOLEAN       NOT NULL DEFAULT FALSE,    -- system default (non-deletable)
  created_by      UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by      UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_template_slug            UNIQUE (slug),
  CONSTRAINT uq_template_channel_event_lang UNIQUE (channel, event, language),
  CONSTRAINT chk_template_name_length    CHECK (char_length(name) BETWEEN 2 AND 255),
  CONSTRAINT chk_template_body_length    CHECK (char_length(body) <= 4000),
  CONSTRAINT chk_template_language       CHECK (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  CONSTRAINT chk_template_version        CHECK (version >= 1)
);

CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 4: notification_variables
-- Purpose: Registry of reusable template variable definitions.
-- Documents every {{variable}} used across templates.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_variables (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT          NOT NULL,                  -- human label, e.g. 'Recipient Name'
  key             TEXT          NOT NULL UNIQUE,           -- template key, e.g. 'name'
  description     TEXT,
  example_value   TEXT,                                    -- sample value for previews
  data_type       TEXT          NOT NULL DEFAULT 'string', -- string | number | date | boolean | url
  is_required     BOOLEAN       NOT NULL DEFAULT FALSE,
  is_sensitive    BOOLEAN       NOT NULL DEFAULT FALSE,    -- PII — mask in logs
  category        TEXT          NOT NULL DEFAULT 'general',-- general | user | payment | match | associate
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_variable_key   CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT chk_variable_dtype CHECK (data_type IN ('string','number','date','boolean','url','currency'))
);

CREATE TRIGGER trg_notification_variables_updated_at
  BEFORE UPDATE ON notification_variables
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Seed standard variables
INSERT INTO notification_variables (name, key, description, example_value, data_type, is_required, category)
VALUES
  ('Recipient Name',        'name',           'Full name of the notification recipient',      'Rahul Sharma',       'string',   true,  'user'),
  ('First Name',            'first_name',     'First name of the recipient',                  'Rahul',              'string',   false, 'user'),
  ('OTP Code',              'otp',            'One-time password for verification',            '847291',             'string',   false, 'general'),
  ('OTP Expiry Minutes',    'otp_expiry',     'Minutes until OTP expires',                    '10',                 'number',   false, 'general'),
  ('Amount (INR)',          'amount',         'Transaction amount in Indian Rupees',           '₹2,999',             'currency', false, 'payment'),
  ('Plan Name',             'plan',           'Subscription plan name',                        'Premium Gold',       'string',   false, 'payment'),
  ('Days Left',             'days_left',      'Days remaining in subscription',               '7',                  'number',   false, 'payment'),
  ('Associate Name',        'associate',      'Assigned associate full name',                 'Suresh Verma',       'string',   false, 'associate'),
  ('Meeting Date',          'meeting_date',   'Scheduled meeting date/time',                  '20 Jul 2026, 4:00PM','date',     false, 'associate'),
  ('Case Number',           'case_number',    'Associate case reference number',              'CASE-2026-00142',    'string',   false, 'associate'),
  ('Partner Name',          'partner_name',   'Name of the matched partner',                  'Priya Patel',        'string',   false, 'match'),
  ('Sender Name',           'sender_name',    'Name of the user who initiated the action',    'Anjali Gupta',       'string',   false, 'match'),
  ('Match Score',           'match_score',    'Compatibility score percentage',               '87%',                'string',   false, 'match'),
  ('Action URL',            'action_url',     'Deep-link URL for the CTA button',             'https://rishtajodo.com/matches/123', 'url', false, 'general'),
  ('Stage Name',            'stage',          'Current case stage',                           'Family Discussion',  'string',   false, 'associate'),
  ('Rating',                'rating',         'Star rating (1-5)',                             '5',                  'number',   false, 'associate'),
  ('Reason',                'reason',         'Reason for rejection or cancellation',         'Documents unclear',  'string',   false, 'general'),
  ('Ticket ID',             'ticket_id',      'Support ticket reference number',              'TKT-2026-00892',     'string',   false, 'general'),
  ('Tier Name',             'tier_name',      'Membership tier name',                         'Platinum Elite',     'string',   false, 'payment'),
  ('Commission Amount',     'commission',     'Commission amount in INR',                     '₹1,500',             'currency', false, 'associate'),
  ('Groom Name',            'groom_name',     'Full name of the groom',                       'Vikram Singh',       'string',   false, 'associate'),
  ('Bride Name',            'bride_name',     'Full name of the bride',                       'Sneha Joshi',        'string',   false, 'associate'),
  ('Message Preview',       'message_preview','Preview of the chat message',                  'Hello, I liked your profile', 'string', false, 'match'),
  ('Maintenance Start',     'start_time',     'Maintenance window start time',                '2:00 AM IST',        'date',     false, 'system'),
  ('Maintenance End',       'end_time',       'Maintenance window end time',                  '4:00 AM IST',        'date',     false, 'system'),
  ('Maintenance Date',      'date',           'Date of scheduled maintenance',                '25 Jul 2026',        'date',     false, 'system'),
  ('Announcement Title',    'title',          'Title of the system announcement',             'New Feature Released','string',  false, 'system'),
  ('Announcement Message',  'message',        'Body of the system announcement',              'We have launched...','string',   false, 'system')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SECTION 5: ALTER notification_preferences
-- Extends the Phase 1 table with granular category-level prefs.
-- ============================================================

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS marketing_enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS security_enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS payment_enabled       BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS associate_enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS match_digest_enabled  BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS weekly_digest_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS otp_preference        otp_preference NOT NULL DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS fallback_enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_enabled          BOOLEAN     NOT NULL DEFAULT FALSE;

-- Add unique constraint on generated id if not already primary key
DO $$ BEGIN
  ALTER TABLE notification_preferences ADD CONSTRAINT uq_notif_pref_id UNIQUE (id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- Trigger for updated_at on preferences
DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 6: notification_logs  (PARTITIONED BY MONTH)
-- Purpose: Immutable master delivery audit log.
-- Every send attempt generates one row per channel.
-- Partitioned by created_at for query performance at scale.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
  notification_id     UUID            NOT NULL,
  user_id             UUID            NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  event               notification_event NOT NULL,
  channel             notification_channel NOT NULL,
  status              delivery_status NOT NULL DEFAULT 'pending',
  provider            TEXT,                                -- 'resend' | 'msg91' | 'twilio' | 'supabase' | 'fcm'
  template_id         UUID            REFERENCES notification_templates(id) ON DELETE SET NULL,
  request_payload     JSONB           NOT NULL DEFAULT '{}',
  response_payload    JSONB,
  error_message       TEXT,
  error_code          TEXT,
  provider_message_id TEXT,                               -- external message ID from provider
  recipient           TEXT,                               -- masked phone/email for audit
  delivered_at        TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  clicked_at          TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  bounced_at          TIMESTAMPTZ,
  retry_count         INTEGER         NOT NULL DEFAULT 0,
  cost_units          NUMERIC(10, 4)  NOT NULL DEFAULT 0, -- provider cost units (e.g. SMS segments)
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_log_retry_count CHECK (retry_count >= 0),
  CONSTRAINT chk_log_cost        CHECK (cost_units >= 0),
  PRIMARY KEY (id, created_at)                            -- composite PK required for partitioning
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for 6 months (current + 5 forward)
DO $$
DECLARE
  start_date DATE;
  end_date   DATE;
  partition_name TEXT;
  i INTEGER;
BEGIN
  FOR i IN 0..5 LOOP
    start_date := DATE_TRUNC('month', NOW()) + (i || ' months')::INTERVAL;
    end_date   := start_date + '1 month'::INTERVAL;
    partition_name := 'notification_logs_' || TO_CHAR(start_date, 'YYYY_MM');

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = partition_name AND n.nspname = 'public'
    ) THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF notification_logs
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- SECTION 7: notification_queue
-- Purpose: Master routing queue — fan-out source.
-- After INSERT, triggers fan out to channel-specific queues.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID            NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  priority        notification_priority NOT NULL DEFAULT 'normal',
  status          queue_status    NOT NULL DEFAULT 'pending',
  channel         notification_channel NOT NULL,
  scheduled_for   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  attempts        SMALLINT        NOT NULL DEFAULT 0,
  max_attempts    SMALLINT        NOT NULL DEFAULT 3,
  worker_id       TEXT,                                   -- ID of the worker processing this job
  last_error      TEXT,
  metadata        JSONB           NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_nq_attempts     CHECK (attempts >= 0),
  CONSTRAINT chk_nq_max_attempts CHECK (max_attempts BETWEEN 1 AND 10),
  CONSTRAINT chk_nq_attempts_lte CHECK (attempts <= max_attempts)
);

CREATE TRIGGER trg_notification_queue_updated_at
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 8: email_queue
-- Purpose: Dedicated queue for email delivery.
-- Populated by fn_queue_notification() for email channel.
-- ============================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  queue_id            UUID        REFERENCES notification_queue(id) ON DELETE SET NULL,
  to_email            TEXT        NOT NULL,
  to_name             TEXT,
  from_email          TEXT        NOT NULL DEFAULT 'noreply@rishtajodo.com',
  from_name           TEXT        NOT NULL DEFAULT 'RishtaJodo',
  reply_to            TEXT,
  subject             TEXT        NOT NULL,
  html_body           TEXT        NOT NULL,
  text_body           TEXT,
  template_id         UUID        REFERENCES notification_templates(id) ON DELETE SET NULL,
  template_variables  JSONB       NOT NULL DEFAULT '{}',
  priority            notification_priority NOT NULL DEFAULT 'normal',
  status              queue_status NOT NULL DEFAULT 'pending',
  scheduled_for       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  clicked_at          TIMESTAMPTZ,
  bounced_at          TIMESTAMPTZ,
  provider            TEXT        DEFAULT 'resend',
  provider_message_id TEXT,
  attempts            SMALLINT    NOT NULL DEFAULT 0,
  max_attempts        SMALLINT    NOT NULL DEFAULT 3,
  last_error          TEXT,
  headers             JSONB       NOT NULL DEFAULT '{}',
  attachments         JSONB       NOT NULL DEFAULT '[]',
  tags                TEXT[]      NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_eq_email        CHECK (to_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  CONSTRAINT chk_eq_attempts     CHECK (attempts >= 0),
  CONSTRAINT chk_eq_max_attempts CHECK (max_attempts BETWEEN 1 AND 10)
);

CREATE TRIGGER trg_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 9: sms_queue
-- Purpose: Dedicated SMS queue (Phase 3 MSG91 / Twilio).
-- DLT template ID required for Indian numbers.
-- ============================================================

CREATE TABLE IF NOT EXISTS sms_queue (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  queue_id            UUID        REFERENCES notification_queue(id) ON DELETE SET NULL,
  to_phone            TEXT        NOT NULL,               -- E.164 format: +91XXXXXXXXXX
  country_code        TEXT        NOT NULL DEFAULT '+91',
  message_body        TEXT        NOT NULL,
  dlt_template_id     TEXT,                               -- India DLT registration ID (mandatory for IN)
  sender_id           TEXT        NOT NULL DEFAULT 'RSTJDO',
  is_unicode          BOOLEAN     NOT NULL DEFAULT FALSE, -- TRUE for Hindi/regional scripts
  is_flash            BOOLEAN     NOT NULL DEFAULT FALSE,
  template_id         UUID        REFERENCES notification_templates(id) ON DELETE SET NULL,
  template_variables  JSONB       NOT NULL DEFAULT '{}',
  priority            notification_priority NOT NULL DEFAULT 'normal',
  status              queue_status NOT NULL DEFAULT 'pending',
  scheduled_for       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  provider            TEXT        NOT NULL DEFAULT 'msg91',
  provider_message_id TEXT,
  provider_response   JSONB,
  segment_count       SMALLINT    NOT NULL DEFAULT 1,     -- number of SMS segments used
  cost_per_segment    NUMERIC(8,4) NOT NULL DEFAULT 0,
  total_cost          NUMERIC(10,4) GENERATED ALWAYS AS (segment_count * cost_per_segment) STORED,
  attempts            SMALLINT    NOT NULL DEFAULT 0,
  max_attempts        SMALLINT    NOT NULL DEFAULT 3,
  last_error          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_sq_phone        CHECK (to_phone ~ '^\+[1-9]\d{7,14}$'),
  CONSTRAINT chk_sq_attempts     CHECK (attempts >= 0),
  CONSTRAINT chk_sq_segments     CHECK (segment_count BETWEEN 1 AND 10)
);

CREATE TRIGGER trg_sms_queue_updated_at
  BEFORE UPDATE ON sms_queue
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 10: whatsapp_queue
-- Purpose: WhatsApp Business API queue (Phase 4).
-- Uses approved WhatsApp message templates.
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_queue (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  queue_id            UUID        REFERENCES notification_queue(id) ON DELETE SET NULL,
  to_phone            TEXT        NOT NULL,               -- WhatsApp number (E.164)
  template_name       TEXT        NOT NULL,               -- WhatsApp approved template name
  template_language   TEXT        NOT NULL DEFAULT 'en',
  template_variables  JSONB       NOT NULL DEFAULT '{}',  -- positional component params
  media_url           TEXT,                               -- optional media attachment URL
  media_type          TEXT,                               -- image | video | document
  button_payload      JSONB,                              -- quick reply / CTA button data
  template_id         UUID        REFERENCES notification_templates(id) ON DELETE SET NULL,
  priority            notification_priority NOT NULL DEFAULT 'normal',
  status              queue_status NOT NULL DEFAULT 'pending',
  scheduled_for       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  read_at             TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  provider            TEXT        NOT NULL DEFAULT 'meta_cloud_api',
  provider_message_id TEXT,                               -- WhatsApp wamid
  provider_response   JSONB,
  attempts            SMALLINT    NOT NULL DEFAULT 0,
  max_attempts        SMALLINT    NOT NULL DEFAULT 3,
  last_error          TEXT,
  cost_units          NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_wq_phone    CHECK (to_phone ~ '^\+[1-9]\d{7,14}$'),
  CONSTRAINT chk_wq_attempts CHECK (attempts >= 0)
);

CREATE TRIGGER trg_whatsapp_queue_updated_at
  BEFORE UPDATE ON whatsapp_queue
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 11: failed_notifications
-- Purpose: Dead-letter store for all exhausted deliveries.
-- Auto-populated by trigger on notification_logs.
-- ============================================================

CREATE TABLE IF NOT EXISTS failed_notifications (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  log_id              UUID        NOT NULL,               -- references notification_logs.id
  user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  event               notification_event NOT NULL,
  channel             notification_channel NOT NULL,
  provider            TEXT,
  failure_reason      TEXT        NOT NULL,               -- human-readable failure reason
  provider_error_code TEXT,
  provider_error_msg  TEXT,
  request_payload     JSONB       NOT NULL DEFAULT '{}',
  retry_count         SMALLINT    NOT NULL DEFAULT 0,
  max_retries         SMALLINT    NOT NULL DEFAULT 5,
  is_resolved         BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved_at         TIMESTAMPTZ,
  resolved_by         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes    TEXT,
  escalated           BOOLEAN     NOT NULL DEFAULT FALSE,
  escalated_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_fn_retry_count CHECK (retry_count >= 0),
  CONSTRAINT chk_fn_max_retries CHECK (max_retries BETWEEN 1 AND 10)
);

CREATE TRIGGER trg_failed_notifications_updated_at
  BEFORE UPDATE ON failed_notifications
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 12: retry_queue
-- Purpose: Scheduled retry attempts with exponential backoff.
-- ============================================================

CREATE TABLE IF NOT EXISTS retry_queue (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  failed_id           UUID        NOT NULL REFERENCES failed_notifications(id) ON DELETE CASCADE,
  notification_id     UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel             notification_channel NOT NULL,
  attempt_number      SMALLINT    NOT NULL,               -- which retry attempt this is
  scheduled_for       TIMESTAMPTZ NOT NULL,               -- when to retry
  status              queue_status NOT NULL DEFAULT 'scheduled',
  worker_id           TEXT,
  executed_at         TIMESTAMPTZ,
  result              TEXT,                               -- 'success' | 'failed'
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_rq_attempt CHECK (attempt_number BETWEEN 1 AND 10)
);

CREATE TRIGGER trg_retry_queue_updated_at
  BEFORE UPDATE ON retry_queue
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 13: delivery_reports
-- Purpose: Per-notification delivery analytics row.
-- One row per notification_id (aggregates all channel results).
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_reports (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID        NOT NULL UNIQUE REFERENCES notifications(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  event               notification_event NOT NULL,
  channels_attempted  INTEGER     NOT NULL DEFAULT 0,
  channels_delivered  INTEGER     NOT NULL DEFAULT 0,
  channels_failed     INTEGER     NOT NULL DEFAULT 0,
  -- Email metrics
  email_sent          BOOLEAN     NOT NULL DEFAULT FALSE,
  email_delivered     BOOLEAN     NOT NULL DEFAULT FALSE,
  email_opened        BOOLEAN     NOT NULL DEFAULT FALSE,
  email_clicked       BOOLEAN     NOT NULL DEFAULT FALSE,
  email_bounced       BOOLEAN     NOT NULL DEFAULT FALSE,
  -- SMS metrics
  sms_sent            BOOLEAN     NOT NULL DEFAULT FALSE,
  sms_delivered       BOOLEAN     NOT NULL DEFAULT FALSE,
  sms_failed          BOOLEAN     NOT NULL DEFAULT FALSE,
  -- WhatsApp metrics
  whatsapp_sent       BOOLEAN     NOT NULL DEFAULT FALSE,
  whatsapp_delivered  BOOLEAN     NOT NULL DEFAULT FALSE,
  whatsapp_read       BOOLEAN     NOT NULL DEFAULT FALSE,
  -- In-App metrics
  in_app_delivered    BOOLEAN     NOT NULL DEFAULT FALSE,
  in_app_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Timing
  first_sent_at       TIMESTAMPTZ,
  first_delivered_at  TIMESTAMPTZ,
  first_read_at       TIMESTAMPTZ,
  first_clicked_at    TIMESTAMPTZ,
  -- Overall
  overall_status      delivery_status NOT NULL DEFAULT 'pending',
  total_cost          NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_dr_channels CHECK (channels_attempted >= 0),
  CONSTRAINT chk_dr_delivered CHECK (channels_delivered <= channels_attempted)
);

CREATE TRIGGER trg_delivery_reports_updated_at
  BEFORE UPDATE ON delivery_reports
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 14: notification_analytics
-- Purpose: Daily aggregated delivery analytics.
-- Populated by scheduled job or trigger on notification_logs.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_analytics (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date                DATE        NOT NULL,
  channel             notification_channel,               -- NULL = all channels combined
  event               TEXT,                               -- NULL = all events combined
  provider            TEXT,                               -- NULL = all providers combined
  -- Volume counters
  total_sent          INTEGER     NOT NULL DEFAULT 0,
  emails_sent         INTEGER     NOT NULL DEFAULT 0,
  sms_sent            INTEGER     NOT NULL DEFAULT 0,
  whatsapp_sent       INTEGER     NOT NULL DEFAULT 0,
  in_app_sent         INTEGER     NOT NULL DEFAULT 0,
  otp_sent            INTEGER     NOT NULL DEFAULT 0,
  -- Status counters
  delivered           INTEGER     NOT NULL DEFAULT 0,
  opened              INTEGER     NOT NULL DEFAULT 0,
  clicked             INTEGER     NOT NULL DEFAULT 0,
  failed              INTEGER     NOT NULL DEFAULT 0,
  bounced             INTEGER     NOT NULL DEFAULT 0,
  rejected            INTEGER     NOT NULL DEFAULT 0,
  -- Rates (computed, stored for fast dashboards)
  delivery_rate       NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_sent > 0
    THEN ROUND((delivered::NUMERIC / total_sent) * 100, 2)
    ELSE 0 END
  ) STORED,
  open_rate           NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN emails_sent > 0
    THEN ROUND((opened::NUMERIC / emails_sent) * 100, 2)
    ELSE 0 END
  ) STORED,
  success_rate        NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_sent > 0
    THEN ROUND(((total_sent - failed)::NUMERIC / total_sent) * 100, 2)
    ELSE 0 END
  ) STORED,
  -- Cost
  total_cost          NUMERIC(12,4) NOT NULL DEFAULT 0,
  avg_cost_per_msg    NUMERIC(10,4) GENERATED ALWAYS AS (
    CASE WHEN total_sent > 0
    THEN ROUND(total_cost / total_sent, 4)
    ELSE 0 END
  ) STORED,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_analytics_date_channel_event_provider
    UNIQUE (date, channel, event, provider),
  CONSTRAINT chk_na_counters CHECK (
    total_sent >= 0 AND delivered >= 0 AND failed >= 0
  )
);

CREATE TRIGGER trg_notification_analytics_updated_at
  BEFORE UPDATE ON notification_analytics
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 15: broadcast_campaigns
-- Purpose: Marketing and system-wide broadcast campaigns.
-- ============================================================

CREATE TABLE IF NOT EXISTS broadcast_campaigns (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,
  description         TEXT,
  slug                TEXT        NOT NULL UNIQUE,
  type                TEXT        NOT NULL DEFAULT 'marketing', -- marketing | system | digest
  channel             notification_channel NOT NULL,
  template_id         UUID        NOT NULL REFERENCES notification_templates(id) ON DELETE RESTRICT,
  status              campaign_status NOT NULL DEFAULT 'draft',
  -- Audience targeting
  audience_type       TEXT        NOT NULL DEFAULT 'all',  -- all | segment | list | manual
  audience_filter     JSONB       NOT NULL DEFAULT '{}',   -- filter criteria for segment
  estimated_reach     INTEGER     NOT NULL DEFAULT 0,
  actual_reach        INTEGER     NOT NULL DEFAULT 0,
  -- Schedule
  scheduled_for       TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  -- Performance
  total_sent          INTEGER     NOT NULL DEFAULT 0,
  total_delivered     INTEGER     NOT NULL DEFAULT 0,
  total_opened        INTEGER     NOT NULL DEFAULT 0,
  total_clicked       INTEGER     NOT NULL DEFAULT 0,
  total_failed        INTEGER     NOT NULL DEFAULT 0,
  total_cost          NUMERIC(12,4) NOT NULL DEFAULT 0,
  -- Metadata
  tags                TEXT[]      NOT NULL DEFAULT '{}',
  is_ab_test          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by          UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by          UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_bc_name   CHECK (char_length(name) BETWEEN 2 AND 255),
  CONSTRAINT chk_bc_reach  CHECK (actual_reach >= 0),
  CONSTRAINT chk_bc_audience CHECK (
    audience_type IN ('all','segment','list','manual')
  )
);

CREATE TRIGGER trg_broadcast_campaigns_updated_at
  BEFORE UPDATE ON broadcast_campaigns
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 16: broadcast_recipients
-- Purpose: Per-user delivery tracking for each campaign.
-- ============================================================

CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID        NOT NULL REFERENCES broadcast_campaigns(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_id     UUID        REFERENCES notifications(id) ON DELETE SET NULL,
  channel             notification_channel NOT NULL,
  status              delivery_status NOT NULL DEFAULT 'pending',
  recipient_address   TEXT,                               -- masked phone/email
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  clicked_at          TIMESTAMPTZ,
  unsubscribed_at     TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  failure_reason      TEXT,
  provider_message_id TEXT,
  cost                NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_br_campaign_user_channel UNIQUE (campaign_id, user_id, channel)
);

CREATE TRIGGER trg_broadcast_recipients_updated_at
  BEFORE UPDATE ON broadcast_recipients
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 17: notification_template_audit
-- Purpose: Immutable audit trail for template changes.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_template_audit (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID        NOT NULL,                   -- no FK — keep history after delete
  action          TEXT        NOT NULL,                   -- INSERT | UPDATE | DELETE
  changed_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  old_data        JSONB,
  new_data        JSONB,
  changed_fields  TEXT[],                                 -- which columns changed
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECTION 18: INDEXES
-- ============================================================

-- notification_templates
CREATE INDEX IF NOT EXISTS idx_nt_channel_event_lang    ON notification_templates (channel, event, language);
CREATE INDEX IF NOT EXISTS idx_nt_status                ON notification_templates (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_nt_slug                  ON notification_templates (slug);
CREATE INDEX IF NOT EXISTS idx_nt_event                 ON notification_templates (event);

-- notification_variables
CREATE INDEX IF NOT EXISTS idx_nv_category              ON notification_variables (category);
CREATE INDEX IF NOT EXISTS idx_nv_key                   ON notification_variables (key);

-- notification_logs (on parent table — Postgres propagates to partitions)
CREATE INDEX IF NOT EXISTS idx_nl_user_created          ON notification_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nl_notification_id       ON notification_logs (notification_id);
CREATE INDEX IF NOT EXISTS idx_nl_event_channel         ON notification_logs (event, channel);
CREATE INDEX IF NOT EXISTS idx_nl_status                ON notification_logs (status);
CREATE INDEX IF NOT EXISTS idx_nl_provider              ON notification_logs (provider) WHERE provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nl_created_at            ON notification_logs (created_at DESC);

-- notification_queue
CREATE INDEX IF NOT EXISTS idx_nq_notification_id       ON notification_queue (notification_id);
CREATE INDEX IF NOT EXISTS idx_nq_status_scheduled      ON notification_queue (status, scheduled_for) WHERE status IN ('pending','scheduled');
CREATE INDEX IF NOT EXISTS idx_nq_channel_priority      ON notification_queue (channel, priority, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_nq_worker                ON notification_queue (worker_id) WHERE worker_id IS NOT NULL;

-- email_queue
CREATE INDEX IF NOT EXISTS idx_eq_notification_id       ON email_queue (notification_id);
CREATE INDEX IF NOT EXISTS idx_eq_status_scheduled      ON email_queue (status, scheduled_for) WHERE status IN ('pending','scheduled');
CREATE INDEX IF NOT EXISTS idx_eq_to_email              ON email_queue (to_email);
CREATE INDEX IF NOT EXISTS idx_eq_priority              ON email_queue (priority, scheduled_for);

-- sms_queue
CREATE INDEX IF NOT EXISTS idx_sq_notification_id       ON sms_queue (notification_id);
CREATE INDEX IF NOT EXISTS idx_sq_status_scheduled      ON sms_queue (status, scheduled_for) WHERE status IN ('pending','scheduled');
CREATE INDEX IF NOT EXISTS idx_sq_to_phone              ON sms_queue (to_phone);

-- whatsapp_queue
CREATE INDEX IF NOT EXISTS idx_wq_notification_id       ON whatsapp_queue (notification_id);
CREATE INDEX IF NOT EXISTS idx_wq_status_scheduled      ON whatsapp_queue (status, scheduled_for) WHERE status IN ('pending','scheduled');
CREATE INDEX IF NOT EXISTS idx_wq_to_phone              ON whatsapp_queue (to_phone);

-- failed_notifications
CREATE INDEX IF NOT EXISTS idx_fn_notification_id       ON failed_notifications (notification_id);
CREATE INDEX IF NOT EXISTS idx_fn_user_id               ON failed_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_fn_event_channel         ON failed_notifications (event, channel);
CREATE INDEX IF NOT EXISTS idx_fn_unresolved            ON failed_notifications (is_resolved, created_at DESC) WHERE is_resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_fn_escalated             ON failed_notifications (escalated) WHERE escalated = TRUE;

-- retry_queue
CREATE INDEX IF NOT EXISTS idx_rq_failed_id             ON retry_queue (failed_id);
CREATE INDEX IF NOT EXISTS idx_rq_scheduled_status      ON retry_queue (scheduled_for, status) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_rq_notification_id       ON retry_queue (notification_id);

-- delivery_reports
CREATE INDEX IF NOT EXISTS idx_dr_user_id               ON delivery_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_dr_event                 ON delivery_reports (event);
CREATE INDEX IF NOT EXISTS idx_dr_overall_status        ON delivery_reports (overall_status);
CREATE INDEX IF NOT EXISTS idx_dr_created_at            ON delivery_reports (created_at DESC);

-- notification_analytics
CREATE INDEX IF NOT EXISTS idx_na_date                  ON notification_analytics (date DESC);
CREATE INDEX IF NOT EXISTS idx_na_channel_date          ON notification_analytics (channel, date DESC);
CREATE INDEX IF NOT EXISTS idx_na_provider_date         ON notification_analytics (provider, date DESC);

-- broadcast_campaigns
CREATE INDEX IF NOT EXISTS idx_bc_status                ON broadcast_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_bc_channel               ON broadcast_campaigns (channel);
CREATE INDEX IF NOT EXISTS idx_bc_scheduled             ON broadcast_campaigns (scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_bc_slug                  ON broadcast_campaigns (slug);

-- broadcast_recipients
CREATE INDEX IF NOT EXISTS idx_brec_campaign_id         ON broadcast_recipients (campaign_id);
CREATE INDEX IF NOT EXISTS idx_brec_user_id             ON broadcast_recipients (user_id);
CREATE INDEX IF NOT EXISTS idx_brec_status              ON broadcast_recipients (status);
CREATE INDEX IF NOT EXISTS idx_brec_campaign_status     ON broadcast_recipients (campaign_id, status);

-- notification_preferences
CREATE INDEX IF NOT EXISTS idx_np_otp_preference        ON notification_preferences (otp_preference);

-- notification_template_audit
CREATE INDEX IF NOT EXISTS idx_nta_template_id          ON notification_template_audit (template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nta_changed_by           ON notification_template_audit (changed_by);

-- ============================================================
-- SECTION 19: TRIGGERS
-- ============================================================

-- ---- A. Auto-move to failed_notifications on log insert ----

CREATE OR REPLACE FUNCTION fn_auto_move_to_failed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- When a log entry is inserted with a terminal failure status
  -- and the notification has exhausted all retries, dead-letter it.
  IF NEW.status IN ('failed', 'bounced', 'rejected') AND NEW.retry_count >= 2 THEN
    INSERT INTO failed_notifications (
      notification_id, log_id, user_id, event, channel,
      provider, failure_reason, provider_error_code,
      provider_error_msg, request_payload, retry_count
    ) VALUES (
      NEW.notification_id, NEW.id, NEW.user_id, NEW.event, NEW.channel,
      NEW.provider, COALESCE(NEW.error_message, 'Delivery failed'),
      NEW.error_code, NEW.error_message, NEW.request_payload, NEW.retry_count
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_move_failed ON notification_logs;
CREATE TRIGGER trg_auto_move_failed
  AFTER INSERT ON notification_logs
  FOR EACH ROW EXECUTE FUNCTION fn_auto_move_to_failed();

-- ---- B. Audit trigger for notification_templates ----

CREATE OR REPLACE FUNCTION fn_audit_template_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  changed_cols TEXT[] := '{}';
  col TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Detect which columns changed
    IF OLD.name        IS DISTINCT FROM NEW.name        THEN changed_cols := changed_cols || 'name'; END IF;
    IF OLD.body        IS DISTINCT FROM NEW.body        THEN changed_cols := changed_cols || 'body'; END IF;
    IF OLD.status      IS DISTINCT FROM NEW.status      THEN changed_cols := changed_cols || 'status'; END IF;
    IF OLD.dlt_template_id IS DISTINCT FROM NEW.dlt_template_id THEN changed_cols := changed_cols || 'dlt_template_id'; END IF;

    INSERT INTO notification_template_audit (
      template_id, action, changed_by, old_data, new_data, changed_fields
    ) VALUES (
      NEW.id, 'UPDATE', NEW.updated_by,
      row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB,
      changed_cols
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO notification_template_audit (
      template_id, action, changed_by, new_data
    ) VALUES (
      NEW.id, 'INSERT', NEW.created_by, row_to_json(NEW)::JSONB
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO notification_template_audit (
      template_id, action, old_data
    ) VALUES (
      OLD.id, 'DELETE', row_to_json(OLD)::JSONB
    );
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_template_audit ON notification_templates;
CREATE TRIGGER trg_template_audit
  AFTER INSERT OR UPDATE OR DELETE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION fn_audit_template_change();

-- ---- C. Auto-archive completed queue items ----

CREATE OR REPLACE FUNCTION fn_archive_completed_queue()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- When a queue item transitions to completed, stamp the notification
  -- as dispatched so it's reflected in the UI.
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE notifications
    SET status = 'dispatched', updated_at = NOW()
    WHERE id = NEW.notification_id
    AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_archive_completed_notification_queue ON notification_queue;
CREATE TRIGGER trg_archive_completed_notification_queue
  AFTER UPDATE ON notification_queue
  FOR EACH ROW EXECUTE FUNCTION fn_archive_completed_queue();

-- ---- D. Auto-create delivery_reports row on notification INSERT ----

CREATE OR REPLACE FUNCTION fn_create_delivery_report()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO delivery_reports (notification_id, user_id, event)
  VALUES (
    NEW.id,
    NEW.user_id,
    NEW.type::notification_event
  )
  ON CONFLICT (notification_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_delivery_report ON notifications;
CREATE TRIGGER trg_create_delivery_report
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION fn_create_delivery_report();

-- ---- E. Auto-upsert notification_preferences on profile creation ----

CREATE OR REPLACE FUNCTION fn_init_notification_preferences()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_init_notification_preferences ON profiles;
CREATE TRIGGER trg_init_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'user')
  EXECUTE FUNCTION fn_init_notification_preferences();

-- ============================================================
-- SECTION 20: FUNCTIONS
-- ============================================================

-- ---- fn_create_notification ----
-- High-level entry point: creates a notification record and
-- fans it out to the appropriate channel queues.

CREATE OR REPLACE FUNCTION fn_create_notification(
  p_user_id         UUID,
  p_event           notification_event,
  p_channels        notification_channel[],
  p_template_id     UUID,
  p_title           TEXT,
  p_body            TEXT,
  p_action_url      TEXT DEFAULT NULL,
  p_image_url       TEXT DEFAULT NULL,
  p_priority        notification_priority DEFAULT 'normal',
  p_metadata        JSONB DEFAULT '{}',
  p_scheduled_for   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_notification_id UUID;
  v_channel         notification_channel;
BEGIN
  -- 1. Insert the base notification record
  INSERT INTO notifications (
    user_id, type, title, body, action_url, image_url,
    metadata, priority, channels, status
  ) VALUES (
    p_user_id, p_event::TEXT, p_title, p_body, p_action_url, p_image_url,
    p_metadata, p_priority, p_channels, 'pending'
  )
  RETURNING id INTO v_notification_id;

  -- 2. Fan out to channel queues
  FOREACH v_channel IN ARRAY p_channels LOOP
    PERFORM fn_queue_notification(
      v_notification_id, v_channel, p_priority, p_scheduled_for
    );
  END LOOP;

  RETURN v_notification_id;
END;
$$;

-- ---- fn_queue_notification ----
-- Routes a notification to the correct channel-specific queue.

CREATE OR REPLACE FUNCTION fn_queue_notification(
  p_notification_id   UUID,
  p_channel           notification_channel,
  p_priority          notification_priority DEFAULT 'normal',
  p_scheduled_for     TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  -- Insert into master queue
  INSERT INTO notification_queue (
    notification_id, channel, priority, status, scheduled_for
  ) VALUES (
    p_notification_id, p_channel, p_priority, 'pending', p_scheduled_for
  )
  RETURNING id INTO v_queue_id;

  -- Update notification status from pending → queued
  UPDATE notifications
  SET status = 'pending', updated_at = NOW()
  WHERE id = p_notification_id;

  RETURN v_queue_id;
END;
$$;

-- ---- fn_mark_delivered ----
-- Marks a notification_logs entry as delivered and
-- updates the delivery_reports aggregation row.

CREATE OR REPLACE FUNCTION fn_mark_delivered(
  p_log_id              UUID,
  p_notification_id     UUID,
  p_channel             notification_channel,
  p_provider_message_id TEXT DEFAULT NULL,
  p_response_payload    JSONB DEFAULT '{}'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update log entry (search by id in current month partition)
  UPDATE notification_logs
  SET
    status = 'delivered',
    delivered_at = NOW(),
    provider_message_id = COALESCE(p_provider_message_id, provider_message_id),
    response_payload = COALESCE(p_response_payload, response_payload)
  WHERE id = p_log_id;

  -- Update delivery report
  UPDATE delivery_reports
  SET
    channels_delivered = channels_delivered + 1,
    overall_status = CASE
      WHEN channels_delivered + 1 >= channels_attempted THEN 'delivered'
      ELSE overall_status
    END,
    first_delivered_at = COALESCE(first_delivered_at, NOW()),
    email_delivered   = CASE WHEN p_channel = 'email'     THEN TRUE ELSE email_delivered END,
    sms_delivered     = CASE WHEN p_channel = 'sms'       THEN TRUE ELSE sms_delivered END,
    whatsapp_delivered= CASE WHEN p_channel = 'whatsapp'  THEN TRUE ELSE whatsapp_delivered END,
    in_app_delivered  = CASE WHEN p_channel = 'in_app'    THEN TRUE ELSE in_app_delivered END,
    updated_at = NOW()
  WHERE notification_id = p_notification_id;

  -- Update parent notification status
  UPDATE notifications
  SET status = 'delivered', updated_at = NOW()
  WHERE id = p_notification_id;
END;
$$;

-- ---- fn_mark_failed ----
-- Records a delivery failure, updates stats, triggers dead-letter logic.

CREATE OR REPLACE FUNCTION fn_mark_failed(
  p_log_id            UUID,
  p_notification_id   UUID,
  p_channel           notification_channel,
  p_error_message     TEXT,
  p_error_code        TEXT DEFAULT NULL,
  p_provider          TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update log entry
  UPDATE notification_logs
  SET
    status = 'failed',
    failed_at = NOW(),
    error_message = p_error_message,
    error_code = p_error_code
  WHERE id = p_log_id;

  -- Update delivery report
  UPDATE delivery_reports
  SET
    channels_failed = channels_failed + 1,
    overall_status = CASE
      WHEN channels_failed + 1 >= channels_attempted THEN 'failed'
      ELSE overall_status
    END,
    updated_at = NOW()
  WHERE notification_id = p_notification_id;
END;
$$;

-- ---- fn_retry_notification ----
-- Schedules a retry attempt with exponential backoff.

CREATE OR REPLACE FUNCTION fn_retry_notification(
  p_failed_id         UUID,
  p_reason            TEXT DEFAULT 'Manual retry triggered'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_failed            RECORD;
  v_attempt_number    SMALLINT;
  v_scheduled_for     TIMESTAMPTZ;
  v_retry_id          UUID;
  v_backoff_seconds   INTEGER;
BEGIN
  SELECT * INTO v_failed FROM failed_notifications WHERE id = p_failed_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed notification % not found', p_failed_id;
  END IF;

  IF v_failed.retry_count >= v_failed.max_retries THEN
    RAISE EXCEPTION 'Max retries (%) exhausted for notification %',
      v_failed.max_retries, v_failed.notification_id;
  END IF;

  v_attempt_number := v_failed.retry_count + 1;

  -- Exponential backoff: 30s, 2m, 8m, 32m, 128m
  v_backoff_seconds := 30 * POWER(4, v_attempt_number - 1)::INTEGER;
  v_scheduled_for   := NOW() + (v_backoff_seconds || ' seconds')::INTERVAL;

  INSERT INTO retry_queue (
    failed_id, notification_id, channel,
    attempt_number, scheduled_for, status
  ) VALUES (
    p_failed_id, v_failed.notification_id, v_failed.channel,
    v_attempt_number, v_scheduled_for, 'scheduled'
  )
  RETURNING id INTO v_retry_id;

  -- Increment retry count on failed record
  UPDATE failed_notifications
  SET retry_count = retry_count + 1, updated_at = NOW()
  WHERE id = p_failed_id;

  RETURN v_retry_id;
END;
$$;

-- ---- fn_archive_notification ----
-- Soft-archives a notification and cancels pending queue items.

CREATE OR REPLACE FUNCTION fn_archive_notification(
  p_notification_id   UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Archive the notification
  UPDATE notifications
  SET status = 'archived', is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_notification_id;

  -- Cancel any pending queue items
  UPDATE notification_queue
  SET status = 'cancelled', updated_at = NOW()
  WHERE notification_id = p_notification_id
  AND status IN ('pending', 'scheduled');

  UPDATE email_queue
  SET status = 'cancelled', updated_at = NOW()
  WHERE notification_id = p_notification_id
  AND status IN ('pending', 'scheduled');

  UPDATE sms_queue
  SET status = 'cancelled', updated_at = NOW()
  WHERE notification_id = p_notification_id
  AND status IN ('pending', 'scheduled');

  UPDATE whatsapp_queue
  SET status = 'cancelled', updated_at = NOW()
  WHERE notification_id = p_notification_id
  AND status IN ('pending', 'scheduled');
END;
$$;

-- ---- fn_upsert_daily_analytics ----
-- Rolls up notification_logs into notification_analytics.
-- Call this via pg_cron daily at midnight.

CREATE OR REPLACE FUNCTION fn_upsert_daily_analytics(
  p_date DATE DEFAULT CURRENT_DATE - 1
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notification_analytics (
    date, channel, event, provider,
    total_sent, emails_sent, sms_sent, whatsapp_sent, in_app_sent,
    delivered, opened, clicked, failed, bounced, rejected,
    total_cost
  )
  SELECT
    p_date,
    nl.channel,
    nl.event::TEXT,
    nl.provider,
    COUNT(*)                                                        AS total_sent,
    COUNT(*) FILTER (WHERE nl.channel = 'email')                   AS emails_sent,
    COUNT(*) FILTER (WHERE nl.channel = 'sms')                     AS sms_sent,
    COUNT(*) FILTER (WHERE nl.channel = 'whatsapp')                AS whatsapp_sent,
    COUNT(*) FILTER (WHERE nl.channel = 'in_app')                  AS in_app_sent,
    COUNT(*) FILTER (WHERE nl.status = 'delivered')                AS delivered,
    COUNT(*) FILTER (WHERE nl.status = 'opened')                   AS opened,
    COUNT(*) FILTER (WHERE nl.status = 'clicked')                  AS clicked,
    COUNT(*) FILTER (WHERE nl.status = 'failed')                   AS failed,
    COUNT(*) FILTER (WHERE nl.status = 'bounced')                  AS bounced,
    COUNT(*) FILTER (WHERE nl.status = 'rejected')                 AS rejected,
    COALESCE(SUM(nl.cost_units), 0)                                AS total_cost
  FROM notification_logs nl
  WHERE nl.created_at::DATE = p_date
  GROUP BY nl.channel, nl.event, nl.provider
  ON CONFLICT (date, channel, event, provider)
  DO UPDATE SET
    total_sent      = EXCLUDED.total_sent,
    delivered       = EXCLUDED.delivered,
    opened          = EXCLUDED.opened,
    clicked         = EXCLUDED.clicked,
    failed          = EXCLUDED.failed,
    bounced         = EXCLUDED.bounced,
    rejected        = EXCLUDED.rejected,
    total_cost      = EXCLUDED.total_cost,
    updated_at      = NOW();
END;
$$;

-- ============================================================
-- SECTION 21: VIEWS
-- ============================================================

-- ---- notification_dashboard_view ----
-- Per-user notification summary for the bell icon and dashboard.

CREATE OR REPLACE VIEW notification_dashboard_view AS
SELECT
  n.user_id,
  COUNT(*)                                        AS total_count,
  COUNT(*) FILTER (WHERE NOT n.is_read)           AS unread_count,
  COUNT(*) FILTER (WHERE n.priority = 'urgent')   AS urgent_unread,
  COUNT(*) FILTER (WHERE n.priority = 'high' AND NOT n.is_read) AS high_unread,
  MAX(n.created_at)                               AS last_notification_at,
  jsonb_agg(
    jsonb_build_object(
      'id',         n.id,
      'type',       n.type,
      'title',      n.title,
      'body',       n.body,
      'priority',   n.priority,
      'is_read',    n.is_read,
      'action_url', n.action_url,
      'created_at', n.created_at
    )
    ORDER BY n.created_at DESC
  ) FILTER (WHERE rn.rn <= 10)                    AS recent_notifications
FROM (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM notifications
  WHERE is_deleted = FALSE
) n
JOIN (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM notifications
  WHERE is_deleted = FALSE
) rn ON n.id = rn.id
GROUP BY n.user_id;

-- ---- delivery_summary_view ----
-- Channel-level delivery success rates across all time.

CREATE OR REPLACE VIEW delivery_summary_view AS
SELECT
  nl.channel,
  nl.provider,
  COUNT(*)                                              AS total_sent,
  COUNT(*) FILTER (WHERE nl.status = 'delivered')      AS total_delivered,
  COUNT(*) FILTER (WHERE nl.status = 'opened')         AS total_opened,
  COUNT(*) FILTER (WHERE nl.status = 'clicked')        AS total_clicked,
  COUNT(*) FILTER (WHERE nl.status = 'failed')         AS total_failed,
  COUNT(*) FILTER (WHERE nl.status = 'bounced')        AS total_bounced,
  ROUND(
    COUNT(*) FILTER (WHERE nl.status = 'delivered')::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 2
  )                                                     AS delivery_rate_pct,
  ROUND(
    COUNT(*) FILTER (WHERE nl.status = 'opened')::NUMERIC
    / NULLIF(COUNT(*) FILTER (WHERE nl.channel = 'email'), 0) * 100, 2
  )                                                     AS email_open_rate_pct,
  ROUND(
    COUNT(*) FILTER (WHERE nl.status = 'clicked')::NUMERIC
    / NULLIF(COUNT(*) FILTER (WHERE nl.status = 'delivered'), 0) * 100, 2
  )                                                     AS click_through_rate_pct,
  COALESCE(SUM(nl.cost_units), 0)                       AS total_cost_units,
  MIN(nl.created_at)                                    AS first_sent_at,
  MAX(nl.created_at)                                    AS last_sent_at
FROM notification_logs nl
GROUP BY nl.channel, nl.provider;

-- ---- daily_analytics_view ----
-- Rolling 30-day analytics dashboard.

CREATE OR REPLACE VIEW daily_analytics_view AS
SELECT
  na.date,
  na.channel,
  na.provider,
  na.total_sent,
  na.delivered,
  na.opened,
  na.clicked,
  na.failed,
  na.bounced,
  na.delivery_rate,
  na.open_rate,
  na.success_rate,
  na.total_cost,
  na.avg_cost_per_msg,
  -- 7-day rolling averages
  ROUND(AVG(na.total_sent)    OVER w7, 0)     AS rolling_7d_avg_sent,
  ROUND(AVG(na.delivery_rate) OVER w7, 2)     AS rolling_7d_delivery_rate,
  ROUND(AVG(na.success_rate)  OVER w7, 2)     AS rolling_7d_success_rate,
  -- WoW change
  na.total_sent - LAG(na.total_sent, 7) OVER (PARTITION BY na.channel, na.provider ORDER BY na.date) AS wow_sent_delta
FROM notification_analytics na
WHERE na.date >= CURRENT_DATE - INTERVAL '30 days'
WINDOW w7 AS (
  PARTITION BY na.channel, na.provider
  ORDER BY na.date
  ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
);

-- ---- provider_performance_view ----
-- Per-provider reliability and latency metrics.

CREATE OR REPLACE VIEW provider_performance_view AS
SELECT
  nl.provider,
  nl.channel,
  COUNT(*)                                                      AS total_attempts,
  COUNT(*) FILTER (WHERE nl.status = 'delivered')              AS successful,
  COUNT(*) FILTER (WHERE nl.status IN ('failed','bounced','rejected')) AS failed,
  ROUND(
    COUNT(*) FILTER (WHERE nl.status = 'delivered')::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 2
  )                                                             AS success_rate_pct,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (nl.delivered_at - nl.created_at))
    ) FILTER (WHERE nl.delivered_at IS NOT NULL), 2
  )                                                             AS avg_delivery_latency_secs,
  MIN(nl.created_at)                                           AS first_used_at,
  MAX(nl.created_at)                                           AS last_used_at,
  DATE_TRUNC('day', MAX(nl.created_at))::DATE                  AS last_active_date
FROM notification_logs nl
WHERE nl.provider IS NOT NULL
GROUP BY nl.provider, nl.channel
ORDER BY success_rate_pct DESC;

-- ============================================================
-- SECTION 22: ROW LEVEL SECURITY
-- ============================================================

-- notification_templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates: admins can manage"
  ON notification_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Templates: authenticated users can read active"
  ON notification_templates FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'active');

-- notification_variables
ALTER TABLE notification_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variables: admins can manage"
  ON notification_variables FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Variables: authenticated users can read"
  ON notification_variables FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- notification_logs (partitioned — apply to parent)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs: users can view own logs"
  ON notification_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Logs: admins can view all"
  ON notification_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Logs: service role can insert"
  ON notification_logs FOR INSERT
  WITH CHECK (true);

-- notification_queue
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Queue: admins can manage"
  ON notification_queue FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Queue: service role can insert and update"
  ON notification_queue FOR INSERT WITH CHECK (true);

-- email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email queue: admins can manage"
  ON email_queue FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Email queue: service role can insert"
  ON email_queue FOR INSERT WITH CHECK (true);

-- sms_queue
ALTER TABLE sms_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SMS queue: admins can manage"
  ON sms_queue FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "SMS queue: service role can insert"
  ON sms_queue FOR INSERT WITH CHECK (true);

-- whatsapp_queue
ALTER TABLE whatsapp_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "WhatsApp queue: admins can manage"
  ON whatsapp_queue FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "WhatsApp queue: service role can insert"
  ON whatsapp_queue FOR INSERT WITH CHECK (true);

-- failed_notifications
ALTER TABLE failed_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Failed: users can view own"
  ON failed_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Failed: admins can manage all"
  ON failed_notifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Failed: service role can insert"
  ON failed_notifications FOR INSERT WITH CHECK (true);

-- retry_queue
ALTER TABLE retry_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retry: admins can manage"
  ON retry_queue FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Retry: service role can manage"
  ON retry_queue FOR INSERT WITH CHECK (true);

-- delivery_reports
ALTER TABLE delivery_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delivery reports: users can view own"
  ON delivery_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Delivery reports: admins can manage all"
  ON delivery_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Delivery reports: service role can insert/update"
  ON delivery_reports FOR INSERT WITH CHECK (true);

-- notification_analytics
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics: only admins can access"
  ON notification_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- broadcast_campaigns
ALTER TABLE broadcast_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns: only admins can manage"
  ON broadcast_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- broadcast_recipients
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients: users can view own"
  ON broadcast_recipients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Recipients: admins can manage all"
  ON broadcast_recipients FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- notification_template_audit
ALTER TABLE notification_template_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Template audit: only admins"
  ON notification_template_audit FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- ============================================================
-- SECTION 23: SUPABASE REALTIME
-- ============================================================

-- Enable realtime on key tables for live dashboard updates
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notification_queue;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE failed_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notification_analytics;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- SECTION 24: TABLE & COLUMN COMMENTS
-- ============================================================

COMMENT ON TABLE notification_templates          IS 'CMS-backed message templates per channel, event, and language. One row per (channel, event, language) combination.';
COMMENT ON TABLE notification_variables          IS 'Registry of reusable {{variable}} definitions used across notification templates.';
COMMENT ON TABLE notification_logs               IS 'Immutable master delivery audit log. Partitioned by month on created_at. One row per send attempt per channel.';
COMMENT ON TABLE notification_queue              IS 'Master notification routing queue. Fan-out source for channel-specific queues.';
COMMENT ON TABLE email_queue                     IS 'Dedicated email delivery queue. Populated by fn_queue_notification for email channel.';
COMMENT ON TABLE sms_queue                       IS 'Dedicated SMS delivery queue for MSG91/Twilio. DLT template ID mandatory for Indian numbers.';
COMMENT ON TABLE whatsapp_queue                  IS 'WhatsApp Business API delivery queue. Uses WhatsApp-approved template names.';
COMMENT ON TABLE failed_notifications            IS 'Dead-letter store for notifications that exhausted all retry attempts.';
COMMENT ON TABLE retry_queue                     IS 'Scheduled retry attempts with exponential backoff (30s, 2m, 8m, 32m, 128m).';
COMMENT ON TABLE delivery_reports                IS 'Per-notification delivery analytics. One row per notification aggregating all channel results.';
COMMENT ON TABLE notification_analytics          IS 'Daily aggregated delivery analytics. Populated by fn_upsert_daily_analytics() via pg_cron.';
COMMENT ON TABLE broadcast_campaigns             IS 'Marketing and system broadcast campaigns with audience targeting and A/B test support.';
COMMENT ON TABLE broadcast_recipients            IS 'Per-user delivery tracking for each broadcast campaign.';
COMMENT ON TABLE notification_template_audit     IS 'Immutable audit trail for all notification template changes (INSERT, UPDATE, DELETE).';

COMMENT ON FUNCTION fn_create_notification       IS 'High-level entry point: creates a notification and fans out to channel queues.';
COMMENT ON FUNCTION fn_queue_notification        IS 'Routes a notification to the appropriate channel-specific queue table.';
COMMENT ON FUNCTION fn_mark_delivered            IS 'Records successful delivery, updates delivery_reports and parent notification status.';
COMMENT ON FUNCTION fn_mark_failed               IS 'Records a delivery failure, updates stats.';
COMMENT ON FUNCTION fn_retry_notification        IS 'Schedules a retry in retry_queue with exponential backoff.';
COMMENT ON FUNCTION fn_archive_notification      IS 'Soft-archives a notification and cancels all pending queue entries.';
COMMENT ON FUNCTION fn_upsert_daily_analytics    IS 'Rolls up notification_logs into notification_analytics for a given date. Run via pg_cron.';

-- ============================================================
-- SECTION 25: pg_cron SCHEDULE TEMPLATES
-- Uncomment after enabling pg_cron in Supabase dashboard:
-- Dashboard → Database → Extensions → Enable pg_cron
-- ============================================================

-- Daily analytics rollup at 00:05 UTC
-- SELECT cron.schedule('daily-notification-analytics', '5 0 * * *',
--   $$ SELECT fn_upsert_daily_analytics(CURRENT_DATE - 1) $$
-- );

-- Partition maintenance: create next month's partition on 25th of each month
-- SELECT cron.schedule('create-notification-log-partition', '0 1 25 * *', $$
--   DO $$
--   DECLARE
--     next_month DATE := DATE_TRUNC('month', NOW()) + '2 months'::INTERVAL;
--     end_month  DATE := next_month + '1 month'::INTERVAL;
--     pname TEXT := 'notification_logs_' || TO_CHAR(next_month, 'YYYY_MM');
--   BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = pname) THEN
--       EXECUTE format('CREATE TABLE %I PARTITION OF notification_logs FOR VALUES FROM (%L) TO (%L)',
--         pname, next_month, end_month);
--     END IF;
--   END $$
-- $$);

-- Clean up dead retry_queue entries older than 30 days
-- SELECT cron.schedule('cleanup-retry-queue', '0 2 * * *', $$
--   DELETE FROM retry_queue WHERE status IN ('completed','failed') AND created_at < NOW() - INTERVAL '30 days'
-- $$);

-- ============================================================
-- END OF MIGRATION: 0012_notification_system.sql
-- ============================================================
