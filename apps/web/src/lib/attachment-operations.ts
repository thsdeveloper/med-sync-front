/**
 * Web Attachment Operations
 *
 * Provides web-specific attachment operation wrappers with error handling,
 * toast notifications, and browser-specific functionality.
 */

import { supabase } from '@/lib/supabase';
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
 * Uploads an attachment with browser-specific handling
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

  return uploadAttachmentRPC(supabase, params);
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
  // Run cleanup RPC
  const result = await cleanupOrphanedAttachmentsRPC(supabase, ageHours);

  if (!result.success || !result.data) {
    return result;
  }

  // Delete files from storage
  if (result.data.deleted_paths && result.data.deleted_paths.length > 0) {
    const storageResult = await deleteFileFromStorage(
      supabase,
      STORAGE_BUCKET,
      result.data.deleted_paths[0] // Delete one by one for better error handling
    );

    if (!storageResult.success) {
      console.warn('Failed to delete some files from storage');
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
  return getAttachmentDownloadUrl(supabase, STORAGE_BUCKET, filePath, expiresIn);
}

/**
 * Downloads an attachment file
 *
 * @param filePath - Path to file in storage
 * @param fileName - Name for downloaded file
 * @returns Operation result
 */
export async function downloadAttachment(
  filePath: string,
  fileName: string
): Promise<OperationResult<void>> {
  try {
    const url = await getAttachmentUrl(filePath);

    if (!url) {
      return {
        success: false,
        error: 'Erro ao gerar URL de download',
      };
    }

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao baixar arquivo',
    };
  }
}

/**
 * Opens an attachment in a new tab (for PDFs and images)
 *
 * @param filePath - Path to file in storage
 * @returns Operation result
 */
export async function viewAttachment(filePath: string): Promise<OperationResult<void>> {
  try {
    const url = await getAttachmentUrl(filePath);

    if (!url) {
      return {
        success: false,
        error: 'Erro ao gerar URL de visualização',
      };
    }

    window.open(url, '_blank');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao visualizar arquivo',
    };
  }
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
 * Checks if file is viewable in browser
 *
 * @param fileType - Type of file
 * @returns True if file can be viewed in browser
 */
export function isViewableInBrowser(fileType: FileType): boolean {
  return fileType === 'pdf' || fileType === 'image';
}

/**
 * Gets appropriate icon for file type
 *
 * @param fileType - Type of file
 * @returns Icon name (lucide-react icon name)
 */
export function getFileIcon(fileType: FileType): string {
  switch (fileType) {
    case 'pdf':
      return 'FileText';
    case 'image':
      return 'Image';
    default:
      return 'File';
  }
}
