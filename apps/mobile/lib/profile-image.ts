/**
 * Profile Image Upload Utility
 *
 * This module provides functions to upload and manage profile images in Supabase Storage.
 * Images are stored in the 'profile-images' bucket with user-specific folders.
 *
 * Folder structure: {user_id}/avatar-{timestamp}.jpg
 *
 * @module lib/profile-image
 */

import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Error codes for profile image operations
 */
export enum ProfileImageErrorCode {
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FETCH_FAILED = 'FETCH_FAILED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  UPDATE_FAILED = 'UPDATE_FAILED',
}

/**
 * Custom error class for profile image operations
 */
export class ProfileImageError extends Error {
  code: ProfileImageErrorCode;
  originalError?: unknown;

  constructor(code: ProfileImageErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'ProfileImageError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Options for uploading a profile image
 */
export interface ProfileImageUploadOptions {
  /**
   * The user ID (must match the authenticated user)
   */
  userId: string;

  /**
   * The local URI of the image to upload (from expo-image-picker or expo-image-manipulator)
   */
  imageUri: string;

  /**
   * Optional filename suffix (default: 'avatar')
   */
  filenameSuffix?: string;

  /**
   * Whether to delete old avatars before uploading (default: true)
   */
  deleteOldAvatars?: boolean;
}

/**
 * Result of a successful profile image upload
 */
export interface ProfileImageUploadResult {
  /**
   * The public URL of the uploaded image
   */
  publicUrl: string;

  /**
   * The storage path of the uploaded image
   */
  path: string;

  /**
   * The full URL including the bucket name
   */
  fullPath: string;
}

/**
 * Options for updating a user's avatar URL in the database
 */
export interface UpdateUserAvatarOptions {
  /**
   * The user ID (must match the authenticated user)
   */
  userId: string;

  /**
   * The avatar URL to set (public URL from Supabase Storage)
   */
  avatarUrl: string;
}

/**
 * Result of updating a user's avatar in the database
 */
export interface UpdateUserAvatarResult {
  /**
   * Whether the update was successful
   */
  success: boolean;

  /**
   * The updated profile data (medical_staff row)
   */
  profile?: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    specialty: string | null;
    updated_at: string | null;
  };

  /**
   * Error information if update failed
   */
  error?: {
    code: ProfileImageErrorCode;
    message: string;
  };
}

/**
 * Deletes old avatar images from a user's storage folder
 *
 * This function lists all files in the user's folder and deletes files
 * matching the avatar pattern (avatar-*.jpg). This cleanup happens before
 * uploading a new avatar to prevent accumulation of old files.
 *
 * @param userId - The user ID whose avatars should be deleted
 * @returns Promise that resolves when deletion is complete
 *
 * @remarks
 * - This function logs errors but does not throw them
 * - Failed deletions will not prevent new uploads
 * - Only deletes files matching the pattern: avatar-*.jpg
 *
 * @internal
 */
async function deleteOldAvatars(userId: string): Promise<void> {
  try {
    console.log(`[profile-image] Checking for old avatars to delete for user ${userId}`);

    // List all files in the user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('profile-images')
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.error('[profile-image] Error listing old avatars:', listError);
      // Don't throw - we'll proceed with upload even if cleanup fails
      return;
    }

    if (!files || files.length === 0) {
      console.log('[profile-image] No existing avatars found');
      return;
    }

    // Filter for avatar files (avatar-*.jpg pattern)
    const avatarFiles = files.filter(file =>
      file.name.startsWith('avatar-') && file.name.endsWith('.jpg')
    );

    if (avatarFiles.length === 0) {
      console.log('[profile-image] No avatar files to delete');
      return;
    }

    console.log(`[profile-image] Found ${avatarFiles.length} old avatar(s) to delete`);

    // Build file paths for deletion
    const filesToDelete = avatarFiles.map(file => `${userId}/${file.name}`);

    // Delete old avatars
    const { error: deleteError } = await supabase.storage
      .from('profile-images')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('[profile-image] Error deleting old avatars:', deleteError);
      // Don't throw - we'll proceed with upload even if cleanup fails
      return;
    }

    console.log(`[profile-image] Successfully deleted ${filesToDelete.length} old avatar(s)`);
  } catch (error) {
    console.error('[profile-image] Unexpected error during avatar cleanup:', error);
    // Don't throw - we'll proceed with upload even if cleanup fails
  }
}

/**
 * Converts an image URI to an ArrayBuffer for upload
 *
 * React Native's fetch API has incomplete Blob support for file:// URIs,
 * resulting in empty uploads. This function uses the recommended pattern:
 * file:// URI → base64 → ArrayBuffer, which works reliably in React Native.
 *
 * @param imageUri - The local URI of the image
 * @returns Promise resolving to an ArrayBuffer
 * @throws {ProfileImageError} If fetching or conversion fails
 *
 * @see https://github.com/orgs/supabase/discussions/1268
 * @internal
 */
async function imageUriToArrayBuffer(imageUri: string): Promise<ArrayBuffer> {
  try {
    console.log('[profile-image] Converting image URI to ArrayBuffer:', imageUri);

    // Step 1: Read file as base64 using expo-file-system (new API)
    // This works reliably with file:// URIs from expo-image-manipulator
    const file = new FileSystem.File(imageUri);
    const base64 = await file.base64();

    if (!base64 || base64.length === 0) {
      throw new ProfileImageError(
        ProfileImageErrorCode.FETCH_FAILED,
        'File is empty or could not be read'
      );
    }

    console.log('[profile-image] Read file as base64, length:', base64.length);

    // Step 2: Decode base64 to ArrayBuffer
    // This is what Supabase Storage expects for React Native
    const arrayBuffer = decode(base64);

    if (arrayBuffer.byteLength === 0) {
      throw new ProfileImageError(
        ProfileImageErrorCode.FETCH_FAILED,
        'Converted ArrayBuffer is empty - file may be inaccessible'
      );
    }

    console.log('[profile-image] Successfully converted to ArrayBuffer:', {
      byteLength: arrayBuffer.byteLength,
    });

    return arrayBuffer;
  } catch (error) {
    if (error instanceof ProfileImageError) {
      throw error;
    }

    throw new ProfileImageError(
      ProfileImageErrorCode.FETCH_FAILED,
      'Failed to convert image URI to ArrayBuffer',
      error
    );
  }
}

/**
 * Uploads a profile image to Supabase Storage
 *
 * This function handles the complete workflow of uploading a profile image:
 * 1. Validates input parameters
 * 2. Verifies user authentication and authorization
 * 3. Deletes old avatar images (optional, default: true)
 * 4. Converts the image URI to a blob
 * 5. Generates a unique filename with timestamp
 * 6. Uploads the image to the user's folder
 * 7. Returns the public URL
 *
 * @param options - Upload configuration options
 * @returns Promise resolving to upload result with public URL
 * @throws {ProfileImageError} If upload fails or validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const result = await uploadProfileImage({
 *     userId: 'user-123',
 *     imageUri: 'file:///path/to/image.jpg',
 *   });
 *   console.log('Image uploaded:', result.publicUrl);
 * } catch (error) {
 *   if (error instanceof ProfileImageError) {
 *     console.error('Upload failed:', error.code, error.message);
 *   }
 * }
 * ```
 *
 * @remarks
 * - The authenticated user must match the userId parameter
 * - Images are uploaded to: profile-images/{userId}/avatar-{timestamp}.jpg
 * - Old avatars are automatically deleted before upload (can be disabled)
 * - The public URL is immediately accessible after upload
 * - RLS policies ensure users can only upload to their own folder
 */
export async function uploadProfileImage(
  options: ProfileImageUploadOptions
): Promise<ProfileImageUploadResult> {
  const {
    userId,
    imageUri,
    filenameSuffix = 'avatar',
    deleteOldAvatars: shouldDeleteOld = true,
  } = options;

  // Input validation
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ProfileImageError(
      ProfileImageErrorCode.INVALID_INPUT,
      'userId is required and must be a non-empty string'
    );
  }

  if (!imageUri || typeof imageUri !== 'string' || imageUri.trim().length === 0) {
    throw new ProfileImageError(
      ProfileImageErrorCode.INVALID_INPUT,
      'imageUri is required and must be a non-empty string'
    );
  }

  console.log('[profile-image] Starting upload process:', {
    userId,
    imageUri,
    filenameSuffix,
    shouldDeleteOld,
  });

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new ProfileImageError(
      ProfileImageErrorCode.SESSION_NOT_FOUND,
      'User session not found. Please log in.',
      sessionError
    );
  }

  // Verify user is uploading to their own folder (security check)
  if (session.user.id !== userId) {
    throw new ProfileImageError(
      ProfileImageErrorCode.UNAUTHORIZED,
      'You can only upload images to your own profile',
      { sessionUserId: session.user.id, requestedUserId: userId }
    );
  }

  console.log('[profile-image] User authenticated:', session.user.id);

  // Delete old avatars before uploading new one
  if (shouldDeleteOld) {
    await deleteOldAvatars(userId);
  }

  // Convert image URI to ArrayBuffer
  const imageArrayBuffer = await imageUriToArrayBuffer(imageUri);

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const filename = `${filenameSuffix}-${timestamp}.jpg`;
  const filePath = `${userId}/${filename}`;

  console.log('[profile-image] Uploading to path:', filePath);

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, imageArrayBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files (timestamp ensures uniqueness)
    });

  if (uploadError || !uploadData) {
    throw new ProfileImageError(
      ProfileImageErrorCode.UPLOAD_FAILED,
      `Failed to upload image: ${uploadError?.message || 'Unknown error'}`,
      uploadError
    );
  }

  console.log('[profile-image] Upload successful:', uploadData.path);

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  console.log('[profile-image] Public URL generated:', publicUrl);

  // Return result
  return {
    publicUrl,
    path: uploadData.path,
    fullPath: `profile-images/${uploadData.path}`,
  };
}

/**
 * Gets the public URL for an existing profile image
 *
 * This is a convenience function to get the public URL without uploading.
 *
 * @param userId - The user ID
 * @param filename - The filename (e.g., 'avatar-1234567890.jpg')
 * @returns The public URL
 *
 * @example
 * ```typescript
 * const url = getProfileImageUrl('user-123', 'avatar-1234567890.jpg');
 * ```
 */
export function getProfileImageUrl(userId: string, filename: string): string {
  const filePath = `${userId}/${filename}`;
  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Deletes a specific profile image
 *
 * @param userId - The user ID
 * @param filename - The filename to delete
 * @returns Promise that resolves when deletion is complete
 * @throws {ProfileImageError} If deletion fails
 *
 * @example
 * ```typescript
 * await deleteProfileImage('user-123', 'avatar-1234567890.jpg');
 * ```
 */
export async function deleteProfileImage(
  userId: string,
  filename: string
): Promise<void> {
  // Input validation
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ProfileImageError(
      ProfileImageErrorCode.INVALID_INPUT,
      'userId is required and must be a non-empty string'
    );
  }

  if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
    throw new ProfileImageError(
      ProfileImageErrorCode.INVALID_INPUT,
      'filename is required and must be a non-empty string'
    );
  }

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new ProfileImageError(
      ProfileImageErrorCode.SESSION_NOT_FOUND,
      'User session not found. Please log in.',
      sessionError
    );
  }

  // Verify user is deleting from their own folder
  if (session.user.id !== userId) {
    throw new ProfileImageError(
      ProfileImageErrorCode.UNAUTHORIZED,
      'You can only delete images from your own profile'
    );
  }

  const filePath = `${userId}/${filename}`;

  console.log('[profile-image] Deleting file:', filePath);

  const { error: deleteError } = await supabase.storage
    .from('profile-images')
    .remove([filePath]);

  if (deleteError) {
    throw new ProfileImageError(
      ProfileImageErrorCode.DELETE_FAILED,
      `Failed to delete image: ${deleteError.message}`,
      deleteError
    );
  }

  console.log('[profile-image] File deleted successfully:', filePath);
}

/**
 * Updates a user's avatar URL in the medical_staff (profiles) table
 *
 * This function updates the avatar_url column in the database for the authenticated user.
 * It includes security checks to ensure users can only update their own profile.
 *
 * @param options - Update configuration options
 * @returns Promise resolving to update result with success status and profile data
 *
 * @example
 * ```typescript
 * // After uploading an image
 * const uploadResult = await uploadProfileImage({
 *   userId: 'user-123',
 *   imageUri: 'file:///path/to/image.jpg',
 * });
 *
 * // Update the database
 * const result = await updateUserAvatar({
 *   userId: 'user-123',
 *   avatarUrl: uploadResult.publicUrl,
 * });
 *
 * if (result.success) {
 *   console.log('Avatar updated:', result.profile?.avatar_url);
 * } else {
 *   console.error('Update failed:', result.error?.message);
 * }
 * ```
 *
 * @remarks
 * - The authenticated user must match the userId parameter (security check)
 * - Returns full profile data for optimistic UI updates
 * - Does not throw errors - returns success: false with error details instead
 * - Updates the medical_staff table (this app uses medical_staff as the profiles table)
 * - The avatar_url can be set to null to remove the avatar
 * - RLS policies on medical_staff table enforce additional security
 */
export async function updateUserAvatar(
  options: UpdateUserAvatarOptions
): Promise<UpdateUserAvatarResult> {
  const { userId, avatarUrl } = options;

  try {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          code: ProfileImageErrorCode.INVALID_INPUT,
          message: 'userId is required and must be a non-empty string',
        },
      };
    }

    if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim().length === 0) {
      return {
        success: false,
        error: {
          code: ProfileImageErrorCode.INVALID_INPUT,
          message: 'avatarUrl is required and must be a non-empty string',
        },
      };
    }

    console.log('[profile-image] Starting avatar URL update:', {
      userId,
      avatarUrl,
    });

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: {
          code: ProfileImageErrorCode.SESSION_NOT_FOUND,
          message: 'User session not found. Please log in.',
        },
      };
    }

    // Verify user is updating their own profile (security check)
    if (session.user.id !== userId) {
      return {
        success: false,
        error: {
          code: ProfileImageErrorCode.UNAUTHORIZED,
          message: 'You can only update your own profile',
        },
      };
    }

    console.log('[profile-image] User authenticated:', session.user.id);

    // Update the avatar_url in medical_staff table
    const { data: updatedProfile, error: updateError } = await supabase
      .from('medical_staff')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('id, name, avatar_url, email, phone, role, specialty, updated_at')
      .single();

    if (updateError) {
      console.error('[profile-image] Update error:', updateError);
      return {
        success: false,
        error: {
          code: ProfileImageErrorCode.UPDATE_FAILED,
          message: `Failed to update avatar URL: ${updateError.message}`,
        },
      };
    }

    if (!updatedProfile) {
      console.error('[profile-image] No profile found for user:', userId);
      return {
        success: false,
        error: {
          code: ProfileImageErrorCode.UPDATE_FAILED,
          message: 'Profile not found for this user',
        },
      };
    }

    console.log('[profile-image] Avatar URL updated successfully:', {
      userId: updatedProfile.id,
      avatarUrl: updatedProfile.avatar_url,
    });

    // Return success with updated profile data
    return {
      success: true,
      profile: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        avatar_url: updatedProfile.avatar_url,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        specialty: updatedProfile.specialty,
        updated_at: updatedProfile.updated_at,
      },
    };
  } catch (error) {
    console.error('[profile-image] Unexpected error during avatar update:', error);
    return {
      success: false,
      error: {
        code: ProfileImageErrorCode.UPDATE_FAILED,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}
