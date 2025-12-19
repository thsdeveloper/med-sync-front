/**
 * EditableAvatar Molecule Component
 *
 * A clickable avatar component that allows users to upload a new profile image.
 * Wraps the UserAvatar atom with upload functionality, hover overlay, and loading states.
 *
 * Features:
 * - Click to open file picker
 * - Hover overlay with camera icon
 * - Loading spinner during upload
 * - Image crop/zoom dialog before upload
 * - Integrates with useProfileImageUpload hook
 *
 * @module components/molecules/EditableAvatar
 */

'use client';

import React, { useRef, useCallback, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { UserAvatar, type UserAvatarProps } from '@/components/atoms/UserAvatar';
import { ImageCropDialog } from '@/components/molecules/ImageCropDialog';
import { cn } from '@/lib/utils';

/**
 * Accepted file types for profile images
 */
const ACCEPTED_FILE_TYPES = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';

/**
 * Props for the EditableAvatar component
 */
export interface EditableAvatarProps extends Omit<UserAvatarProps, 'className'> {
  /** Callback when a cropped avatar file is ready for upload */
  onFileSelect?: (file: File) => void;
  /** Whether the avatar is in a disabled/non-editable state */
  disabled?: boolean;
  /** Whether an upload is currently in progress */
  isUploading?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the avatar */
  avatarClassName?: string;
}

/**
 * EditableAvatar - A clickable avatar with upload and crop capability
 *
 * @example
 * Basic usage with upload hook
 * ```tsx
 * function ProfileSettings() {
 *   const { uploadAvatar, isUploading } = useProfileImageUpload();
 *
 *   const handleFileSelect = async (file: File) => {
 *     const newUrl = await uploadAvatar(file);
 *     // Avatar will update automatically after successful upload
 *   };
 *
 *   return (
 *     <EditableAvatar
 *       name="Dr. João Silva"
 *       avatarUrl={user.avatar_url}
 *       size="xl"
 *       onFileSelect={handleFileSelect}
 *       isUploading={isUploading}
 *     />
 *   );
 * }
 * ```
 */
export function EditableAvatar({
  name,
  avatarUrl,
  color,
  size = 'xl',
  variant,
  showBorder,
  testId,
  onFileSelect,
  disabled = false,
  isUploading = false,
  className,
  avatarClassName,
}: EditableAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Create object URL for the crop dialog
        const imageUrl = URL.createObjectURL(file);
        setSelectedImageSrc(imageUrl);
        setShowCropDialog(true);
      }
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    },
    []
  );

  const handleCropComplete = useCallback(
    (croppedFile: File) => {
      // Clean up the object URL
      if (selectedImageSrc) {
        URL.revokeObjectURL(selectedImageSrc);
      }
      setSelectedImageSrc(null);
      setShowCropDialog(false);

      // Call the onFileSelect callback with the cropped file
      if (onFileSelect) {
        onFileSelect(croppedFile);
      }
    },
    [selectedImageSrc, onFileSelect]
  );

  const handleCropDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        // Clean up the object URL when dialog is closed
        if (selectedImageSrc) {
          URL.revokeObjectURL(selectedImageSrc);
        }
        setSelectedImageSrc(null);
      }
      setShowCropDialog(open);
    },
    [selectedImageSrc]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const isInteractive = !disabled && !isUploading;

  return (
    <>
      <div
        className={cn(
          'relative inline-block',
          isInteractive && 'cursor-pointer',
          disabled && 'opacity-60 cursor-not-allowed',
          isUploading && 'cursor-wait',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-label={isUploading ? 'Enviando foto...' : 'Clique para alterar foto de perfil'}
        aria-disabled={disabled || isUploading}
        data-testid={testId ? `${testId}-container` : undefined}
      >
        {/* Avatar */}
        <UserAvatar
          name={name}
          avatarUrl={avatarUrl}
          color={color}
          size={size}
          variant={variant}
          showBorder={showBorder}
          testId={testId}
          className={avatarClassName}
        />

        {/* Hover overlay with camera icon (only when not uploading) */}
        {isInteractive && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'rounded-full bg-black/50',
              'opacity-0 transition-opacity duration-200',
              'group-hover:opacity-100 hover:opacity-100'
            )}
            aria-hidden="true"
          >
            <Camera className="h-5 w-5 text-white" />
          </div>
        )}

        {/* Loading overlay (when uploading) */}
        {isUploading && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50"
            aria-hidden="true"
          >
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Crop dialog */}
      <ImageCropDialog
        open={showCropDialog}
        onOpenChange={handleCropDialogClose}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
        isProcessing={isUploading}
      />
    </>
  );
}

export default EditableAvatar;
