-- ============================================================
-- MIGRATION: 0015_observability.sql
-- RishtaJodo Matrimony — Enterprise Notification Observability
-- Phase 10: Analytics, Monitoring & Observability Platform
--
-- New Tables:
--   1. notification_alerts                — alert rules + triggered state
--   2. notification_health_checks         — provider health snapshots
--   3. notification_performance_snapshots — P50/P95/P99/throughput data
--   4. notification_forecast_data         — computed volume/cost projections
-- ============================================================

-- ============================================================
-- SECTION 1: notification_alerts
-- Stores alert rule definitions and their current triggered state.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_alerts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  description      TEXT,
  metric           TEXT        NOT NULL
    CHECK (metric IN (
      'failure_rate', 'queue_size', 'dlq_size', 'provider_down',
      'high_cost', 'slow_delivery', 'spam_detection',
      'retry_explosion', 'dlq_growth'
    )),
  threshold        NUMERIC     NOT NULL,
  comparison       TEXT        NOT NULL
    CHECK (comparison IN ('gt', 'lt', 'gte', 'lte')),
  window_minutes   INTEGER     NOT NULL DEFAULT 15,
  channel_filter   TEXT,        -- NULL = all channels
  provider_filter  TEXT,        -- NULL = all providers
  severity         TEXT        NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  -- Triggered state
  is_triggered     BOOLEAN     NOT NULL DEFAULT FALSE,
  triggered_at     TIMESTAMPTZ,
  triggered_value  NUMERIC,
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  -- Notification targets
  notify_email     TEXT[],
  notify_slack     TEXT,
  -- Metadata
  created_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SECTION 2: notification_health_checks
-- Timestamped health snapshots per provider.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_health_checks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider         TEXT        NOT NULL,
  is_healthy       BOOLEAN     NOT NULL,
  response_time_ms INTEGER,
  error_message    TEXT,
  http_status      INTEGER,
  details          JSONB       NOT NULL DEFAULT '{}'
);

-- ============================================================
-- SECTION 3: notification_performance_snapshots
-- Periodic P50/P95/P99 latency and throughput snapshots.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_performance_snapshots (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  window_minutes   INTEGER      NOT NULL DEFAULT 15,
  channel          TEXT,
  total_processed  INTEGER      NOT NULL DEFAULT 0,
  per_second       NUMERIC(10,4) NOT NULL DEFAULT 0,
  p50_ms           NUMERIC(10,2),
  p95_ms           NUMERIC(10,2),
  p99_ms           NUMERIC(10,2),
  avg_ms           NUMERIC(10,2),
  error_rate       NUMERIC(5,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- SECTION 4: notification_forecast_data
-- Persisted forecast data points (volume / cost / queue_size).
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_forecast_data (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  forecast_date   DATE         NOT NULL,
  metric          TEXT         NOT NULL
    CHECK (metric IN ('volume', 'cost', 'queue_size')),
  channel         TEXT,
  forecast_value  NUMERIC(12,4) NOT NULL,
  lower_bound     NUMERIC(12,4),
  upper_bound     NUMERIC(12,4),
  confidence      NUMERIC(4,2),
  model           TEXT         NOT NULL DEFAULT 'linear_regression'
);

-- ============================================================
-- SECTION 5: INDEXES
-- ============================================================

-- notification_alerts
CREATE INDEX IF NOT EXISTS idx_na_is_triggered
  ON notification_alerts (is_triggered)
  WHERE is_triggered = TRUE;

CREATE INDEX IF NOT EXISTS idx_na_metric
  ON notification_alerts (metric);

CREATE INDEX IF NOT EXISTS idx_na_severity
  ON notification_alerts (severity);

CREATE INDEX IF NOT EXISTS idx_na_created_by
  ON notification_alerts (created_by);

CREATE INDEX IF NOT EXISTS idx_na_is_active
  ON notification_alerts (is_active)
  WHERE is_active = TRUE;

-- notification_health_checks
CREATE INDEX IF NOT EXISTS idx_nhc_provider_checked_at
  ON notification_health_checks (provider, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_nhc_is_healthy
  ON notification_health_checks (is_healthy);

CREATE INDEX IF NOT EXISTS idx_nhc_checked_at
  ON notification_health_checks (checked_at DESC);

-- notification_performance_snapshots
CREATE INDEX IF NOT EXISTS idx_nps_snapshot_at
  ON notification_performance_snapshots (snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_nps_channel_snapshot
  ON notification_performance_snapshots (channel, snapshot_at DESC);

-- notification_forecast_data
CREATE INDEX IF NOT EXISTS idx_nfd_metric_date
  ON notification_forecast_data (metric, forecast_date);

CREATE INDEX IF NOT EXISTS idx_nfd_generated_at
  ON notification_forecast_data (generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_nfd_channel
  ON notification_forecast_data (channel, metric);

-- ============================================================
-- SECTION 6: UPDATED_AT TRIGGERS
-- ============================================================

-- notification_alerts — uses the existing fn_set_updated_at() from 0012
CREATE TRIGGER trg_notification_alerts_updated_at
  BEFORE UPDATE ON notification_alerts
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- SECTION 7: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE notification_alerts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_health_checks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_forecast_data       ENABLE ROW LEVEL SECURITY;

-- notification_alerts: admins/super_admins only
CREATE POLICY "notification_alerts_admin_all"
  ON notification_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- notification_health_checks: admins/super_admins only
CREATE POLICY "notification_health_checks_admin_all"
  ON notification_health_checks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- notification_performance_snapshots: admins/super_admins only
CREATE POLICY "notification_performance_snapshots_admin_all"
  ON notification_performance_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- notification_forecast_data: admins/super_admins only
CREATE POLICY "notification_forecast_data_admin_all"
  ON notification_forecast_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- SECTION 8: REALTIME
-- Enable Realtime broadcasts for live dashboard updates.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notification_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_health_checks;

-- ============================================================
-- SECTION 9: TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE notification_alerts
  IS 'Alert rule definitions with triggered state for the observability platform. Supports metric-based threshold alerts with per-channel/provider filtering.';

COMMENT ON TABLE notification_health_checks
  IS 'Timestamped health snapshots for each notification provider. Used to compute availability % and latency history.';

COMMENT ON TABLE notification_performance_snapshots
  IS 'Periodic throughput and latency percentile (P50/P95/P99) snapshots for the notification pipeline.';

COMMENT ON TABLE notification_forecast_data
  IS 'Persisted forecast data points generated by linear regression models for volume, cost, and queue size projections.';

COMMENT ON COLUMN notification_alerts.metric
  IS 'The metric being monitored: failure_rate | queue_size | dlq_size | provider_down | high_cost | slow_delivery | spam_detection | retry_explosion | dlq_growth';

COMMENT ON COLUMN notification_alerts.comparison
  IS 'Comparison operator: gt (>), lt (<), gte (>=), lte (<=)';

COMMENT ON COLUMN notification_alerts.window_minutes
  IS 'Evaluation window in minutes. The metric is computed over the last N minutes.';

COMMENT ON COLUMN notification_health_checks.details
  IS 'Provider-specific health check response payload (e.g., balance, quotas, latency breakdown)';
