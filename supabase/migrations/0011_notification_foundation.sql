-- ============================================================
-- MIGRATION: 0011_notification_foundation.sql
-- Notification Module — Phase 1 Schema
-- Creates the `notifications` table, RLS policies, indexes,
-- and enables Realtime for real-time in-app delivery.
-- ============================================================

-- ---- Enums ----

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
    CREATE TYPE notification_status AS ENUM (
      'pending',
      'dispatched',
      'delivered',
      'failed',
      'cancelled'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE notification_channel AS ENUM (
      'in_app',
      'email',
      'sms',
      'push',
      'whatsapp'
    );
  END IF;
END$$;

-- ---- notifications table ----

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,                         -- NotificationEventType string
  title         TEXT NOT NULL CHECK (char_length(title) <= 255),
  body          TEXT NOT NULL CHECK (char_length(body) <= 2000),
  action_url    TEXT,
  image_url     TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  priority      notification_priority NOT NULL DEFAULT 'normal',
  channels      notification_channel[] NOT NULL DEFAULT ARRAY['in_app'::notification_channel],
  status        notification_status NOT NULL DEFAULT 'dispatched',
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- updated_at trigger ----

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_notifications_updated_at();

-- ---- Indexes ----

-- Primary access pattern: user's notification list (most recent first)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC)
  WHERE is_deleted = FALSE;

-- Unread badge count query
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read)
  WHERE is_deleted = FALSE AND is_read = FALSE;

-- Event type filtering (de-duplication queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created
  ON notifications (user_id, type, created_at DESC)
  WHERE is_deleted = FALSE;

-- Status tracking
CREATE INDEX IF NOT EXISTS idx_notifications_status
  ON notifications (status)
  WHERE status IN ('pending', 'failed');

-- ---- Row Level Security ----

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (server actions) can insert notifications for any user
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Service role can manage all notifications (admin operations)
CREATE POLICY "Admins can manage all notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- ---- Enable Supabase Realtime ----
-- This allows the useNotifications hook to receive INSERT/UPDATE events
-- without polling. The client subscribes to postgres_changes on this table.

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ---- notification_preferences table ----
-- Stores per-user channel opt-in preferences.

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id             UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  in_app_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start   TIME,              -- e.g. '22:00'
  quiet_hours_end     TIME,              -- e.g. '08:00'
  event_preferences   JSONB NOT NULL DEFAULT '{}',   -- per-event channel overrides
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- Housekeeping: auto-delete old read notifications ----
-- Optional: a pg_cron job to clean up old notifications.
-- Uncomment when pg_cron extension is enabled in your Supabase project.
--
-- SELECT cron.schedule(
--   'purge-old-notifications',
--   '0 3 * * *',  -- 3 AM UTC daily
--   $$
--     UPDATE notifications
--     SET is_deleted = TRUE, deleted_at = NOW()
--     WHERE is_read = TRUE
--     AND is_deleted = FALSE
--     AND created_at < NOW() - INTERVAL '90 days'
--   $$
-- );

COMMENT ON TABLE notifications IS 'User notification records for the RishtaJodo notification module. Phase 1: in_app channel via Supabase Realtime.';
COMMENT ON TABLE notification_preferences IS 'Per-user channel and event-level notification preferences.';
