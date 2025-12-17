/**
 * Mobile Attachment API Wrapper
 * Feature: F034 - Add attachment management API endpoints and validation
 *
 * Provides high-level API wrapper for attachment operations in mobile app.
 * Wraps Supabase RPC functions with TypeScript types and error handling.
 *
 * @module attachmentApi
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  validateFile,
  validateAttachmentCount,
  formatFileSize,
  sanitizeFileName,
  generateStoragePath,
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from '@medsync/shared/utils/attachment-validation';

// ============================================================================
// TYPES
// ============================================================================

export interface UploadAttachmentParams {
  conversationId: string;
  messageId: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  filePath: string;
  fileSize: number;
}

export interface UploadAttachmentResponse {
  success: boolean;
  attachment_id?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  message?: string;
  error?: string;
}

export interface UpdateAttachmentStatusParams {
  attachmentId: string;
  status: 'accepted' | 'rejected';
  rejectedReason?: string;
}

export interface UpdateAttachmentStatusResponse {
  success: boolean;
  attachment_id?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface DeleteAttachmentResponse {
  success: boolean;
  file_path?: string;
  file_name?: string;
  error?: string;
}

export interface UploadStatsResponse {
  uploads_in_last_hour: number;
  rate_limit: number;
  remaining_uploads: number;
  limit_resets_at: string;
}

export interface AttachmentAuditLog {
  id: string;
  action: string;
  actor_name: string | null;
  actor_role: string;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================================================
// ATTACHMENT API CLASS
// ============================================================================

/**
 * Mobile Attachment API wrapper
 * Provides high-level methods for attachment operations
 *
 * @example
 * ```ts
 * import { createClient } from '@supabase/supabase-js';
 * import { AttachmentApi } from '@/lib/api/attachmentApi';
 *
 * const supabase = createClient(url, key);
 * const attachmentApi = new AttachmentApi(supabase);
 *
 * // Upload attachment
 * const result = await attachmentApi.uploadAttachment({
 *   conversationId: 'conversation-uuid',
 *   messageId: 'message-uuid',
 *   fileName: 'document.pdf',
 *   fileType: 'pdf',
 *   filePath: 'org-id/conv-id/document.pdf',
 *   fileSize: 1024000
 * });
 * ```
 */
export class AttachmentApi {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Uploads attachment metadata to database after file upload
   * Validates file before making RPC call
   *
   * @param params - Upload parameters
   * @returns Upload response with attachment_id on success
   */
  async uploadAttachment(
    params: UploadAttachmentParams
  ): Promise<UploadAttachmentResponse> {
    try {
      // Client-side validation
      const validation = validateFile(params.fileName, params.fileSize);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Call RPC function
      const { data, error } = await this.supabase.rpc('upload_chat_attachment', {
        p_conversation_id: params.conversationId,
        p_message_id: params.messageId,
        p_file_name: params.fileName,
        p_file_type: params.fileType,
        p_file_path: params.filePath,
        p_file_size: params.fileSize,
      });

      if (error) {
        console.error('[AttachmentApi] Upload error:', error);
        return {
          success: false,
          error: error.message || 'Erro ao fazer upload do anexo',
        };
      }

      return data as UploadAttachmentResponse;
    } catch (error) {
      console.error('[AttachmentApi] Upload exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Updates attachment status (accept/reject)
   * Admin-only operation
   *
   * @param params - Update parameters
   * @returns Update response with status
   */
  async updateAttachmentStatus(
    params: UpdateAttachmentStatusParams
  ): Promise<UpdateAttachmentStatusResponse> {
    try {
      // Validate rejected reason if status is rejected
      if (params.status === 'rejected' && !params.rejectedReason) {
        return {
          success: false,
          error: 'Motivo da rejeição é obrigatório',
        };
      }

      // Call RPC function
      const { data, error } = await this.supabase.rpc('update_attachment_status', {
        p_attachment_id: params.attachmentId,
        p_status: params.status,
        p_rejected_reason: params.rejectedReason || null,
      });

      if (error) {
        console.error('[AttachmentApi] Update status error:', error);
        return {
          success: false,
          error: error.message || 'Erro ao atualizar status do anexo',
        };
      }

      return data as UpdateAttachmentStatusResponse;
    } catch (error) {
      console.error('[AttachmentApi] Update status exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Deletes attachment
   * Users can delete their own pending attachments, admins can delete any
   *
   * @param attachmentId - Attachment UUID
   * @param organizationId - Organization UUID
   * @param reason - Deletion reason (optional)
   * @returns Delete response with file path for storage cleanup
   */
  async deleteAttachment(
    attachmentId: string,
    organizationId: string,
    reason: string = 'user_requested'
  ): Promise<DeleteAttachmentResponse> {
    try {
      // Call RPC function
      const { data, error } = await this.supabase.rpc('delete_attachment', {
        p_attachment_id: attachmentId,
        p_organization_id: organizationId,
        p_reason: reason,
      });

      if (error) {
        console.error('[AttachmentApi] Delete error:', error);
        return {
          success: false,
          error: error.message || 'Erro ao deletar anexo',
        };
      }

      return data as DeleteAttachmentResponse;
    } catch (error) {
      console.error('[AttachmentApi] Delete exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Gets user's upload statistics for current hour
   * Used to display rate limit status
   *
   * @param userId - User UUID
   * @param organizationId - Organization UUID
   * @returns Upload statistics
   */
  async getUploadStats(
    userId: string,
    organizationId: string
  ): Promise<UploadStatsResponse | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_upload_stats', {
        p_user_id: userId,
        p_organization_id: organizationId,
      });

      if (error) {
        console.error('[AttachmentApi] Get upload stats error:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('[AttachmentApi] Get upload stats exception:', error);
      return null;
    }
  }

  /**
   * Gets audit trail for specific attachment
   * Admin-only operation
   *
   * @param attachmentId - Attachment UUID
   * @param organizationId - Organization UUID
   * @returns Array of audit log entries
   */
  async getAttachmentAuditTrail(
    attachmentId: string,
    organizationId: string
  ): Promise<AttachmentAuditLog[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_attachment_audit_trail', {
        p_attachment_id: attachmentId,
        p_organization_id: organizationId,
      });

      if (error) {
        console.error('[AttachmentApi] Get audit trail error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[AttachmentApi] Get audit trail exception:', error);
      return [];
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates attachment before upload
 * Performs client-side validation to provide immediate feedback
 *
 * @param fileName - File name
 * @param fileSize - File size in bytes
 * @param currentAttachmentCount - Current number of attachments on message
 * @returns Validation result with error message if invalid
 */
export function validateAttachmentBeforeUpload(
  fileName: string,
  fileSize: number,
  currentAttachmentCount: number = 0
): { valid: boolean; error?: string } {
  // Validate file metadata
  const fileValidation = validateFile(fileName, fileSize);
  if (!fileValidation.valid) {
    return { valid: false, error: fileValidation.error };
  }

  // Validate attachment count
  const countValidation = validateAttachmentCount(currentAttachmentCount, 1);
  if (!countValidation.valid) {
    return { valid: false, error: countValidation.error };
  }

  return { valid: true };
}

/**
 * Formats upload stats for display
 *
 * @param stats - Upload statistics
 * @returns Formatted string for display
 */
export function formatUploadStats(stats: UploadStatsResponse): string {
  const { uploads_in_last_hour, rate_limit, remaining_uploads } = stats;
  return `${uploads_in_last_hour}/${rate_limit} uploads (${remaining_uploads} restantes)`;
}

/**
 * Checks if user can upload more files
 *
 * @param stats - Upload statistics
 * @returns True if user can upload, false if rate limit exceeded
 */
export function canUpload(stats: UploadStatsResponse | null): boolean {
  if (!stats) return true; // Assume allowed if stats unavailable
  return stats.remaining_uploads > 0;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export {
  validateFile,
  validateAttachmentCount,
  formatFileSize,
  sanitizeFileName,
  generateStoragePath,
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS_PER_MESSAGE,
};
