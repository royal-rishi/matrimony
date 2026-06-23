-- ============================================================
-- Enforce unique mobile numbers in profiles table
-- Partial unique index excludes NULL and empty string values
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS profiles_mobile_number_unique
  ON public.profiles (mobile_number)
  WHERE mobile_number IS NOT NULL AND mobile_number <> '';
