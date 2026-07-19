-- ============================================================
-- MIGRATION: 0014_sms_notification_events.sql
-- Adds missing transactional event types to notification_event enum.
-- ============================================================

-- Alter type statements to add new values.
-- Since ALTER TYPE ADD VALUE cannot run inside a transaction block in Postgres,
-- we do not wrap this in BEGIN/COMMIT when executing.

ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'profile.kyc_rejected';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'associate.assigned';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'associate.plan_activated';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'associate.meeting_reminder';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'associate.case_closed';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'associate.commission_credited';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'payment.payment_success';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'payment.membership_activated';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'payment.refund_success';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'system.new_device_login';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'system.email_changed';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'system.mobile_changed';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'system.security_alert';
