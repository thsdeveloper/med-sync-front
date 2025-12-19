/**
 * Attachment Mutation Hooks
 *
 * React Query mutation hooks for attachment operations.
 * Handles upload, status updates, and deletion.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { queryKeys } from '../../query';
import { mutationConfig } from '../../query/query-config';
import {
  uploadFileToStorage,
  createAttachmentRecord,
  updateAttachmentStatus,
  deleteAttachment,
  validateFile,
  getFileTypeFromName,
  generateStoragePath,
  type UpdateAttachmentStatusParams,
} from '../../api/attachments.api';
import type { ChatAttachment, FileType } from '../../schemas/chat.schema';

// ============================================
// TYPES
// ============================================

export interface UploadAttachmentParams {
  conversationId: string;
  organizationId: string;
  messageId?: string | null;
  file: {
    name: string;
    size: number;
    type: string;
    data: Blob | ArrayBuffer;
  };
  onProgress?: (progress: number) => void;
}

export interface UploadAttachmentResult {
  attachment: ChatAttachment;
  publicUrl: string;
}

export interface UpdateStatusParams {
  attachmentId: string;
  status: 'accepted' | 'rejected';
  rejectedReason?: string | null;
}

export interface DeleteAttachmentParams {
  attachmentId: string;
  conversationId: string;
}

// ============================================
// UPLOAD ATTACHMENT
// ============================================

/**
 * Hook to upload an attachment
 *
 * @example
 * const { mutate: upload, isPending } = useUploadAttachment(
 *   supabase,
 *   userId
 * );
 *
 * upload(
 *   {
 *     conversationId,
 *     organizationId,
 *     file: { name, size, type, data: blob }
 *   },
 *   {
 *     onSuccess: ({ attachment, publicUrl }) => {
 *       toast.success('Arquivo enviado!');
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   }
 * );
 */
export function useUploadAttachment(supabase: SupabaseClient, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: UploadAttachmentParams
    ): Promise<UploadAttachmentResult> => {
      const { conversationId, organizationId, messageId, file, onProgress } = params;

      // Validate file
      const validation = validateFile(file.name, file.size);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Determine file type
      const fileType = getFileTypeFromName(file.name);

      // Generate storage path
      const storagePath = generateStoragePath(organizationId, conversationId, file.name);

      // Report progress: starting
      onProgress?.(10);

      // Upload to storage
      const { path, publicUrl } = await uploadFileToStorage(supabase, {
        bucket: 'chat-attachments',
        path: storagePath,
        file: file.data,
        contentType: file.type,
      });

      // Report progress: uploaded
      onProgress?.(70);

      // Create database record
      const attachment = await createAttachmentRecord(supabase, {
        conversationId,
        messageId,
        senderId: userId,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        filePath: path,
      });

      // Report progress: complete
      onProgress?.(100);

      return { attachment, publicUrl };
    },

    onSuccess: (result, variables) => {
      const { conversationId } = variables;

      // Invalidate messages to show the new attachment
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages.list(conversationId, {}),
      });

      // Invalidate attachments list
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.attachments.list(conversationId),
      });
    },

    ...mutationConfig.standard,
  });
}

// ============================================
// UPDATE ATTACHMENT STATUS
// ============================================

/**
 * Hook to update attachment status (accept/reject)
 * Used by admins to review uploaded documents
 *
 * @example
 * const { mutate: updateStatus } = useUpdateAttachmentStatus(
 *   supabase,
 *   adminUserId,
 *   organizationId
 * );
 *
 * updateStatus(
 *   { attachmentId, status: 'accepted' },
 *   {
 *     onSuccess: () => toast.success('Documento aprovado!'),
 *   }
 * );
 */
export function useUpdateAttachmentStatus(
  supabase: SupabaseClient,
  reviewerId: string,
  organizationId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateStatusParams): Promise<ChatAttachment> => {
      return updateAttachmentStatus(supabase, {
        attachmentId: params.attachmentId,
        status: params.status,
        rejectedReason: params.rejectedReason,
        reviewerId,
      });
    },

    // Optimistic update
    onMutate: async (variables) => {
      const { attachmentId, status } = variables;

      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.chat.attachments.all(),
      });

      // Snapshot
      const previousPending = queryClient.getQueryData(
        queryKeys.chat.attachments.pending(organizationId || '')
      );

      // Optimistically remove from pending list
      if (organizationId) {
        queryClient.setQueryData(
          queryKeys.chat.attachments.pending(organizationId),
          (old: ChatAttachment[] | undefined) => {
            return old ? old.filter((a) => a.id !== attachmentId) : [];
          }
        );
      }

      return { previousPending };
    },

    onSuccess: (updatedAttachment) => {
      // Update the attachment in detail cache
      queryClient.setQueryData(
        queryKeys.chat.attachments.detail(updatedAttachment.id),
        updatedAttachment
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages.list(updatedAttachment.conversation_id, {}),
      });

      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.attachments.pending(organizationId),
        });
      }
    },

    onError: (error, variables, context) => {
      // Rollback pending list
      if (context?.previousPending && organizationId) {
        queryClient.setQueryData(
          queryKeys.chat.attachments.pending(organizationId),
          context.previousPending
        );
      }
    },

    ...mutationConfig.optimistic,
  });
}

// ============================================
// DELETE ATTACHMENT
// ============================================

/**
 * Hook to delete an attachment
 *
 * @example
 * const { mutate: deleteAtt } = useDeleteAttachment(supabase, userId);
 *
 * deleteAtt(
 *   { attachmentId, conversationId },
 *   {
 *     onSuccess: (result) => {
 *       if (result.success) toast.success('Anexo removido!');
 *       else toast.error(result.error);
 *     }
 *   }
 * );
 */
export function useDeleteAttachment(supabase: SupabaseClient, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: DeleteAttachmentParams
    ): Promise<{ success: boolean; error?: string }> => {
      return deleteAttachment(supabase, params.attachmentId, userId);
    },

    // Optimistic update
    onMutate: async (variables) => {
      const { attachmentId, conversationId } = variables;

      await queryClient.cancelQueries({
        queryKey: queryKeys.chat.attachments.list(conversationId),
      });

      const previousAttachments = queryClient.getQueryData(
        queryKeys.chat.attachments.list(conversationId)
      );

      // Optimistically remove
      queryClient.setQueryData(
        queryKeys.chat.attachments.list(conversationId),
        (old: ChatAttachment[] | undefined) => {
          return old ? old.filter((a) => a.id !== attachmentId) : [];
        }
      );

      return { previousAttachments, conversationId };
    },

    onSuccess: (result, variables) => {
      if (!result.success) {
        throw new Error(result.error);
      }

      // Invalidate messages to update attachment display
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages.list(variables.conversationId, {}),
      });
    },

    onError: (error, variables, context) => {
      if (context?.previousAttachments) {
        queryClient.setQueryData(
          queryKeys.chat.attachments.list(context.conversationId),
          context.previousAttachments
        );
      }
    },

    ...mutationConfig.optimistic,
  });
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Hook to accept multiple attachments at once
 */
export function useBatchAcceptAttachments(
  supabase: SupabaseClient,
  reviewerId: string,
  organizationId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentIds: string[]): Promise<ChatAttachment[]> => {
      const results = await Promise.all(
        attachmentIds.map((id) =>
          updateAttachmentStatus(supabase, {
            attachmentId: id,
            status: 'accepted',
            reviewerId,
          })
        )
      );
      return results;
    },

    onSuccess: () => {
      // Invalidate pending attachments
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.attachments.pending(organizationId),
      });

      // Invalidate all messages (multiple conversations may be affected)
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages.all(),
      });
    },

    ...mutationConfig.critical,
  });
}
