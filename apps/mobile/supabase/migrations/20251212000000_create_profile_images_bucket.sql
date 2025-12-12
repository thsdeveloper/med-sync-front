-- Migration: Create profile-images storage bucket with RLS policies
-- Created: 2025-12-12
-- Purpose: Enable secure profile image uploads for authenticated users
--
-- This migration creates a new storage bucket for user profile images with:
-- 1. Public read access (anyone can view profile images)
-- 2. Authenticated write access (only logged-in users can upload)
-- 3. User-specific folder structure (user_id/avatar.jpg)
-- 4. RLS policies ensuring users can only manage their own images

-- ==============================================================================
-- STEP 1: Create the profile-images bucket
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true, -- Public read access
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- STEP 2: Enable RLS on storage.objects table (if not already enabled)
-- ==============================================================================
-- Note: This is typically already enabled, but we ensure it here
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 3: Create RLS Policy for PUBLIC READ access
-- ==============================================================================
-- Anyone (authenticated or not) can view profile images
CREATE POLICY "Public read access for profile images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-images'
);

-- ==============================================================================
-- STEP 4: Create RLS Policy for AUTHENTICATED INSERT
-- ==============================================================================
-- Authenticated users can upload images only to their own folder (user_id/*)
-- Path structure: {user_id}/avatar.jpg or {user_id}/profile-{timestamp}.jpg
CREATE POLICY "Authenticated users can upload to own profile folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==============================================================================
-- STEP 5: Create RLS Policy for AUTHENTICATED UPDATE
-- ==============================================================================
-- Authenticated users can update (replace) their own profile images
CREATE POLICY "Users can update own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==============================================================================
-- STEP 6: Create RLS Policy for AUTHENTICATED DELETE
-- ==============================================================================
-- Authenticated users can delete their own profile images
CREATE POLICY "Users can delete own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==============================================================================
-- VERIFICATION QUERIES (for testing - DO NOT RUN in migration)
-- ==============================================================================
-- These queries can be used to verify the bucket and policies were created:
--
-- 1. Check bucket exists:
--    SELECT * FROM storage.buckets WHERE name = 'profile-images';
--
-- 2. Check policies:
--    SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%profile%';
--
-- 3. Test upload path validation (replace YOUR_USER_ID):
--    -- This should succeed: YOUR_USER_ID/avatar.jpg
--    -- This should fail: DIFFERENT_USER_ID/avatar.jpg
--
-- ==============================================================================
-- FOLDER STRUCTURE DOCUMENTATION
-- ==============================================================================
-- Recommended folder structure for profile images:
--
-- 1. Simple avatar (single profile picture):
--    {user_id}/avatar.jpg
--    Example: 550e8400-e29b-41d4-a716-446655440000/avatar.jpg
--
-- 2. Versioned profile pictures (multiple uploads):
--    {user_id}/profile-{timestamp}.jpg
--    Example: 550e8400-e29b-41d4-a716-446655440000/profile-1702350000000.jpg
--
-- 3. Multiple image types (avatar, cover, etc.):
--    {user_id}/avatar.jpg
--    {user_id}/cover.jpg
--    {user_id}/thumbnail.jpg
--
-- Note: The RLS policies enforce that the first folder level MUST be the user's ID
-- ==============================================================================
