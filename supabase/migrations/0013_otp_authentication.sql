-- ============================================================
-- MIGRATION: 0013_otp_authentication.sql
-- RishtaJodo Matrimony — Secure OTP Authentication Layer
-- ============================================================

-- ---- OTP Requests Table ----
CREATE TABLE IF NOT EXISTS otp_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile              TEXT NOT NULL CHECK (mobile ~ '^\+[1-9]\d{7,14}$'),
  user_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hashed_code         TEXT NOT NULL,                       -- SHA-256 hashed OTP
  purpose             TEXT NOT NULL CHECK (purpose IN ('phone_verification', 'login', 'password_reset', 'change_mobile', 'delete_account')),
  channel             notification_channel NOT NULL,
  attempts            INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  ip_address          INET NOT NULL,
  device_fingerprint  TEXT,
  expires_at          TIMESTAMPTZ NOT NULL,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- OTP Blocks Table ----
CREATE TABLE IF NOT EXISTS otp_blocks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target              TEXT NOT NULL,                       -- mobile number, IP address, or device fingerprint
  block_type          TEXT NOT NULL CHECK (block_type IN ('brute_force', 'rapid_requests', 'daily_limit')),
  blocked_until       TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Indexes ----
-- Cooldown and validity lookup
CREATE INDEX IF NOT EXISTS idx_otp_requests_mobile_expires
  ON otp_requests (mobile, expires_at DESC)
  WHERE verified_at IS NULL;

-- IP rate limiting lookup
CREATE INDEX IF NOT EXISTS idx_otp_requests_ip_expires
  ON otp_requests (ip_address, expires_at DESC)
  WHERE verified_at IS NULL;

-- Device rate limiting lookup
CREATE INDEX IF NOT EXISTS idx_otp_requests_device_expires
  ON otp_requests (device_fingerprint, expires_at DESC)
  WHERE verified_at IS NULL AND device_fingerprint IS NOT NULL;

-- Active blocks lookup
CREATE INDEX IF NOT EXISTS idx_otp_blocks_target
  ON otp_blocks (target, blocked_until DESC);

-- ---- Row Level Security ----
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_blocks ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests (by matching auth user_id or matching their verified profiles mobile)
CREATE POLICY "Users can view own otp requests"
  ON otp_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND mobile_number = otp_requests.mobile
    )
  );

-- Admins can view/manage everything
CREATE POLICY "Admins can manage otp requests"
  ON otp_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage otp blocks"
  ON otp_blocks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

-- Service role policies for backend server actions
CREATE POLICY "Service role can insert otp requests"
  ON otp_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update otp requests"
  ON otp_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert otp blocks"
  ON otp_blocks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update otp blocks"
  ON otp_blocks FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Enable Supabase Realtime for failed_notifications/queues/logs but NOT for secure OTP requests
-- (Keep OTP requests table completely excluded from Realtime to prevent client eavesdropping)

-- ---- Table Comments ----
COMMENT ON TABLE otp_requests IS 'Secure, hashed OTP verification requests and brute-force attempt counters.';
COMMENT ON TABLE otp_blocks IS 'Automated rate limit, rapid request, and brute-force blocks for IPs, mobiles, and devices.';
