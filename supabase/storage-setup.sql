-- Supabase Storage Bucket Setup for User Avatars
-- IMPORTANT: Don't run this SQL directly! Use the Supabase Dashboard UI instead.
-- This is because storage policies require special permissions.

-- STEP 1: Create the storage bucket via Dashboard
-- Go to Storage > New bucket
-- Name: user-avatars
-- Public: YES (checked)
-- Click Create

-- STEP 2: Set up policies via Dashboard UI
-- After creating the bucket:
-- 1. Click on "user-avatars" bucket
-- 2. Go to "Policies" tab
-- 3. Click "New policy" for each policy below

-- Policy 1: INSERT - Allow authenticated users to upload
-- Click "New Policy" > "For full customization"
-- Policy name: Users can upload their own avatars
-- Allowed operation: INSERT
-- Target roles: authenticated
-- USING expression: true
-- WITH CHECK expression:
(bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars')

-- Policy 2: UPDATE - Allow authenticated users to update
-- Click "New Policy" > "For full customization"
-- Policy name: Users can update their own avatars
-- Allowed operation: UPDATE
-- Target roles: authenticated
-- USING expression:
(bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars')

-- Policy 3: DELETE - Allow authenticated users to delete
-- Click "New Policy" > "For full customization"
-- Policy name: Users can delete their own avatars
-- Allowed operation: DELETE
-- Target roles: authenticated
-- USING expression:
(bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars')

-- Policy 4: SELECT - Allow everyone to view
-- Click "New Policy" > "For full customization"
-- Policy name: Public avatars are viewable by everyone
-- Allowed operation: SELECT
-- Target roles: anon (this is the public role)
-- USING expression:
(bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = 'avatars')

-- Done! Test by uploading an avatar in your app's Settings page.
