-- ============================================================
-- STORAGE BUCKETS SETUP & SECURITY FOR USER PROFILE PHOTOS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow select (anyone can read public urls)
DROP POLICY IF EXISTS "Public access to profile-photos" ON storage.objects;
CREATE POLICY "Public access to profile-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- Allow insert only for authenticated users into their own folder
DROP POLICY IF EXISTS "Authenticated users upload own photos" ON storage.objects;
CREATE POLICY "Authenticated users upload own photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow delete only for authenticated users for their own folder
DROP POLICY IF EXISTS "Authenticated users delete own photos" ON storage.objects;
CREATE POLICY "Authenticated users delete own photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
