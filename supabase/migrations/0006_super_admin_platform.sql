-- ============================================================
-- Rishtajodo Matrimony - Super Admin & CMS Platform Schema
-- 0006_super_admin_platform.sql
-- ============================================================

-- 1. Admin Roles & Permissions
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  permissions TEXT[] NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Admin Staff Profiles
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES public.admin_roles(id) ON UPDATE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  assigned_departments TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Admin Login Sessions
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  token_hash TEXT,
  mfa_verified BOOLEAN DEFAULT FALSE NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Admin Audit logs (Staff action logging)
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB DEFAULT '{}'::JSONB NOT NULL,
  new_data JSONB DEFAULT '{}'::JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Staff Notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id TEXT REFERENCES public.admin_roles(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. User verification documents (KYC)
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  national_id_type VARCHAR(50),
  national_id_number VARCHAR(100),
  id_proof_url TEXT,
  education_proof_url TEXT,
  occupation_proof_url TEXT,
  status kyc_status DEFAULT 'pending' NOT NULL,
  verification_notes TEXT,
  verified_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. CMS Pages content blocks (Stores dynamic content modules for 14 static pages)
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}'::JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  og_tags JSONB DEFAULT '{}'::JSONB NOT NULL,
  canonical_url TEXT,
  sitemap_controls JSONB DEFAULT '{}'::JSONB NOT NULL,
  robots_controls TEXT,
  version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. CMS Blogs entries
CREATE TABLE IF NOT EXISTS public.cms_blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_tags JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. CMS Mail/SMS templates
CREATE TABLE IF NOT EXISTS public.cms_templates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push')),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. CMS Media library catalog
CREATE TABLE IF NOT EXISTS public.cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'icon', 'banner')),
  size_bytes INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. CMS announcements
CREATE TABLE IF NOT EXISTS public.cms_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('site_announcement', 'maintenance_notice', 'festival_banner', 'marketing_banner')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  banner_url TEXT,
  link_url TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. CMS content versioning history
CREATE TABLE IF NOT EXISTS public.cms_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('page', 'blog', 'template')),
  entity_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  edited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. CMS page view analytics
CREATE TABLE IF NOT EXISTS public.cms_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('page', 'blog')),
  entity_id TEXT NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  clicks INTEGER DEFAULT 0 NOT NULL,
  conversions INTEGER DEFAULT 0 NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE (entity_type, entity_id, date)
);

-- 14. Anti-Fraud risk alerts triggers
CREATE TABLE IF NOT EXISTS public.admin_fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  details JSONB DEFAULT '{}'::JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'dismissed', 'confirmed')),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_cms_blogs_slug ON public.cms_blogs(slug);
CREATE INDEX IF NOT EXISTS idx_cms_blogs_status ON public.cms_blogs(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_analytics_lookup ON public.cms_analytics(entity_type, entity_id, date);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_risk ON public.admin_fraud_alerts(risk_score DESC, status);

-- Trigger to auto-update updated_at columns
CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON public.admin_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cms_blogs_updated_at BEFORE UPDATE ON public.cms_blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cms_templates_updated_at BEFORE UPDATE ON public.cms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed the initial roles list
INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('super_admin', 'Super Administrator', '{manage_users,manage_associates,manage_verifications,manage_cases,manage_payments,manage_commissions,manage_disputes,manage_fraud,manage_marriages,manage_content,manage_notifications,manage_analytics,manage_audit_logs,manage_settings}', 'Full platform database access controls')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('admin', 'General Administrator', '{manage_users,manage_associates,manage_verifications,manage_cases,manage_disputes,manage_marriages,manage_content,manage_notifications,manage_analytics}', 'General operations executive')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('verification_manager', 'Verification Team Manager', '{manage_verifications,manage_disputes,manage_analytics}', 'Directs documents KYC workflows')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('verification_executive', 'Verification Operator', '{manage_verifications}', 'Executes daily KYC checks')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('support_manager', 'Support Operations Lead', '{manage_disputes,manage_users,manage_notifications}', 'Coordinates disputes resolution processes')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('support_executive', 'Support Executive', '{manage_disputes}', 'Resolves user tickets')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('finance_manager', 'Finance Department Manager', '{manage_payments,manage_commissions,manage_analytics}', 'Approves massive refunds and payouts')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('finance_executive', 'Finance Agent', '{manage_payments,manage_commissions}', 'Performs ledger updates')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('associate_manager', 'Associate Network Manager', '{manage_associates,manage_commissions,manage_cases}', 'Oversees local associates network performance')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('content_manager', 'Content Management Lead', '{manage_content}', 'Maintains blogs and homepage copy')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('moderator', 'Platform Moderator', '{manage_users,manage_fraud}', 'Filters profiles and handles spam flags')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

INSERT INTO public.admin_roles (id, name, permissions, description) VALUES
  ('analytics_manager', 'Business Performance Analyst', '{manage_analytics}', 'Generates platform insights reports')
  ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions;

-- 15. RLS Policies
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Helper SQL Function: check if authenticated user has a specific admin permission
CREATE OR REPLACE FUNCTION public.check_admin_permission(required_perm TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT (required_perm = ANY(ar.permissions)) INTO has_perm
  FROM public.admin_profiles ap
  JOIN public.admin_roles ar ON ap.role_id = ar.id
  WHERE ap.id = auth.uid() AND ap.status = 'active';
  
  RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy configurations
CREATE POLICY admin_roles_read ON public.admin_roles FOR SELECT USING (true); -- Public read
CREATE POLICY admin_roles_all ON public.admin_roles FOR ALL USING (public.check_admin_permission('manage_settings'));

CREATE POLICY admin_profiles_read ON public.admin_profiles FOR SELECT USING (true);
CREATE POLICY admin_profiles_all ON public.admin_profiles FOR ALL USING (public.check_admin_permission('manage_settings') OR auth.uid() = id);

CREATE POLICY admin_sessions_all ON public.admin_sessions FOR ALL USING (admin_id = auth.uid() OR public.check_admin_permission('manage_settings'));

CREATE POLICY admin_activity_read ON public.admin_activity_logs FOR SELECT USING (public.check_admin_permission('manage_audit_logs'));
CREATE POLICY admin_activity_write ON public.admin_activity_logs FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY admin_notifications_all ON public.admin_notifications FOR ALL USING (
  admin_id = auth.uid() OR 
  role_id = (SELECT role_id FROM public.admin_profiles WHERE id = auth.uid()) OR
  public.check_admin_permission('manage_settings')
);

CREATE POLICY user_verifications_read ON public.user_verifications FOR SELECT USING (
  user_id = auth.uid() OR 
  public.check_admin_permission('manage_verifications')
);
CREATE POLICY user_verifications_all ON public.user_verifications FOR ALL USING (
  public.check_admin_permission('manage_verifications') OR 
  user_id = auth.uid()
);

-- Public reads for blogs/pages/announcements
CREATE POLICY cms_pages_read ON public.cms_pages FOR SELECT USING (status = 'published' OR public.check_admin_permission('manage_content'));
CREATE POLICY cms_pages_all ON public.cms_pages FOR ALL USING (public.check_admin_permission('manage_content'));

CREATE POLICY cms_blogs_read ON public.cms_blogs FOR SELECT USING (status = 'published' OR public.check_admin_permission('manage_content'));
CREATE POLICY cms_blogs_all ON public.cms_blogs FOR ALL USING (public.check_admin_permission('manage_content'));

CREATE POLICY cms_templates_all ON public.cms_templates FOR ALL USING (public.check_admin_permission('manage_content') OR public.check_admin_permission('manage_settings'));

CREATE POLICY cms_media_read ON public.cms_media FOR SELECT USING (true);
CREATE POLICY cms_media_all ON public.cms_media FOR ALL USING (public.check_admin_permission('manage_content'));

CREATE POLICY cms_announcements_read ON public.cms_announcements FOR SELECT USING (is_active = true OR public.check_admin_permission('manage_content'));
CREATE POLICY cms_announcements_all ON public.cms_announcements FOR ALL USING (public.check_admin_permission('manage_content'));

CREATE POLICY cms_version_history_read ON public.cms_version_history FOR SELECT USING (public.check_admin_permission('manage_content'));
CREATE POLICY cms_version_history_all ON public.cms_version_history FOR ALL USING (public.check_admin_permission('manage_content'));

CREATE POLICY cms_analytics_read ON public.cms_analytics FOR SELECT USING (public.check_admin_permission('manage_analytics'));
CREATE POLICY cms_analytics_write ON public.cms_analytics FOR ALL USING (true); -- Front-end can increment counters anonymously

CREATE POLICY fraud_alerts_all ON public.admin_fraud_alerts FOR ALL USING (public.check_admin_permission('manage_fraud'));
