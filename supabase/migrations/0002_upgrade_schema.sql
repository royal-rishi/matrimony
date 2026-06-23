-- ============================================================
-- Rishtajodo Matrimony - Upgrade Database Migration
-- 0002_upgrade_schema.sql
-- ============================================================

-- ============================================================
-- 1. NEW ENUMS
-- ============================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
    CREATE TYPE case_status AS ENUM (
      'new', 'searching', 'profiles_shared', 'interested', 
      'family_discussion', 'meeting_scheduled', 'engagement', 
      'marriage_completed', 'closed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
    CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('interest', 'chat', 'payment', 'associate', 'verification', 'system');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'document');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_session_status') THEN
    CREATE TYPE video_session_status AS ENUM ('initiated', 'active', 'ended', 'missed');
  END IF;
END $$;

-- ============================================================
-- 2. NEW TABLES
-- ============================================================

-- Case Management Table
CREATE TABLE IF NOT EXISTS public.associate_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  status case_status DEFAULT 'new'::case_status NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Case Number Auto-Generation sequence and triggers
CREATE SEQUENCE IF NOT EXISTS case_number_seq;

CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.case_number IS NULL THEN
    NEW.case_number := 'RJ-CASE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('case_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_generate_case_number
BEFORE INSERT ON public.associate_cases
FOR EACH ROW
EXECUTE FUNCTION generate_case_number();

-- Associate Notes CRM
CREATE TABLE IF NOT EXISTS public.associate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.associate_cases(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Associate Activity Timeline
CREATE TABLE IF NOT EXISTS public.associate_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.associate_cases(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Associate Reviews
CREATE TABLE IF NOT EXISTS public.associate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.associate_cases(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_case_review UNIQUE (case_id)
);

-- Marriage Success System
CREATE TABLE IF NOT EXISTS public.marriage_successes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groom_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bride_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  associate_id UUID REFERENCES public.associates(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.associate_cases(id) ON DELETE SET NULL,
  marriage_date DATE NOT NULL,
  success_story TEXT,
  photos TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  verified_by_admin BOOLEAN DEFAULT FALSE NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT check_groom_bride_different CHECK (groom_id != bride_id)
);

-- Notification Engine Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Chat System Tables (Partition-Ready)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_participant UNIQUE (room_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT,
  message_type message_type DEFAULT 'text'::message_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS public.messages_default PARTITION OF public.messages DEFAULT;

CREATE TABLE IF NOT EXISTS public.message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  message_created_at TIMESTAMPTZ NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_message_read UNIQUE (message_id, profile_id),
  CONSTRAINT fk_message_read_partitioned FOREIGN KEY (message_id, message_created_at) REFERENCES public.messages(id, created_at) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  message_created_at TIMESTAMPTZ NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_message_attachment_partitioned FOREIGN KEY (message_id, message_created_at) REFERENCES public.messages(id, created_at) ON DELETE CASCADE
);

-- Associate User Chat Rooms
CREATE TABLE IF NOT EXISTS public.associate_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID UNIQUE NOT NULL REFERENCES public.associate_cases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.associate_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.associate_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  message_type message_type DEFAULT 'text'::message_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS public.associate_messages_default PARTITION OF public.associate_messages DEFAULT;

-- Dispute System Table
CREATE TABLE IF NOT EXISTS public.associate_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.associate_cases(id) ON DELETE SET NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  status dispute_status DEFAULT 'open'::dispute_status NOT NULL,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Video Calling Sessions
CREATE TABLE IF NOT EXISTS public.video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  initiated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status video_session_status DEFAULT 'initiated'::video_session_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 3. ALTER STATEMENTS / UPGRADES
-- ============================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS registered_by_associate_id UUID REFERENCES public.associates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS managed_by_associate_id UUID REFERENCES public.associates(id) ON DELETE SET NULL;

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS matchmaking_plan_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS married_at TIMESTAMPTZ;

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cases_associate ON public.associate_cases(associate_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.associate_cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_user ON public.associate_cases(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_case ON public.associate_cases (user_id) WHERE (status != 'closed' AND status != 'marriage_completed');

CREATE INDEX IF NOT EXISTS idx_notes_case ON public.associate_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_notes_assoc_user ON public.associate_notes(associate_id, user_id);

CREATE INDEX IF NOT EXISTS idx_activities_case ON public.associate_activities(case_id);
CREATE INDEX IF NOT EXISTS idx_activities_assoc ON public.associate_activities(associate_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.associate_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_reviews_assoc ON public.associate_reviews(associate_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.associate_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_success_groom_bride ON public.marriage_successes(groom_id, bride_id);
CREATE INDEX IF NOT EXISTS idx_success_assoc ON public.marriage_successes(associate_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON public.chat_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_profile ON public.chat_room_participants(profile_id);

CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_assoc_messages_room_created ON public.associate_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assoc_messages_sender ON public.associate_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_disputes_user ON public.associate_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_assoc ON public.associate_disputes(associate_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.associate_disputes(status);

CREATE INDEX IF NOT EXISTS idx_video_sessions_initiated ON public.video_sessions(initiated_by);
CREATE INDEX IF NOT EXISTS idx_video_sessions_status ON public.video_sessions(status);

CREATE INDEX IF NOT EXISTS idx_profiles_registered_by ON public.profiles(registered_by_associate_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_profiles_managed_by ON public.profiles(managed_by_associate_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_referrals_conv_timestamps ON public.referrals(registered_at, verified_at, premium_at, matchmaking_plan_at, married_at);

-- ============================================================
-- 5. TRIGGERS (Auto updated_at)
-- ============================================================

CREATE OR REPLACE TRIGGER trigger_update_associate_cases BEFORE UPDATE ON public.associate_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_update_associate_notes BEFORE UPDATE ON public.associate_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_update_marriage_successes BEFORE UPDATE ON public.marriage_successes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_update_associate_chat_rooms BEFORE UPDATE ON public.associate_chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_update_associate_disputes BEFORE UPDATE ON public.associate_disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_update_video_sessions BEFORE UPDATE ON public.video_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. SECURITY - ROW LEVEL SECURITY (RLS)
-- ============================================================

-- RLS helper functions
CREATE OR REPLACE FUNCTION public.check_user_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_associate()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('local_associate', 'block_associate', 'district_associate', 'state_associate')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.associate_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marriage_successes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- 6.1 Associate Cases RLS
CREATE POLICY "Users read own case" ON public.associate_cases 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Associates read assigned cases" ON public.associate_cases 
  FOR SELECT USING (associate_id = auth.uid() OR public.check_user_role('super_admin'));

CREATE POLICY "Associates manage cases" ON public.associate_cases 
  FOR ALL USING (associate_id = auth.uid() OR public.check_user_role('super_admin'));

-- 6.2 Associate Notes RLS (User cannot view notes)
CREATE POLICY "Associates read write own notes" ON public.associate_notes 
  FOR ALL USING (associate_id = auth.uid() OR public.check_user_role('super_admin'));

-- 6.3 Associate Activities RLS
CREATE POLICY "Users read own case activities" ON public.associate_activities 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.associate_cases c 
    WHERE c.id = case_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Associates view activities" ON public.associate_activities 
  FOR SELECT USING (associate_id = auth.uid() OR public.check_user_role('super_admin'));

CREATE POLICY "Associates insert activities" ON public.associate_activities 
  FOR INSERT WITH CHECK (associate_id = auth.uid() OR public.check_user_role('super_admin'));

-- 6.4 Associate Reviews RLS
CREATE POLICY "Everyone read reviews" ON public.associate_reviews 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users insert reviews for own case" ON public.associate_reviews 
  FOR INSERT WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.associate_cases c 
    WHERE c.id = case_id AND c.user_id = auth.uid()
  ));

-- 6.5 Marriage Successes RLS
CREATE POLICY "Everyone read success stories" ON public.marriage_successes 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage success stories" ON public.marriage_successes 
  FOR ALL USING (public.check_user_role('super_admin'));

-- 6.6 Notifications RLS
CREATE POLICY "Users access own notifications" ON public.notifications 
  FOR ALL USING (user_id = auth.uid());

-- 6.7 Chat Rooms RLS
CREATE POLICY "Participants view rooms" ON public.chat_rooms 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chat_room_participants p 
    WHERE p.room_id = id AND p.profile_id = auth.uid()
  ) OR public.check_user_role('super_admin'));

CREATE POLICY "Participants join rooms" ON public.chat_room_participants 
  FOR ALL USING (profile_id = auth.uid() OR public.check_user_role('super_admin'));

-- 6.8 Messages RLS
CREATE POLICY "Room participants view messages" ON public.messages 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chat_room_participants p 
    WHERE p.room_id = room_id AND p.profile_id = auth.uid()
  ) OR public.check_user_role('super_admin'));

CREATE POLICY "Room participants send messages" ON public.messages 
  FOR INSERT WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chat_room_participants p 
    WHERE p.room_id = room_id AND p.profile_id = auth.uid()
  ));

-- 6.9 Message Reads RLS
CREATE POLICY "Participants manage reads" ON public.message_reads 
  FOR ALL USING (profile_id = auth.uid());

-- 6.10 Message Attachments RLS
CREATE POLICY "Participants view attachments" ON public.message_attachments 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.chat_room_participants p ON m.room_id = p.room_id
    WHERE m.id = message_id AND p.profile_id = auth.uid()
  ) OR public.check_user_role('super_admin'));

-- 6.11 Associate Chat Rooms RLS
CREATE POLICY "Case participants view associate chat rooms" ON public.associate_chat_rooms 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.associate_cases c 
    WHERE c.id = case_id AND (c.user_id = auth.uid() OR c.associate_id = auth.uid())
  ) OR public.check_user_role('super_admin'));

-- 6.12 Associate Messages RLS
CREATE POLICY "Case participants view associate messages" ON public.associate_messages 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.associate_chat_rooms r
    JOIN public.associate_cases c ON r.case_id = c.id
    WHERE r.id = room_id AND (c.user_id = auth.uid() OR c.associate_id = auth.uid())
  ) OR public.check_user_role('super_admin'));

CREATE POLICY "Case participants send associate messages" ON public.associate_messages 
  FOR INSERT WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.associate_chat_rooms r
    JOIN public.associate_cases c ON r.case_id = c.id
    WHERE r.id = room_id AND (c.user_id = auth.uid() OR c.associate_id = auth.uid())
  ));

-- 6.13 Disputes RLS
CREATE POLICY "Dispute creator and involved associate view" ON public.associate_disputes 
  FOR SELECT USING (user_id = auth.uid() OR associate_id = auth.uid() OR public.check_user_role('super_admin'));

CREATE POLICY "Dispute creator insert dispute" ON public.associate_disputes 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins update disputes" ON public.associate_disputes 
  FOR UPDATE USING (public.check_user_role('super_admin')) WITH CHECK (public.check_user_role('super_admin'));

CREATE POLICY "Initiators and participants view sessions" ON public.video_sessions 
  FOR SELECT USING (initiated_by = auth.uid() OR EXISTS (
    -- If room corresponds to a chat room or case chat, allow access
    SELECT 1 FROM public.chat_room_participants p
    WHERE p.room_id = video_sessions.room_id AND p.profile_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.associate_cases c
    JOIN public.associate_chat_rooms r ON r.case_id = c.id
    WHERE r.id = video_sessions.room_id AND (c.user_id = auth.uid() OR c.associate_id = auth.uid())
  ) OR public.check_user_role('super_admin'));

CREATE POLICY "Authorized users initiate sessions" ON public.video_sessions 
  FOR INSERT WITH CHECK (initiated_by = auth.uid());

-- ============================================================
-- 7. MATERIALIZED VIEWS (Analytics)
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.associate_performance_analytics AS
SELECT 
  a.id AS associate_id,
  p.first_name,
  p.last_name,
  p.state,
  p.city,
  COUNT(c.id) AS cases_assigned_count,
  COUNT(CASE WHEN c.status = 'closed' OR c.status = 'marriage_completed' THEN 1 END) AS cases_completed_count,
  COALESCE(AVG(r.rating)::NUMERIC(3,2), 0.00) AS average_rating,
  COUNT(m.id) AS marriage_success_count,
  COALESCE(AVG(EXTRACT(EPOCH FROM (c.completed_at - c.assigned_at))/3600)::NUMERIC(6,2), 0.00) AS average_case_duration_hours
FROM public.associates a
JOIN public.profiles p ON a.id = p.id
LEFT JOIN public.associate_cases c ON a.id = c.associate_id
LEFT JOIN public.associate_reviews r ON a.id = r.associate_id
LEFT JOIN public.marriage_successes m ON a.id = m.associate_id
GROUP BY a.id, p.first_name, p.last_name, p.state, p.city;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assoc_perf_analytics_id ON public.associate_performance_analytics(associate_id);
