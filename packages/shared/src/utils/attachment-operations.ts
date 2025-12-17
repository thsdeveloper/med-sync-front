/**
 * Attachment Operations Utility Functions
 *
 * Provides shared business logic for attachment operations including
 * RPC function calls, error handling, and common patterns for upload,
 * delete, and status management.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatAttachment, FileType, AttachmentStatus } from '../schemas/chat.schema';

/**
 * Rate limit response interface
 */
export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  reset_at: string;
  error?: string;
}

/**
 * Upload attachment response interface
 */
export interface UploadAttachmentResponse {
  id: string;
  conversation_id: string;
  message_id: string | null;
  sender_id: string;
  file_name: string;
  file_type: FileType;
  file_path: string;
  file_size: number;
  status: AttachmentStatus;
  created_at: string;
  rate_limit: RateLimitInfo;
}

/**
 * Delete attachment response interface
 */
export interface DeleteAttachmentResponse {
  success: boolean;
  attachment_id: string;
  file_path: string;
  message: string;
}

/**
 * Cleanup orphaned attachments response interface
 */
export interface CleanupOrphanedResponse {
  success: boolean;
  deleted_count: number;
  deleted_paths: string[];
  message: string;
}

/**
 * Operation result interface
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Calls the upload_chat_attachment RPC function
 *
 * @param supabase - Supabase client instance
 * @param params - Upload parameters
 * @returns Operation result with attachment data
 */
export async function uploadAttachmentRPC(
  supabase: SupabaseClient,
  params: {
    conversation_id: string;
    message_id: string | null;
    file_name: string;
    file_type: FileType;
    file_path: string;
    file_size: number;
  }
): Promise<OperationResult<UploadAttachmentResponse>> {
  try {
    const { data, error } = await supabase.rpc('upload_chat_attachment', {
      p_conversation_id: params.conversation_id,
      p_message_id: params.message_id,
      p_file_name: params.file_name,
      p_file_type: params.file_type,
      p_file_path: params.file_path,
      p_file_size: params.file_size,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao fazer upload do anexo',
      };
    }

    return {
      success: true,
      data: data as UploadAttachmentResponse,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao fazer upload',
    };
  }
}

/**
 * Calls the delete_chat_attachment RPC function
 *
 * @param supabase - Supabase client instance
 * @param attachmentId - ID of the attachment to delete
 * @returns Operation result with deletion info
 */
export async function deleteAttachmentRPC(
  supabase: SupabaseClient,
  attachmentId: string
): Promise<OperationResult<DeleteAttachmentResponse>> {
  try {
    const { data, error } = await supabase.rpc('delete_chat_attachment', {
      p_attachment_id: attachmentId,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao deletar anexo',
      };
    }

    return {
      success: true,
      data: data as DeleteAttachmentResponse,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao deletar anexo',
    };
  }
}

/**
 * Calls the cleanup_orphaned_attachments RPC function
 *
 * @param supabase - Supabase client instance
 * @param ageHours - Age in hours for orphaned attachment cleanup (default: 24)
 * @returns Operation result with cleanup info
 */
export async function cleanupOrphanedAttachmentsRPC(
  supabase: SupabaseClient,
  ageHours: number = 24
): Promise<OperationResult<CleanupOrphanedResponse>> {
  try {
    const { data, error } = await supabase.rpc('cleanup_orphaned_attachments', {
      p_age_hours: ageHours,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao limpar anexos órfãos',
      };
    }

    return {
      success: true,
      data: data as CleanupOrphanedResponse,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao limpar anexos',
    };
  }
}

/**
 * Deletes a file from Supabase storage
 *
 * @param supabase - Supabase client instance
 * @param bucketName - Storage bucket name
 * @param filePath - Path to file in storage
 * @returns Operation result
 */
export async function deleteFileFromStorage(
  supabase: SupabaseClient,
  bucketName: string,
  filePath: string
): Promise<OperationResult<void>> {
  try {
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao deletar arquivo do storage',
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao deletar arquivo',
    };
  }
}

/**
 * Deletes multiple files from Supabase storage
 *
 * @param supabase - Supabase client instance
 * @param bucketName - Storage bucket name
 * @param filePaths - Array of file paths to delete
 * @returns Operation result with deletion info
 */
export async function deleteMultipleFilesFromStorage(
  supabase: SupabaseClient,
  bucketName: string,
  filePaths: string[]
): Promise<OperationResult<{ deleted: number; failed: number }>> {
  try {
    const { data, error } = await supabase.storage.from(bucketName).remove(filePaths);

    if (error) {
      return {
        success: false,
        error: error.message || 'Erro ao deletar arquivos do storage',
      };
    }

    return {
      success: true,
      data: {
        deleted: data?.length || 0,
        failed: filePaths.length - (data?.length || 0),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao deletar arquivos',
    };
  }
}

/**
 * Checks if rate limit error occurred
 *
 * @param error - Error message
 * @returns True if error is rate limit related
 */
export function isRateLimitError(error: string): boolean {
  return error.includes('Limite de uploads excedido') || error.includes('rate limit');
}

/**
 * Parses rate limit error to extract reset time
 *
 * @param error - Error message
 * @returns Reset time or null
 */
export function parseRateLimitResetTime(error: string): Date | null {
  // The error message from RPC includes the reset time
  // This is a simple parser - could be enhanced based on actual error format
  try {
    const match = error.match(/(\d+)\s*(minuto|hora)/i);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      const now = new Date();
      if (unit.includes('hora')) {
        now.setHours(now.getHours() + value);
      } else {
        now.setMinutes(now.getMinutes() + value);
      }
      return now;
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

/**
 * Formats rate limit error message for user display
 *
 * @param remaining - Remaining upload quota
 * @param resetAt - Reset time
 * @returns Formatted message
 */
export function formatRateLimitMessage(remaining: number, resetAt: string): string {
  if (remaining === 0) {
    const resetDate = new Date(resetAt);
    const now = new Date();
    const diffMinutes = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60));

    if (diffMinutes < 60) {
      return `Limite de uploads atingido. Você poderá enviar mais arquivos em ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}.`;
    } else {
      const diffHours = Math.ceil(diffMinutes / 60);
      return `Limite de uploads atingido. Você poderá enviar mais arquivos em ${diffHours} hora${diffHours !== 1 ? 's' : ''}.`;
    }
  }

  return `Você pode enviar mais ${remaining} arquivo${remaining !== 1 ? 's' : ''} nesta hora.`;
}

/**
 * Validates attachment before upload
 *
 * @param params - Upload parameters
 * @returns Validation result
 */
export function validateAttachmentUpload(params: {
  file_name: string;
  file_type: FileType;
  file_size: number;
}): { valid: boolean; error?: string } {
  if (!params.file_name || params.file_name.trim().length === 0) {
    return { valid: false, error: 'Nome do arquivo é obrigatório' };
  }

  if (params.file_name.length > 255) {
    return { valid: false, error: 'Nome do arquivo muito longo (máximo 255 caracteres)' };
  }

  if (!['pdf', 'image'].includes(params.file_type)) {
    return { valid: false, error: 'Tipo de arquivo inválido. Use "pdf" ou "image"' };
  }

  if (params.file_size <= 0) {
    return { valid: false, error: 'Tamanho do arquivo inválido' };
  }

  if (params.file_size > 10485760) {
    return { valid: false, error: 'Arquivo muito grande. Tamanho máximo: 10MB' };
  }

  return { valid: true };
}

/**
 * Gets attachment download URL with signed URL
 *
 * @param supabase - Supabase client instance
 * @param bucketName - Storage bucket name
 * @param filePath - Path to file in storage
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or null
 */
export async function getAttachmentDownloadUrl(
  supabase: SupabaseClient,
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}
