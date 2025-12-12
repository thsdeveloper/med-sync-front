/**
 * ProfileAvatarUpload Component
 *
 * A molecule component that manages the complete profile avatar upload workflow.
 * This component handles:
 * - Displaying current avatar or placeholder
 * - Triggering image picker with permission handling
 * - Showing loading state during crop and upload
 * - Error handling with user feedback
 * - Database updates after successful upload
 *
 * Follows Atomic Design Methodology:
 * - Uses Avatar atom from components/ui
 * - Orchestrates image picker, cropper, and upload utilities
 * - Provides complete UX for avatar management
 *
 * @module components/molecules/ProfileAvatarUpload
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/avatar';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useImageCropper } from '@/hooks/useImageCropper';
import {
  uploadProfileImage,
  updateUserAvatar,
  ProfileImageError,
} from '@/lib/profile-image';

/**
 * Props for ProfileAvatarUpload component
 */
export interface ProfileAvatarUploadProps {
  /**
   * Current user ID (required for upload authorization)
   */
  userId: string;

  /**
   * User's full name (used for avatar initials fallback)
   */
  userName: string;

  /**
   * Current avatar URL (if any)
   */
  currentAvatarUrl?: string | null;

  /**
   * Callback fired when upload completes successfully
   * @param avatarUrl - The new avatar URL from Supabase Storage
   */
  onUploadComplete?: (avatarUrl: string) => void;

  /**
   * Avatar size in pixels (default: 120)
   */
  size?: number;

  /**
   * Whether the avatar is editable (default: true)
   */
  editable?: boolean;

  /**
   * Avatar background color (default: '#0066CC')
   */
  color?: string;
}

/**
 * ProfileAvatarUpload Component
 *
 * Displays a user's profile avatar with upload functionality.
 * On tap, launches image picker, crops image to 512x512px, uploads to Supabase Storage,
 * and updates the database. Shows loading states and error messages throughout.
 *
 * @example
 * ```tsx
 * <ProfileAvatarUpload
 *   userId={user.id}
 *   userName={user.name}
 *   currentAvatarUrl={user.avatar_url}
 *   onUploadComplete={(url) => {
 *     console.log('New avatar:', url);
 *     // Optionally refresh user data
 *   }}
 * />
 * ```
 */
export function ProfileAvatarUpload({
  userId,
  userName,
  currentAvatarUrl,
  onUploadComplete,
  size = 120,
  editable = true,
  color = '#0066CC',
}: ProfileAvatarUploadProps) {
  // Local state for optimistic updates
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);

  // Hooks for image selection and manipulation
  const { pickImage } = useImagePicker();
  const { cropImage } = useImageCropper();

  /**
   * Handle the complete upload workflow
   * Step 1: Pick image (with permissions)
   * Step 2: Crop to 512x512px
   * Step 3: Upload to Supabase Storage
   * Step 4: Update database
   * Step 5: Notify parent component
   */
  const handleAvatarPress = useCallback(async () => {
    if (!editable) return;

    // Haptic feedback on tap
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      console.log('[ProfileAvatarUpload] Starting avatar upload workflow');

      // Step 1: Pick image from device
      // This handles permissions automatically
      const selectedImage = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // User cancelled picker - graceful exit
      if (!selectedImage) {
        console.log('[ProfileAvatarUpload] User cancelled image picker');
        return;
      }

      console.log('[ProfileAvatarUpload] Image selected:', selectedImage.uri);

      // Set uploading state - shows loading indicator
      setIsUploading(true);

      // Step 2: Crop image to perfect square (512x512px)
      console.log('[ProfileAvatarUpload] Cropping image...');
      const croppedImage = await cropImage(selectedImage.uri, {
        targetSize: 512,
        quality: 0.9,
      });

      if (!croppedImage) {
        throw new Error('Image cropping failed. Please try again.');
      }

      console.log('[ProfileAvatarUpload] Image cropped successfully:', croppedImage.uri);

      // Step 3: Upload to Supabase Storage
      console.log('[ProfileAvatarUpload] Uploading to storage...');
      const uploadResult = await uploadProfileImage({
        userId,
        imageUri: croppedImage.uri,
        filenameSuffix: 'avatar',
        deleteOldAvatars: true,
      });

      console.log('[ProfileAvatarUpload] Upload successful:', uploadResult.publicUrl);

      // Step 4: Update database (medical_staff.avatar_url)
      console.log('[ProfileAvatarUpload] Updating database...');
      const updateResult = await updateUserAvatar({
        userId,
        avatarUrl: uploadResult.publicUrl,
      });

      if (!updateResult.success) {
        // Image uploaded but DB update failed
        // This is a partial failure - warn user but still show new avatar
        console.error('[ProfileAvatarUpload] Database update failed:', updateResult.error);

        Alert.alert(
          'Partial Upload',
          'Your avatar was uploaded but the database update failed. Please refresh the app to see your new avatar.',
          [{ text: 'OK' }]
        );

        // Still update local state for optimistic UI
        setAvatarUrl(uploadResult.publicUrl);
        setIsUploading(false);
        return;
      }

      console.log('[ProfileAvatarUpload] Database updated successfully');

      // Step 5: Update local state and notify parent
      setAvatarUrl(uploadResult.publicUrl);
      setIsUploading(false);

      // Success feedback
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(uploadResult.publicUrl);
      }

      // Success message
      Alert.alert('Success', 'Your profile picture has been updated!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('[ProfileAvatarUpload] Upload workflow failed:', error);

      setIsUploading(false);

      // Error feedback
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Determine error message
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error instanceof ProfileImageError) {
        switch (error.code) {
          case 'UPLOAD_FAILED':
            errorMessage = 'Failed to upload image. Please check your internet connection and try again.';
            break;
          case 'UNAUTHORIZED':
            errorMessage = 'You are not authorized to upload this image.';
            break;
          case 'SESSION_NOT_FOUND':
            errorMessage = 'Your session has expired. Please log in again.';
            break;
          case 'INVALID_INPUT':
            errorMessage = 'Invalid image data. Please select a different image.';
            break;
          case 'FETCH_FAILED':
            errorMessage = 'Failed to read the selected image. Please try again.';
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Show error alert
      Alert.alert('Upload Failed', errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try Again', onPress: handleAvatarPress },
      ]);
    }
  }, [
    editable,
    pickImage,
    cropImage,
    userId,
    onUploadComplete,
  ]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleAvatarPress}
        disabled={!editable || isUploading}
        activeOpacity={0.7}
        style={styles.avatarWrapper}
      >
        {/* Avatar display - shows image if URL exists, otherwise falls back to initials */}
        <Avatar
          name={userName}
          color={color}
          imageUrl={avatarUrl}
          style={{ width: size, height: size }}
        />

        {/* Loading overlay */}
        {isUploading && (
          <View style={[styles.loadingOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Edit icon badge (only if editable and not uploading) */}
        {editable && !isUploading && (
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Helper text */}
      {editable && !isUploading && (
        <Text style={styles.helperText}>Tap to change photo</Text>
      )}

      {isUploading && (
        <Text style={styles.uploadingText}>Uploading...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0066CC',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
    textAlign: 'center',
  },
});
