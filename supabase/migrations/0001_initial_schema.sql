-- ============================================================
-- Rishtajodo Matrimony - Initial Database Migration
-- 0001_initial_schema.sql
-- ============================================================
-- Run this against your Supabase project via the SQL editor
-- or Supabase CLI: supabase db push
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";    -- For GIS location queries
-- CREATE EXTENSION IF NOT EXISTS "vector"; -- Uncomment when enabling AI embeddings

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'user', 'local_associate', 'block_associate',
  'district_associate', 'state_associate', 'super_admin'
);

CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE territory_level AS ENUM ('block', 'district', 'state');
CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected', 'connected');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium_gold', 'premium_platinum', 'elite');
CREATE TYPE commission_status AS ENUM ('calculated', 'paid', 'disputed');
CREATE TYPE log_severity AS ENUM ('info', 'warning', 'critical');

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user' NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE NOT NULL,
  marital_status VARCHAR(30) NOT NULL,
  religion VARCHAR(30) NOT NULL,
  caste VARCHAR(30),
  mother_tongue VARCHAR(30) NOT NULL,
  education VARCHAR(100),
  occupation VARCHAR(100),
  annual_income NUMERIC(15, 2),
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  country VARCHAR(50) DEFAULT 'India' NOT NULL,
  location_gis GEOGRAPHY(Point, 4326),
  photos TEXT[] DEFAULT '{}'::TEXT[],
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
  referral_code VARCHAR(20) UNIQUE,
  invited_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  partner_preferences JSONB DEFAULT '{}'::JSONB NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_profiles_role ON public.profiles(role) WHERE is_deleted = FALSE;
CREATE INDEX idx_profiles_gender_dob ON public.profiles(gender, date_of_birth) WHERE is_deleted = FALSE;
CREATE INDEX idx_profiles_location ON public.profiles(state, city) WHERE is_deleted = FALSE;
CREATE INDEX idx_profiles_gis ON public.profiles USING GIST(location_gis);

-- Associates
CREATE TABLE public.associates (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_associate_id UUID REFERENCES public.associates(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending_kyc' NOT NULL CHECK (status IN ('active', 'suspended', 'pending_kyc', 'inactive')),
  wallet_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (wallet_balance >= 0.00),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_associates_parent ON public.associates(parent_associate_id);
CREATE INDEX idx_associates_status ON public.associates(status);

-- Associate KYC
CREATE TABLE public.associate_kyc (
  id UUID PRIMARY KEY REFERENCES public.associates(id) ON DELETE CASCADE,
  national_id_type VARCHAR(20) NOT NULL,
  national_id_number VARCHAR(50) NOT NULL,
  id_proof_url TEXT NOT NULL,
  address_proof_url TEXT NOT NULL,
  kyc_status kyc_status DEFAULT 'pending' NOT NULL,
  verification_notes TEXT,
  verified_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Territory Assignments
CREATE TABLE public.territory_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  level territory_level NOT NULL,
  state VARCHAR(50) NOT NULL,
  district VARCHAR(50),
  block VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT chk_territory_hierarchy CHECK (
    (level = 'state' AND district IS NULL AND block IS NULL) OR
    (level = 'district' AND district IS NOT NULL AND block IS NULL) OR
    (level = 'block' AND district IS NOT NULL AND block IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_unique_territory_block ON public.territory_assignments(state, district, block) WHERE level = 'block';
CREATE UNIQUE INDEX idx_unique_territory_district ON public.territory_assignments(state, district) WHERE level = 'district';
CREATE UNIQUE INDEX idx_unique_territory_state ON public.territory_assignments(state) WHERE level = 'state';
CREATE INDEX idx_territory_associate ON public.territory_assignments(associate_id);

-- User to Local Associate Assignments
CREATE TABLE public.user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  unassigned_at TIMESTAMPTZ,
  reason TEXT,
  CONSTRAINT unique_active_user_assignment UNIQUE (user_id)
);

CREATE INDEX idx_user_assignments_local_associate ON public.user_assignments(local_associate_id);

-- Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_email VARCHAR(255) NOT NULL,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id, status);

-- Commissions
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0.00),
  status commission_status DEFAULT 'calculated' NOT NULL,
  paid_at TIMESTAMPTZ,
  transaction_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_commissions_associate ON public.commissions(associate_id);

-- Wallet Transactions
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('referral_bonus', 'commission', 'payout', 'adjustment')),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_wallet_txs_associate ON public.wallet_transactions(associate_id, created_at DESC);

-- Matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status match_status DEFAULT 'pending' NOT NULL,
  initiated_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  compatibility_score NUMERIC(5, 2) CHECK (compatibility_score >= 0.00 AND compatibility_score <= 100.00),
  match_reasons JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_match_pair UNIQUE(profile_id_1, profile_id_2),
  CONSTRAINT check_profiles_ordered CHECK (profile_id_1 < profile_id_2)
);

CREATE INDEX idx_matches_status ON public.matches(status);

-- AI Recommendations
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommended_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  compatibility_score NUMERIC(5, 2) NOT NULL,
  explanation TEXT,
  is_viewed BOOLEAN DEFAULT FALSE NOT NULL,
  is_disliked BOOLEAN DEFAULT FALSE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_recommendation UNIQUE(user_id, recommended_profile_id)
);

CREATE INDEX idx_ai_recs_user ON public.ai_recommendations(user_id) WHERE is_disliked = FALSE;

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(100) UNIQUE,
  razorpay_signature VARCHAR(255),
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
  status payment_status DEFAULT 'pending' NOT NULL,
  payment_gateway_response JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_payments_order ON public.payments(razorpay_order_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  tier subscription_tier NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT check_sub_dates CHECK (starts_at < expires_at)
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id) WHERE is_active = TRUE;

-- System Audit Logs
CREATE TABLE public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}'::JSONB NOT NULL,
  ip_address INET,
  severity log_severity DEFAULT 'info' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_audit_logs_action ON public.system_audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.system_audit_logs(actor_id);

-- ============================================================
-- TRIGGERS - Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_associates BEFORE UPDATE ON public.associates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_associate_kyc BEFORE UPDATE ON public.associate_kyc FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_matches BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ASSOCIATE HIERARCHY VALIDATION TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION validate_associate_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_role user_role;
  self_role user_role;
BEGIN
  SELECT role INTO self_role FROM public.profiles WHERE id = NEW.id;

  IF NEW.parent_associate_id IS NULL THEN
    IF self_role = 'state_associate' THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Only State Associates may have no parent.';
    END IF;
  END IF;

  SELECT role INTO parent_role FROM public.profiles WHERE id = NEW.parent_associate_id;

  CASE self_role
    WHEN 'local_associate' THEN
      IF parent_role != 'block_associate' THEN
        RAISE EXCEPTION 'Local Associate parent must be a Block Associate.';
      END IF;
    WHEN 'block_associate' THEN
      IF parent_role != 'district_associate' THEN
        RAISE EXCEPTION 'Block Associate parent must be a District Associate.';
      END IF;
    WHEN 'district_associate' THEN
      IF parent_role != 'state_associate' THEN
        RAISE EXCEPTION 'District Associate parent must be a State Associate.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid associate role hierarchy.';
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_hierarchy
BEFORE INSERT OR UPDATE ON public.associates
FOR EACH ROW EXECUTE FUNCTION validate_associate_hierarchy();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated users can search other user profiles" ON public.profiles FOR SELECT USING (role = 'user' AND is_deleted = FALSE AND auth.role() = 'authenticated');
CREATE POLICY "Super Admins read all profiles" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

-- Associates RLS
CREATE POLICY "Associates read own record" ON public.associates FOR SELECT USING (id = auth.uid());
CREATE POLICY "Super Admins manage all associates" ON public.associates FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Wallet Transactions RLS
CREATE POLICY "Associates view own wallet" ON public.wallet_transactions FOR SELECT USING (associate_id = auth.uid());
CREATE POLICY "Super Admins manage wallet transactions" ON public.wallet_transactions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Payments RLS
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super Admins view all payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Matches RLS
CREATE POLICY "Users view own matches" ON public.matches FOR SELECT USING (profile_id_1 = auth.uid() OR profile_id_2 = auth.uid());
CREATE POLICY "Users create match requests" ON public.matches FOR INSERT WITH CHECK (initiated_by_id = auth.uid());

-- AI Recommendations RLS
CREATE POLICY "Users view own recommendations" ON public.ai_recommendations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own recommendation views" ON public.ai_recommendations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Audit Logs RLS (super admin only)
CREATE POLICY "Super Admins read audit logs" ON public.system_audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));
