-- ============================================================
-- MIGRATION: 0013_observability.sql
-- RishtaJodo Matrimony — Enterprise Notification Observability
-- Phase 10: Analytics, Monitoring, Alerts, Health & Forecasting
--
-- Tables:
--   1. notification_alerts          (alert rules + triggered state)
--   2. notification_health_checks   (provider + system health history)
--   3. notification_performance_snapshots (P95/P99/throughput)
--   4. notification_forecast_data   (computed growth/cost projections)
-- ============================================================

-- ============================================================
-- TABLE 1: notification_alerts
-- Configurable alert rules with triggered state.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_alerts (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT         NOT NULL,
  description      TEXT,
  -- Alert rule definition
  metric           TEXT         NOT NULL, -- 'failure_rate'|'queue_size'|'dlq_size'|'provider_down'|'high_cost'|'slow_delivery'|'spam_detection'|'retry_explosion'|'dlq_growth'
  threshold        NUMERIC      NOT NULL,
  comparison       TEXT         NOT NULL, -- 'gt'|'lt'|'gte'|'lte'
  window_minutes   INTEGER      NOT NULL DEFAULT 15,
  channel_filter   TEXT,                  -- NULL = all channels
  provider_filter  TEXT,                  -- NULL = all providers
  severity         TEXT         NOT NULL DEFAULT 'warning', -- 'info'|'warning'|'critical'
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  -- Triggered state
  is_triggered     BOOLEAN      NOT NULL DEFAULT FALSE,
  triggered_at     TIMESTAMPTZ,
  triggered_value  NUMERIC,
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  -- Notification targets
  notify_email     TEXT[]       NOT NULL DEFAULT '{}',
  notify_slack     TEXT,
  -- Metadata
  created_by       UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_na_metric     CHECK (metric IN ('failure_rate','queue_size','dlq_size','provider_down','high_cost','slow_delivery','spam_detection','retry_explosion','dlq_growth')),
  CONSTRAINT chk_na_comparison CHECK (comparison IN ('gt','lt','gte','lte')),
  CONSTRAINT chk_na_severity   CHECK (severity IN ('info','warning','critical')),
  CONSTRAINT chk_na_window     CHECK (window_minutes BETWEEN 1 AND 1440)
);

CREATE TRIGGER trg_notification_alerts_updated_at
  BEFORE UPDATE ON notification_alerts
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_notification_alerts_active
  ON notification_alerts (is_active, is_triggered);

CREATE INDEX IF NOT EXISTS idx_notification_alerts_metric
  ON notification_alerts (metric);

-- ============================================================
-- TABLE 2: notification_health_checks
-- Point-in-time health snapshots for each provider/component.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_health_checks (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  component        TEXT         NOT NULL, -- 'msg91_sms'|'msg91_email'|'msg91_whatsapp'|'database'|'queue'|'engine'
  is_healthy       BOOLEAN      NOT NULL,
  response_time_ms INTEGER,
  http_status      INTEGER,
  error_message    TEXT,
  details          JSONB        NOT NULL DEFAULT '{}',

  CONSTRAINT chk_nhc_response_time CHECK (response_time_ms IS NULL OR response_time_ms >= 0)
);

CREATE INDEX IF NOT EXISTS idx_notification_health_checks_component
  ON notification_health_checks (component, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_health_checks_at
  ON notification_health_checks (checked_at DESC);

-- ============================================================
-- TABLE 3: notification_performance_snapshots
-- Rolling performance windows: P50/P95/P99 latency, throughput.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_performance_snapshots (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  window_minutes   INTEGER      NOT NULL DEFAULT 15,
  channel          TEXT,                    -- NULL = all channels aggregated
  total_processed  INTEGER      NOT NULL DEFAULT 0,
  per_second       NUMERIC(10,4) NOT NULL DEFAULT 0,
  p50_ms           NUMERIC(10,2),
  p95_ms           NUMERIC(10,2),
  p99_ms           NUMERIC(10,2),
  avg_ms           NUMERIC(10,2),
  error_rate       NUMERIC(5,2) NOT NULL DEFAULT 0,

  CONSTRAINT chk_nps_window    CHECK (window_minutes BETWEEN 1 AND 1440),
  CONSTRAINT chk_nps_processed CHECK (total_processed >= 0),
  CONSTRAINT chk_nps_error_rate CHECK (error_rate BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_nps_snapshot_at
  ON notification_performance_snapshots (snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_nps_channel
  ON notification_performance_snapshots (channel, snapshot_at DESC);

-- ============================================================
-- TABLE 4: notification_forecast_data
-- Stored forecast projections (volume, cost, queue).
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_forecast_data (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  forecast_date   DATE         NOT NULL,
  metric          TEXT         NOT NULL, -- 'volume'|'cost'|'queue_size'
  channel         TEXT,                  -- NULL = all channels
  forecast_value  NUMERIC(12,4) NOT NULL,
  lower_bound     NUMERIC(12,4),
  upper_bound     NUMERIC(12,4),
  confidence      NUMERIC(4,2),          -- 0–1
  model           TEXT         NOT NULL DEFAULT 'linear_regression',

  CONSTRAINT chk_nfd_metric     CHECK (metric IN ('volume','cost','queue_size')),
  CONSTRAINT chk_nfd_confidence CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  CONSTRAINT uq_nfd_date_metric_channel UNIQUE (forecast_date, metric, channel)
);

CREATE INDEX IF NOT EXISTS idx_nfd_metric_date
  ON notification_forecast_data (metric, forecast_date DESC);

-- ============================================================
-- DEFAULT ALERT RULES
-- Sensible defaults for a production matrimony platform.
-- ============================================================

INSERT INTO notification_alerts (name, description, metric, threshold, comparison, window_minutes, severity)
VALUES
  ('High Failure Rate',      'SMS/Email/WhatsApp failure rate exceeded threshold',  'failure_rate',    20,    'gte', 15,  'critical'),
  ('Queue Backlog Warning',  'Notification queue pending items exceeds limit',      'queue_size',      500,   'gte', 15,  'warning'),
  ('DLQ Size Alert',         'Dead Letter Queue has too many unresolved failures',  'dlq_size',        100,   'gte', 60,  'warning'),
  ('DLQ Growth Alert',       'Dead Letter Queue growing rapidly',                   'dlq_growth',      50,    'gte', 30,  'critical'),
  ('High Cost Alert',        'Notification cost today exceeds budget threshold',    'high_cost',       5000,  'gte', 60,  'warning'),
  ('Retry Explosion',        'Too many retry attempts in short window',             'retry_explosion', 200,   'gte', 15,  'critical'),
  ('Slow Delivery Alert',    'Average delivery time exceeds acceptable threshold',  'slow_delivery',   30000, 'gte', 15,  'warning')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE notification_alerts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_health_checks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_forecast_data        ENABLE ROW LEVEL SECURITY;

-- Admin full access policy
CREATE POLICY "admin_full_access_alerts"
  ON notification_alerts FOR ALL
  USING (
    check_admin_permission('manage_notifications')
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "admin_full_access_health_checks"
  ON notification_health_checks FOR ALL
  USING (
    check_admin_permission('manage_notifications')
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "admin_full_access_performance"
  ON notification_performance_snapshots FOR ALL
  USING (
    check_admin_permission('manage_notifications')
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "admin_full_access_forecast"
  ON notification_forecast_data FOR ALL
  USING (
    check_admin_permission('manage_notifications')
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ============================================================
-- SUPABASE REALTIME
-- Enable for live monitoring updates.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notification_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_health_checks;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE notification_alerts IS 'Configurable alert rules with triggered state for the Notification Observability Platform (Phase 10).';
COMMENT ON TABLE notification_health_checks IS 'Point-in-time health snapshots for each provider and system component.';
COMMENT ON TABLE notification_performance_snapshots IS 'Rolling performance windows capturing P50/P95/P99 latency and throughput metrics.';
COMMENT ON TABLE notification_forecast_data IS 'Stored forecast projections for volume, cost, and queue growth.';
