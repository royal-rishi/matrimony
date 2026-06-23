-- ============================================================
-- Rishtajodo Matrimony - Matrimony Search System Upgrades
-- 0003_search_indexes.sql
-- ============================================================

-- 1. Add verification column for seekers if missing
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Create B-Tree indexes on search filter targets
CREATE INDEX IF NOT EXISTS idx_profiles_religion ON public.profiles(religion) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_profiles_caste ON public.profiles(caste) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_profiles_location_search ON public.profiles(state, city) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_profiles_income ON public.profiles(annual_income) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_profiles_dob ON public.profiles(date_of_birth) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON public.profiles(is_premium) WHERE is_deleted = FALSE;

-- 3. Create composite index to accelerate sorted pagination queries
-- Filters usually partition on gender + is_deleted, then order by is_premium DESC, created_at DESC, id DESC
CREATE INDEX IF NOT EXISTS idx_profiles_search_composite 
  ON public.profiles(gender, is_deleted, is_premium DESC, created_at DESC, id DESC);
