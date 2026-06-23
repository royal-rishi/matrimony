-- ============================================================
-- MIGRATION 0005: Associate Network Platform
-- Extends existing associate schema with enterprise CRM,
-- commission ledger, withdrawal system, and case management.
-- ============================================================

-- ============================================================
-- STEP 1: EXTEND ENUMS
-- ============================================================

-- Add missing case stages (PostgreSQL requires ADD VALUE only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'requirement_collection'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'case_status')
  ) THEN
    ALTER TYPE case_status ADD VALUE 'requirement_collection' AFTER 'new';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'meeting_completed'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'case_status')
  ) THEN
    ALTER TYPE case_status ADD VALUE 'meeting_completed' AFTER 'meeting_scheduled';
  END IF;
END$$;

-- Commission event types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_event_type') THEN
    CREATE TYPE commission_event_type AS ENUM (
      'registration',
      'premium_subscription',
      'personal_matchmaking',
      'marriage_success',
      'adjustment',
      'refund'
    );
  END IF;
END$$;

-- Withdrawal status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_status') THEN
    CREATE TYPE withdrawal_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'processed',
      'cancelled'
    );
  END IF;
END$$;

-- Dispute type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_type') THEN
    CREATE TYPE dispute_type AS ENUM (
      'poor_service',
      'no_response',
      'wrong_suggestions',
      'abusive_behaviour',
      'commission_fraud'
    );
  END IF;
END$$;

-- ============================================================
-- STEP 2: ALTER EXISTING TABLES
-- ============================================================

-- 2a. Extend associate_cases
ALTER TABLE associate_cases
  ADD COLUMN IF NOT EXISTS requirement_notes TEXT,
  ADD COLUMN IF NOT EXISTS closed_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS target_match_by DATE,
  ADD COLUMN IF NOT EXISTS case_priority TEXT DEFAULT 'normal'
    CHECK (case_priority IN ('low', 'normal', 'high', 'urgent'));

-- 2b. Extend marriage_successes
ALTER TABLE marriage_successes
  ADD COLUMN IF NOT EXISTS engagement_date DATE,
  ADD COLUMN IF NOT EXISTS success_story TEXT,
  ADD COLUMN IF NOT EXISTS verified_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2c. Extend associate_disputes with type and escalation
ALTER TABLE associate_disputes
  ADD COLUMN IF NOT EXISTS dispute_type dispute_type,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- STEP 3: NEW TABLES
-- ============================================================

-- 3a. Associate Bank Accounts (reusable per associate)
CREATE TABLE IF NOT EXISTS associate_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (associate_id, account_number)
);

-- 3b. Associate Withdrawal Requests
CREATE TABLE IF NOT EXISTS associate_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES associate_bank_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 100),
  status withdrawal_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3c. Associate Commission Ledger (itemized, event-driven)
CREATE TABLE IF NOT EXISTS associate_commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type commission_event_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  -- Optional references for traceability
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  case_id UUID REFERENCES associate_cases(id) ON DELETE SET NULL,
  marriage_success_id UUID REFERENCES marriage_successes(id) ON DELETE SET NULL,
  withdrawal_id UUID REFERENCES associate_withdrawal_requests(id) ON DELETE SET NULL,
  balance_before NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_after NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_credit BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3d. Associate Case Meetings
CREATE TABLE IF NOT EXISTS associate_case_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES associate_cases(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'virtual'
    CHECK (meeting_type IN ('virtual', 'in_person', 'phone')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  attendees JSONB NOT NULL DEFAULT '[]',   -- [{name, role, confirmed}]
  meeting_link TEXT,
  location TEXT,
  outcome TEXT,                             -- filled after meeting
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3e. Associate Case Reminders
CREATE TABLE IF NOT EXISTS associate_case_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES associate_cases(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3f. Associate Match Shares (profiles shared to clients)
CREATE TABLE IF NOT EXISTS associate_match_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES associate_cases(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_response TEXT DEFAULT 'pending'
    CHECK (client_response IN ('pending', 'interested', 'not_interested', 'maybe')),
  client_response_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (case_id, shared_profile_id)
);

-- 3g. Associate Notifications (extended beyond generic notifications)
CREATE TABLE IF NOT EXISTS associate_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_assignment', 'case_update', 'meeting_scheduled',
    'commission_released', 'review_received', 'marriage_completed',
    'dispute_opened', 'withdrawal_approved', 'withdrawal_rejected',
    'reminder_due', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STEP 4: INDEXES
-- ============================================================

-- associate_cases
CREATE INDEX IF NOT EXISTS idx_associate_cases_associate_status
  ON associate_cases (associate_id, status, last_activity_at DESC)
  WHERE status != 'closed';

CREATE INDEX IF NOT EXISTS idx_associate_cases_user
  ON associate_cases (user_id, created_at DESC);

-- associate_commission_ledger
CREATE INDEX IF NOT EXISTS idx_commission_ledger_associate
  ON associate_commission_ledger (associate_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commission_ledger_event
  ON associate_commission_ledger (event_type, created_at DESC);

-- associate_withdrawal_requests
CREATE INDEX IF NOT EXISTS idx_withdrawals_associate_status
  ON associate_withdrawal_requests (associate_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_pending
  ON associate_withdrawal_requests (status, created_at DESC)
  WHERE status = 'pending';

-- associate_case_meetings
CREATE INDEX IF NOT EXISTS idx_meetings_case
  ON associate_case_meetings (case_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_meetings_associate_upcoming
  ON associate_case_meetings (associate_id, scheduled_at)
  WHERE is_completed = FALSE;

-- associate_case_reminders
CREATE INDEX IF NOT EXISTS idx_reminders_associate_due
  ON associate_case_reminders (associate_id, due_at)
  WHERE is_completed = FALSE;

-- associate_match_shares
CREATE INDEX IF NOT EXISTS idx_match_shares_case
  ON associate_match_shares (case_id, shared_at DESC);

-- associate_notifications
CREATE INDEX IF NOT EXISTS idx_assoc_notif_unread
  ON associate_notifications (associate_id, created_at DESC)
  WHERE is_read = FALSE;

-- associate_bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_associate
  ON associate_bank_accounts (associate_id);

-- ============================================================
-- STEP 5: TRIGGERS
-- ============================================================

-- 5a. Auto-update last_activity_at on associate_cases when activities added
CREATE OR REPLACE FUNCTION update_case_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE associate_cases
    SET last_activity_at = NOW()
    WHERE id = NEW.case_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_case_last_activity ON associate_activities;
CREATE TRIGGER trg_update_case_last_activity
  AFTER INSERT ON associate_activities
  FOR EACH ROW EXECUTE FUNCTION update_case_last_activity();

-- 5b. Auto-insert activity on case status change
CREATE OR REPLACE FUNCTION log_case_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO associate_activities (case_id, associate_id, activity_type, description, metadata)
    VALUES (
      NEW.id,
      NEW.associate_id,
      'stage_change',
      'Case moved from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('from_stage', OLD.status, 'to_stage', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_case_stage_change ON associate_cases;
CREATE TRIGGER trg_log_case_stage_change
  AFTER UPDATE OF status ON associate_cases
  FOR EACH ROW EXECUTE FUNCTION log_case_stage_change();

-- 5c. Commission ledger entry → update wallet balance atomically
CREATE OR REPLACE FUNCTION sync_wallet_from_ledger()
RETURNS TRIGGER AS $$
DECLARE
  v_balance NUMERIC(12, 2);
BEGIN
  SELECT wallet_balance INTO v_balance FROM associates WHERE id = NEW.associate_id;

  IF NEW.is_credit THEN
    UPDATE associates SET wallet_balance = wallet_balance + NEW.amount WHERE id = NEW.associate_id;
    NEW.balance_before := v_balance;
    NEW.balance_after  := v_balance + NEW.amount;
  ELSE
    UPDATE associates SET wallet_balance = GREATEST(0, wallet_balance - NEW.amount) WHERE id = NEW.associate_id;
    NEW.balance_before := v_balance;
    NEW.balance_after  := GREATEST(0, v_balance - NEW.amount);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_wallet_from_ledger ON associate_commission_ledger;
CREATE TRIGGER trg_sync_wallet_from_ledger
  BEFORE INSERT ON associate_commission_ledger
  FOR EACH ROW EXECUTE FUNCTION sync_wallet_from_ledger();

-- 5d. Marriage verified → release success bonus
CREATE OR REPLACE FUNCTION release_marriage_bonus()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified_at IS NOT NULL AND OLD.verified_at IS NULL THEN
    INSERT INTO associate_commission_ledger
      (associate_id, event_type, amount, description, marriage_success_id, is_credit)
    VALUES (
      NEW.associate_id,
      'marriage_success',
      2000.00,
      'Marriage Success Bonus — Case ' || (SELECT case_number FROM associate_cases WHERE id = NEW.case_id),
      NEW.id,
      TRUE
    );

    -- Send notification to associate
    INSERT INTO associate_notifications (associate_id, type, title, body, metadata)
    VALUES (
      NEW.associate_id,
      'marriage_completed',
      '🎉 Marriage Success Bonus Credited!',
      'Congratulations! ₹2,000 marriage success bonus has been added to your wallet.',
      jsonb_build_object('marriage_success_id', NEW.id, 'amount', 2000)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_release_marriage_bonus ON marriage_successes;
CREATE TRIGGER trg_release_marriage_bonus
  AFTER UPDATE OF verified_at ON marriage_successes
  FOR EACH ROW EXECUTE FUNCTION release_marriage_bonus();

-- 5e. Updated_at trigger for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to new tables
DROP TRIGGER IF EXISTS trg_updated_at_bank_accounts ON associate_bank_accounts;
CREATE TRIGGER trg_updated_at_bank_accounts
  BEFORE UPDATE ON associate_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_withdrawals ON associate_withdrawal_requests;
CREATE TRIGGER trg_updated_at_withdrawals
  BEFORE UPDATE ON associate_withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_meetings ON associate_case_meetings;
CREATE TRIGGER trg_updated_at_meetings
  BEFORE UPDATE ON associate_case_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_marriage_successes ON marriage_successes;
CREATE TRIGGER trg_updated_at_marriage_successes
  BEFORE UPDATE ON marriage_successes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 6: RLS POLICIES
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE associate_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE associate_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE associate_commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE associate_case_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE associate_case_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE associate_match_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE associate_notifications ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if user is an associate (any level)
CREATE OR REPLACE FUNCTION is_any_associate()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('local_associate','block_associate','district_associate','state_associate')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- associate_bank_accounts ----
CREATE POLICY "Associates manage own bank accounts"
  ON associate_bank_accounts FOR ALL
  USING (associate_id = auth.uid())
  WITH CHECK (associate_id = auth.uid());

CREATE POLICY "Super admin reads all bank accounts"
  ON associate_bank_accounts FOR SELECT
  USING (is_super_admin());

-- ---- associate_withdrawal_requests ----
CREATE POLICY "Associates manage own withdrawals"
  ON associate_withdrawal_requests FOR ALL
  USING (associate_id = auth.uid())
  WITH CHECK (associate_id = auth.uid());

CREATE POLICY "Super admin full access to withdrawals"
  ON associate_withdrawal_requests FOR ALL
  USING (is_super_admin());

-- ---- associate_commission_ledger ----
CREATE POLICY "Associates read own commission ledger"
  ON associate_commission_ledger FOR SELECT
  USING (associate_id = auth.uid());

CREATE POLICY "Super admin reads all commission ledger"
  ON associate_commission_ledger FOR SELECT
  USING (is_super_admin());

CREATE POLICY "System inserts commission entries"
  ON associate_commission_ledger FOR INSERT
  WITH CHECK (is_any_associate() OR is_super_admin());

-- ---- associate_case_meetings ----
CREATE POLICY "Associates manage own case meetings"
  ON associate_case_meetings FOR ALL
  USING (associate_id = auth.uid())
  WITH CHECK (associate_id = auth.uid());

CREATE POLICY "Super admin reads all meetings"
  ON associate_case_meetings FOR SELECT
  USING (is_super_admin());

-- ---- associate_case_reminders ----
CREATE POLICY "Associates manage own reminders"
  ON associate_case_reminders FOR ALL
  USING (associate_id = auth.uid())
  WITH CHECK (associate_id = auth.uid());

-- ---- associate_match_shares ----
CREATE POLICY "Associates manage own match shares"
  ON associate_match_shares FOR ALL
  USING (associate_id = auth.uid())
  WITH CHECK (associate_id = auth.uid());

CREATE POLICY "Users see profiles shared to their case"
  ON associate_match_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM associate_cases ac
      WHERE ac.id = associate_match_shares.case_id
      AND ac.user_id = auth.uid()
    )
  );

-- ---- associate_notifications ----
CREATE POLICY "Associates read own notifications"
  ON associate_notifications FOR SELECT
  USING (associate_id = auth.uid());

CREATE POLICY "Associates mark own notifications read"
  ON associate_notifications FOR UPDATE
  USING (associate_id = auth.uid())
  WITH CHECK (associate_id = auth.uid());

CREATE POLICY "System inserts notifications"
  ON associate_notifications FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- STEP 7: SUPABASE REALTIME
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'associate_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE associate_notifications;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'associate_cases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE associate_cases;
  END IF;
END$$;

-- ============================================================
-- STEP 8: STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'associate-docs',
  'associate-docs',
  FALSE,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marriage-photos',
  'marriage-photos',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Associates upload to associate-docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'associate-docs'
    AND is_any_associate()
  );

CREATE POLICY "Associates read own associate-docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'associate-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR is_super_admin())
  );

CREATE POLICY "Associates upload marriage photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'marriage-photos'
    AND is_any_associate()
  );

CREATE POLICY "Authenticated read marriage photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'marriage-photos');
