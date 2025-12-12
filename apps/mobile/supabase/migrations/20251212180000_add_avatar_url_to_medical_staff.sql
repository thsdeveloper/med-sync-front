-- =====================================================
-- Migration: Add avatar_url column to medical_staff table
-- Description: Adds a nullable text column to store profile image URLs from Storage
-- Feature: F002 - Add avatar_url column to profiles table schema
-- =====================================================

-- Add avatar_url column to medical_staff table
-- This column will store the public URL to the user's profile image
-- stored in the 'profile-images' storage bucket
ALTER TABLE public.medical_staff
ADD COLUMN avatar_url TEXT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.medical_staff.avatar_url IS 'Public URL to user profile image in storage.profile-images bucket. Format: https://{project}.supabase.co/storage/v1/object/public/profile-images/{user_id}/avatar.jpg';

-- =====================================================
-- Verification Queries
-- =====================================================
-- Verify column was added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'medical_staff'
--   AND column_name = 'avatar_url';

-- Test query to select avatar_url:
-- SELECT id, name, email, avatar_url
-- FROM public.medical_staff
-- LIMIT 5;
