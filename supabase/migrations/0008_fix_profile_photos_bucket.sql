-- ============================================================
-- FIX: profile-photos bucket was created as private.
-- Make it public and apply clean, non-conflicting RLS policies.
-- Already applied directly via Supabase SQL console.
-- This file is for tracking/documentation purposes.
-- ============================================================

-- Make bucket public and apply limits
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'profile-photos';

-- Clean up duplicate policies
DROP POLICY IF EXISTS "Authenticated users upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public access to profile-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can select profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;

-- Create clean policies
CREATE POLICY IF NOT EXISTS "profile_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "profile_photos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY IF NOT EXISTS "profile_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "profile_photos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);
