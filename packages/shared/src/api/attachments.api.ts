/**
 * Attachments API Functions
 *
 * Platform-agnostic API functions for chat attachment operations.
 * Handles file uploads, status updates, and deletion.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ChatAttachment,
  AttachmentStatus,
  FileType,
  UpdateAttachmentStatusData,
} from '../schemas/chat.schema';
import { MAX_FILE_SIZE, ALLOWED_FILE_EXTENSIONS } from '../schemas/chat.schema';

// ============================================
// TYPES
// ============================================

export interface UploadAttachmentParams {
  conversationId: string;
  messageId?: string | null;
  senderId: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  filePath: string;
}

export interface UploadFileParams {
  bucket: string;
  path: string;
  file: Blob | ArrayBuffer;
  contentType: string;
}

export interface UpdateAttachmentStatusParams {
  attachmentId: string;
  status: 'accepted' | 'rejected';
  rejectedReason?: string | null;
  reviewerId: string;
}

export interface GetAttachmentsParams {
  conversationId?: string;
  messageId?: string;
  status?: AttachmentStatus;
  limit?: number;
}

export interface AttachmentUploadResult {
  attachment: ChatAttachment;
  publicUrl: string;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate file before upload
 */
export function validateFile(
  fileName: string,
  fileSize: number
): { valid: boolean; error?: string } {
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file extension
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext) {
    return { valid: false, error: 'Nome de arquivo inválido' };
  }

  const allExtensions: string[] = [
    ...ALLOWED_FILE_EXTENSIONS.pdf,
    ...ALLOWED_FILE_EXTENSIONS.image,
  ];

  if (!allExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Use PDF, JPG, JPEG, PNG ou GIF',
    };
  }

  return { valid: true };
}

/**
 * Determine file type from extension
 */
export function getFileTypeFromName(fileName: string): FileType {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  const pdfExtensions: readonly string[] = ALLOWED_FILE_EXTENSIONS.pdf;
  return pdfExtensions.includes(ext) ? 'pdf' : 'image';
}

/**
 * Generate storage path for attachment
 */
export function generateStoragePath(
  organizationId: string,
  conversationId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${organizationId}/${conversationId}/${timestamp}_${sanitizedName}`;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get attachments with optional filters
 */
export async function getAttachments(
  supabase: SupabaseClient,
  params: GetAttachmentsParams
): Promise<ChatAttachment[]> {
  const { conversationId, messageId, status, limit = 50 } = params;

  let query = supabase
    .from('chat_attachments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (conversationId) {
    query = query.eq('conversation_id', conversationId);
  }

  if (messageId) {
    query = query.eq('message_id', messageId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get attachments: ${error.message}`);
  }

  return data as ChatAttachment[];
}

/**
 * Get pending attachments for admin review
 */
export async function getPendingAttachments(
  supabase: SupabaseClient,
  organizationId: string,
  limit = 50
): Promise<ChatAttachment[]> {
  const { data, error } = await supabase
    .from('chat_attachments')
    .select(`
      *,
      conversation:chat_conversations!inner (
        organization_id
      )
    `)
    .eq('status', 'pending')
    .eq('conversation.organization_id', organizationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get pending attachments: ${error.message}`);
  }

  return data as ChatAttachment[];
}

/**
 * Get a single attachment by ID
 */
export async function getAttachmentById(
  supabase: SupabaseClient,
  attachmentId: string
): Promise<ChatAttachment | null> {
  const { data, error } = await supabase
    .from('chat_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get attachment: ${error.message}`);
  }

  return data as ChatAttachment;
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Upload a file to storage
 */
export async function uploadFileToStorage(
  supabase: SupabaseClient,
  params: UploadFileParams
): Promise<{ path: string; publicUrl: string }> {
  const { bucket, path, file, contentType } = params;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Create attachment record in database
 */
export async function createAttachmentRecord(
  supabase: SupabaseClient,
  params: UploadAttachmentParams
): Promise<ChatAttachment> {
  const { conversationId, messageId, senderId, fileName, fileType, fileSize, filePath } = params;

  const { data, error } = await supabase
    .from('chat_attachments')
    .insert({
      conversation_id: conversationId,
      message_id: messageId || null,
      sender_id: senderId,
      file_name: fileName,
      file_type: fileType,
      file_path: filePath,
      file_size: fileSize,
      status: 'pending', // All uploads start as pending
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create attachment record: ${error.message}`);
  }

  return data as ChatAttachment;
}

/**
 * Update attachment status (accept/reject)
 */
export async function updateAttachmentStatus(
  supabase: SupabaseClient,
  params: UpdateAttachmentStatusParams
): Promise<ChatAttachment> {
  const { attachmentId, status, rejectedReason, reviewerId } = params;

  // Validate rejection reason is provided when rejecting
  if (status === 'rejected' && (!rejectedReason || rejectedReason.trim().length === 0)) {
    throw new Error('Motivo da rejeição é obrigatório');
  }

  const { data, error } = await supabase
    .from('chat_attachments')
    .update({
      status,
      rejected_reason: status === 'rejected' ? rejectedReason : null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', attachmentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update attachment status: ${error.message}`);
  }

  return data as ChatAttachment;
}

/**
 * Delete an attachment (storage + database record)
 */
export async function deleteAttachment(
  supabase: SupabaseClient,
  attachmentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Get attachment to verify ownership and get file path
  const { data: attachment, error: fetchError } = await supabase
    .from('chat_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single();

  if (fetchError || !attachment) {
    return { success: false, error: 'Anexo não encontrado' };
  }

  // Verify ownership
  if (attachment.sender_id !== userId) {
    return { success: false, error: 'Você não pode deletar anexos de outros usuários' };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('chat-attachments')
    .remove([attachment.file_path]);

  // Continue with database deletion even if storage fails
  // Storage error is not critical for the operation

  // Delete from database
  const { error: deleteError } = await supabase
    .from('chat_attachments')
    .delete()
    .eq('id', attachmentId);

  if (deleteError) {
    return { success: false, error: `Erro ao deletar: ${deleteError.message}` };
  }

  return { success: true };
}

/**
 * Get signed URL for downloading attachment
 */
export async function getAttachmentDownloadUrl(
  supabase: SupabaseClient,
  filePath: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to create download URL: ${error.message}`);
  }

  return data.signedUrl;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileType: FileType): string {
  return fileType === 'pdf' ? '📄' : '🖼️';
}
