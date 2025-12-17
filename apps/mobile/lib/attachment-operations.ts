/**
 * Mobile Attachment Operations
 *
 * Provides React Native-specific attachment operation wrappers with error
 * handling, alerts, and mobile-specific functionality (sharing, caching).
 */

import { Alert } from 'react-native';
import { createClient } from './supabase';
import {
  uploadAttachmentRPC,
  deleteAttachmentRPC,
  cleanupOrphanedAttachmentsRPC,
  deleteFileFromStorage,
  getAttachmentDownloadUrl,
  formatRateLimitMessage,
  validateAttachmentUpload,
  type OperationResult,
  type UploadAttachmentResponse,
  type DeleteAttachmentResponse,
  type CleanupOrphanedResponse,
} from '@medsync/shared';
import type { FileType } from '@medsync/shared';

const STORAGE_BUCKET = 'chat-documents';

/**
 * Uploads an attachment with mobile-specific handling
 *
 * @param params - Upload parameters
 * @returns Operation result with attachment data and rate limit info
 */
export async function uploadAttachment(params: {
  conversation_id: string;
  message_id: string | null;
  file_name: string;
  file_type: FileType;
  file_path: string;
  file_size: number;
}): Promise<OperationResult<UploadAttachmentResponse>> {
  // Validate before upload
  const validation = validateAttachmentUpload({
    file_name: params.file_name,
    file_type: params.file_type,
    file_size: params.file_size,
  });

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const supabase = createClient();
  return uploadAttachmentRPC(supabase, params);
}

/**
 * Deletes an attachment with confirmation dialog
 *
 * @param attachmentId - ID of attachment to delete
 * @param fileName - Name of file (for confirmation message)
 * @param options - Delete options
 * @returns Operation result
 */
export async function deleteAttachmentWithConfirmation(
  attachmentId: string,
  fileName: string,
  options: {
    deleteFromStorage?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  } = { deleteFromStorage: true }
): Promise<void> {
  Alert.alert(
    'Deletar Anexo',
    `Tem certeza que deseja deletar "${fileName}"? Esta ação não pode ser desfeita.`,
    [
      {
        text: 'Cancelar',
        style: 'cancel',
        onPress: options.onCancel,
      },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          if (options.onConfirm) {
            options.onConfirm();
          }

          const result = await deleteAttachment(attachmentId, {
            deleteFromStorage: options.deleteFromStorage,
          });

          if (!result.success) {
            Alert.alert('Erro', result.error || 'Erro ao deletar anexo');
          }
        },
      },
    ]
  );
}

/**
 * Deletes an attachment and its file from storage
 *
 * @param attachmentId - ID of attachment to delete
 * @param options - Delete options
 * @returns Operation result
 */
export async function deleteAttachment(
  attachmentId: string,
  options: {
    deleteFromStorage?: boolean;
  } = { deleteFromStorage: true }
): Promise<OperationResult<DeleteAttachmentResponse>> {
  const supabase = createClient();

  // Delete from database first
  const result = await deleteAttachmentRPC(supabase, attachmentId);

  if (!result.success || !result.data) {
    return result;
  }

  // Delete from storage if requested
  if (options.deleteFromStorage && result.data.file_path) {
    const storageResult = await deleteFileFromStorage(
      supabase,
      STORAGE_BUCKET,
      result.data.file_path
    );

    // Log warning if storage deletion failed, but don't fail the operation
    if (!storageResult.success) {
      console.warn('Failed to delete file from storage:', storageResult.error);
    }
  }

  return result;
}

/**
 * Cleans up orphaned attachments (admin operation)
 *
 * @param ageHours - Age in hours for cleanup (default: 24)
 * @returns Operation result with cleanup info
 */
export async function cleanupOrphanedAttachments(
  ageHours: number = 24
): Promise<OperationResult<CleanupOrphanedResponse>> {
  const supabase = createClient();

  // Run cleanup RPC
  const result = await cleanupOrphanedAttachmentsRPC(supabase, ageHours);

  if (!result.success || !result.data) {
    return result;
  }

  // Delete files from storage
  if (result.data.deleted_paths && result.data.deleted_paths.length > 0) {
    for (const path of result.data.deleted_paths) {
      const storageResult = await deleteFileFromStorage(supabase, STORAGE_BUCKET, path);
      if (!storageResult.success) {
        console.warn('Failed to delete file from storage:', path);
      }
    }
  }

  return result;
}

/**
 * Gets a download URL for an attachment
 *
 * @param filePath - Path to file in storage
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Signed download URL or null
 */
export async function getAttachmentUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createClient();
  return getAttachmentDownloadUrl(supabase, STORAGE_BUCKET, filePath, expiresIn);
}

/**
 * Formats rate limit info for user display
 *
 * @param remaining - Remaining upload quota
 * @param resetAt - Reset time
 * @returns Formatted message
 */
export function getRateLimitMessage(remaining: number, resetAt: string): string {
  return formatRateLimitMessage(remaining, resetAt);
}

/**
 * Shows rate limit alert to user
 *
 * @param remaining - Remaining upload quota
 * @param resetAt - Reset time
 */
export function showRateLimitAlert(remaining: number, resetAt: string): void {
  const message = getRateLimitMessage(remaining, resetAt);
  Alert.alert('Limite de Uploads', message);
}

/**
 * Shows upload error alert
 *
 * @param error - Error message
 */
export function showUploadErrorAlert(error: string): void {
  Alert.alert('Erro no Upload', error);
}

/**
 * Shows delete success alert
 *
 * @param fileName - Name of deleted file
 */
export function showDeleteSuccessAlert(fileName: string): void {
  Alert.alert('Sucesso', `Anexo "${fileName}" deletado com sucesso`);
}

/**
 * Checks if file is viewable in mobile app
 *
 * @param fileType - Type of file
 * @returns True if file can be viewed
 */
export function isViewableInMobile(fileType: FileType): boolean {
  return fileType === 'pdf' || fileType === 'image';
}

/**
 * Gets appropriate icon name for file type (Ionicons)
 *
 * @param fileType - Type of file
 * @returns Icon name
 */
export function getFileIconName(fileType: FileType): string {
  switch (fileType) {
    case 'pdf':
      return 'document-text';
    case 'image':
      return 'image';
    default:
      return 'document';
  }
}
