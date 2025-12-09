-- Storage Migration Script for User Avatars
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;

-- Step 3: Create INSERT policy - Allow authenticated users to upload
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Step 4: Create UPDATE policy - Allow authenticated users to update
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Step 5: Create DELETE policy - Allow authenticated users to delete
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Step 6: Create SELECT policy - Allow everyone to view
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Done! Verify by running:
-- SELECT * FROM storage.buckets WHERE id = 'user-avatars';
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
