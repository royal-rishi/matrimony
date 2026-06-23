-- ============================================================
-- MIGRATION: 0010_feature_flags.sql
-- Create system_feature_flags table and configure RLS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.system_feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY system_feature_flags_select ON public.system_feature_flags
  FOR SELECT USING (true); -- Anyone logged in can read flags to adjust client views

CREATE POLICY system_feature_flags_all ON public.system_feature_flags
  FOR ALL USING (
    public.check_admin_permission('manage_settings') 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Trigger for updated_at
CREATE TRIGGER update_system_feature_flags_updated_at 
  BEFORE UPDATE ON public.system_feature_flags 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default feature flags
INSERT INTO public.system_feature_flags (id, name, is_enabled, description) VALUES
  ('ai_matching', 'AI Matchmaking Engine', false, 'Uses advanced vector matching algorithms to recommend profiles.'),
  ('video_calling', 'Video and Voice Calling', false, 'Enables real-time peer-to-peer audio-video chat inside match rooms.'),
  ('associate_network', 'Local Associate Matchmaker Assist', true, 'Allows users to hire local matchmakers and assigns cases.'),
  ('new_search_engine', 'Elastic Search Engine Upgrade', false, 'Enables faster search queries with multi-faceted filtering options.'),
  ('experimental_features', 'Developer Experimental Features', false, 'Flags new UI components and widgets currently in sandbox testing.')
ON CONFLICT (id) DO NOTHING;
