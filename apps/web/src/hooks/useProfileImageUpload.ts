/**
 * useProfileImageUpload Hook
 *
 * Custom React hook for uploading and managing profile images.
 * Handles file validation, Supabase Storage upload, and database updates.
 *
 * Features:
 * - File type and size validation
 * - Upload to Supabase Storage (profile-images bucket)
 * - Database update to medical_staff.avatar_url
 * - Toast notifications for success/error feedback
 * - Loading state management
 *
 * @module hooks/useProfileImageUpload
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

/**
 * Configuration for profile image uploads
 */
const PROFILE_IMAGE_CONFIG = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  maxSizeMB: 5,
  acceptedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,
  bucket: 'profile-images',
} as const;

/**
 * Error codes for profile image operations
 */
export enum ProfileImageErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
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
 * Result of a successful profile image upload
 */
export interface ProfileImageUploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Options for the useProfileImageUpload hook
 */
export interface UseProfileImageUploadOptions {
  /** Callback fired after successful upload */
  onSuccess?: (avatarUrl: string) => void;
}

/**
 * Hook return type with all methods and states
 */
export interface UseProfileImageUploadResult {
  /** Uploads a profile image file */
  uploadAvatar: (file: File) => Promise<string | null>;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Error from the last operation */
  error: ProfileImageError | null;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Validates a file for profile image upload
 */
function validateFile(file: File): void {
  // Validate file type
  if (!PROFILE_IMAGE_CONFIG.acceptedTypes.includes(file.type as typeof PROFILE_IMAGE_CONFIG.acceptedTypes[number])) {
    throw new ProfileImageError(
      ProfileImageErrorCode.INVALID_FILE_TYPE,
      `Formato não suportado. Use JPEG, PNG, WebP ou GIF.`
    );
  }

  // Validate file size
  if (file.size > PROFILE_IMAGE_CONFIG.maxSizeBytes) {
    throw new ProfileImageError(
      ProfileImageErrorCode.FILE_TOO_LARGE,
      `Arquivo muito grande. Máximo de ${PROFILE_IMAGE_CONFIG.maxSizeMB}MB permitido.`
    );
  }
}

/**
 * Deletes old avatar images from a user's storage folder
 * This is called asynchronously and doesn't block the upload
 */
async function deleteOldAvatars(userId: string): Promise<void> {
  try {
    // List all files in the user's folder
    const { data: files, error: listError } = await supabase.storage
      .from(PROFILE_IMAGE_CONFIG.bucket)
      .list(userId, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError || !files || files.length === 0) {
      return;
    }

    // Filter for avatar files (avatar-*.* pattern)
    const avatarFiles = files.filter(file =>
      file.name.startsWith('avatar-')
    );

    if (avatarFiles.length === 0) {
      return;
    }

    // Build file paths for deletion
    const filesToDelete = avatarFiles.map(file => `${userId}/${file.name}`);

    // Delete old avatars
    await supabase.storage
      .from(PROFILE_IMAGE_CONFIG.bucket)
      .remove(filesToDelete);
  } catch (error) {
    // Log but don't throw - cleanup failure shouldn't block upload
    console.warn('[profile-image] Failed to delete old avatars:', error);
  }
}

/**
 * Custom React hook to upload profile images
 *
 * @returns Hook result with upload method, loading state, and error
 *
 * @example
 * ```tsx
 * function ProfileSettings() {
 *   const { uploadAvatar, isUploading, error } = useProfileImageUpload();
 *
 *   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (file) {
 *       const newUrl = await uploadAvatar(file);
 *       if (newUrl) {
 *         console.log('Avatar updated:', newUrl);
 *       }
 *     }
 *   };
 *
 *   return (
 *     <input
 *       type="file"
 *       accept="image/*"
 *       onChange={handleFileChange}
 *       disabled={isUploading}
 *     />
 *   );
 * }
 * ```
 */
export function useProfileImageUpload(
  options?: UseProfileImageUploadOptions
): UseProfileImageUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<ProfileImageError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Validate file
      validateFile(file);

      // Step 2: Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new ProfileImageError(
          ProfileImageErrorCode.SESSION_NOT_FOUND,
          'Sessão não encontrada. Faça login novamente.',
          sessionError
        );
      }

      const userId = session.user.id;

      // Step 3: Delete old avatars asynchronously (don't wait)
      deleteOldAvatars(userId).catch(() => {
        // Silently handle - cleanup failure is non-critical
      });

      // Step 4: Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `avatar-${timestamp}.${extension}`;
      const filePath = `${userId}/${filename}`;

      // Step 5: Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(PROFILE_IMAGE_CONFIG.bucket)
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new ProfileImageError(
          ProfileImageErrorCode.UPLOAD_FAILED,
          'Erro ao enviar imagem. Tente novamente.',
          uploadError
        );
      }

      // Step 6: Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(PROFILE_IMAGE_CONFIG.bucket)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Step 7: Update medical_staff.avatar_url in database
      const { error: updateError } = await supabase
        .from('medical_staff')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        throw new ProfileImageError(
          ProfileImageErrorCode.UPDATE_FAILED,
          'Imagem enviada mas erro ao atualizar perfil. Tente novamente.',
          updateError
        );
      }

      // Step 8: Also update auth user metadata for consistency
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      // Success toast
      toast.success('Foto de perfil atualizada!', {
        description: 'Sua nova foto de perfil foi salva com sucesso.',
      });

      // Call onSuccess callback if provided
      if (options?.onSuccess) {
        options.onSuccess(publicUrl);
      }

      return publicUrl;
    } catch (err) {
      const profileError = err instanceof ProfileImageError
        ? err
        : new ProfileImageError(
            ProfileImageErrorCode.UPLOAD_FAILED,
            'Erro inesperado ao enviar imagem.',
            err
          );

      setError(profileError);

      // Error toast
      toast.error('Erro ao atualizar foto de perfil', {
        description: profileError.message,
      });

      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadAvatar,
    isUploading,
    error,
    clearError,
  };
}
