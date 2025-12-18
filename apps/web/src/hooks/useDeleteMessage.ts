/**
 * useDeleteMessage Hook
 *
 * Custom React hook for deleting chat messages and their associated attachments.
 * Uses React Query for state management and handles storage cleanup.
 *
 * Features:
 * - Delete message mutation via RPC
 * - Automatic storage cleanup for attachments
 * - Toast notifications for success/error
 * - Loading states
 *
 * @hook
 * @example
 * ```tsx
 * const { deleteMessage, isDeleting } = useDeleteMessage();
 *
 * const handleDelete = () => {
 *   deleteMessage(
 *     { messageId: message.id },
 *     {
 *       onSuccess: () => {
 *         // Handle success (e.g., remove from local state)
 *       },
 *     }
 *   );
 * };
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { deleteMultipleFilesFromStorage } from '@medsync/shared';

const STORAGE_BUCKET = 'chat-documents';

interface DeleteMessageParams {
  messageId: string;
}

interface DeletedAttachment {
  id: string;
  file_path: string;
}

interface DeleteMessageRPCResponse {
  success: boolean;
  deleted_message_id?: string;
  deleted_attachments?: DeletedAttachment[];
  message?: string;
  error?: string;
}

interface DeleteMessageResponse {
  success: boolean;
  deletedMessageId?: string;
  deletedAttachments?: DeletedAttachment[];
  error?: string;
}

/**
 * Delete a message by calling the RPC function and cleaning up storage
 */
async function deleteMessageFn({
  messageId,
}: DeleteMessageParams): Promise<DeleteMessageResponse> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Call RPC function to delete message and get file paths
    const { data, error } = await supabase.rpc('delete_chat_message', {
      p_message_id: messageId,
    });

    if (error) {
      console.error('Error deleting message:', error);
      return {
        success: false,
        error: error.message || 'Erro ao excluir mensagem',
      };
    }

    const rpcResponse = data as DeleteMessageRPCResponse;

    if (!rpcResponse.success) {
      return {
        success: false,
        error: rpcResponse.error || 'Erro ao excluir mensagem',
      };
    }

    // Delete files from storage if there were attachments
    if (rpcResponse.deleted_attachments && rpcResponse.deleted_attachments.length > 0) {
      const filePaths = rpcResponse.deleted_attachments.map((a) => a.file_path);

      const storageResult = await deleteMultipleFilesFromStorage(
        supabase,
        STORAGE_BUCKET,
        filePaths
      );

      // Log warning if storage deletion failed, but don't fail the operation
      // The database records are already deleted, which is the important part
      if (!storageResult.success) {
        console.warn('Failed to delete some files from storage:', storageResult.error);
      }
    }

    return {
      success: true,
      deletedMessageId: rpcResponse.deleted_message_id,
      deletedAttachments: rpcResponse.deleted_attachments,
    };
  } catch (err) {
    console.error('Unexpected error deleting message:', err);
    return {
      success: false,
      error: 'Erro inesperado ao excluir mensagem',
    };
  }
}

/**
 * Hook for deleting chat messages
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteMessageFn,
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate chat queries to refetch messages
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

        toast.success('Mensagem excluida com sucesso');
      } else {
        toast.error(response.error || 'Erro ao excluir mensagem');
      }
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      toast.error('Erro ao excluir mensagem. Tente novamente.');
    },
  });

  return {
    /**
     * Delete a message
     */
    deleteMessage: deleteMutation.mutate,

    /**
     * Delete a message (async version)
     */
    deleteMessageAsync: deleteMutation.mutateAsync,

    /**
     * Whether a delete operation is in progress
     */
    isDeleting: deleteMutation.isPending,

    /**
     * Error from delete mutation
     */
    deleteError: deleteMutation.error,
  };
}
