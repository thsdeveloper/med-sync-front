/**
 * useAttachmentReview Hook
 *
 * Custom React hook for managing document attachment review operations.
 * Uses React Query for state management and optimistic updates.
 *
 * Features:
 * - Accept attachment mutation
 * - Reject attachment mutation with rejection reason
 * - Optimistic UI updates for instant feedback
 * - Automatic cache invalidation and refetch
 * - Error handling with toast notifications
 * - Loading states for each operation
 *
 * @hook
 * @example
 * ```tsx
 * const { acceptAttachment, rejectAttachment, isAccepting, isRejecting } = useAttachmentReview();
 *
 * const handleAccept = () => {
 *   acceptAttachment(
 *     { attachmentId: attachment.id },
 *     {
 *       onSuccess: () => toast.success('Documento aprovado'),
 *       onError: (error) => toast.error(error.message),
 *     }
 *   );
 * };
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ChatAttachment } from '@medsync/shared';

interface AcceptAttachmentParams {
  attachmentId: string;
}

interface RejectAttachmentParams {
  attachmentId: string;
  rejectionReason: string;
}

interface AttachmentUpdateResponse {
  success: boolean;
  attachment?: ChatAttachment;
  error?: string;
}

/**
 * Accept an attachment by calling the RPC function
 */
async function acceptAttachment({
  attachmentId,
}: AcceptAttachmentParams): Promise<AttachmentUpdateResponse> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.rpc('update_attachment_status', {
      p_attachment_id: attachmentId,
      p_status: 'accepted',
      p_rejected_reason: null,
    });

    if (error) {
      console.error('Error accepting attachment:', error);
      return {
        success: false,
        error: error.message || 'Erro ao aprovar documento',
      };
    }

    return {
      success: true,
      attachment: data as ChatAttachment,
    };
  } catch (err) {
    console.error('Unexpected error accepting attachment:', err);
    return {
      success: false,
      error: 'Erro inesperado ao aprovar documento',
    };
  }
}

/**
 * Reject an attachment with a reason by calling the RPC function
 */
async function rejectAttachment({
  attachmentId,
  rejectionReason,
}: RejectAttachmentParams): Promise<AttachmentUpdateResponse> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.rpc('update_attachment_status', {
      p_attachment_id: attachmentId,
      p_status: 'rejected',
      p_rejected_reason: rejectionReason,
    });

    if (error) {
      console.error('Error rejecting attachment:', error);
      return {
        success: false,
        error: error.message || 'Erro ao rejeitar documento',
      };
    }

    return {
      success: true,
      attachment: data as ChatAttachment,
    };
  } catch (err) {
    console.error('Unexpected error rejecting attachment:', err);
    return {
      success: false,
      error: 'Erro inesperado ao rejeitar documento',
    };
  }
}

/**
 * Hook for managing attachment review operations
 */
export function useAttachmentReview() {
  const queryClient = useQueryClient();

  // Accept mutation with optimistic updates
  const acceptMutation = useMutation({
    mutationFn: acceptAttachment,
    onMutate: async ({ attachmentId }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['chat', 'messages'] });

      // Snapshot the previous value for rollback
      const previousMessages = queryClient.getQueryData(['chat', 'messages']);

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ['chat', 'messages'] }, (old: any) => {
        if (!old) return old;

        // Update attachment status in cached data
        return {
          ...old,
          pages: old.pages?.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: any) => ({
              ...msg,
              attachments: msg.attachments?.map((att: ChatAttachment) =>
                att.id === attachmentId
                  ? { ...att, status: 'accepted' as const }
                  : att
              ),
            })),
          })),
        };
      });

      // Return context with previous value for rollback
      return { previousMessages };
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate chat queries to refetch messages with updated attachments
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

        toast.success('Documento aprovado com sucesso');
      } else {
        toast.error(response.error || 'Erro ao aprovar documento');
      }
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat', 'messages'], context.previousMessages);
      }

      console.error('Accept mutation error:', error);
      toast.error('Erro ao aprovar documento. Tente novamente.');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
    },
  });

  // Reject mutation with optimistic updates
  const rejectMutation = useMutation({
    mutationFn: rejectAttachment,
    onMutate: async ({ attachmentId, rejectionReason }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['chat', 'messages'] });

      // Snapshot the previous value for rollback
      const previousMessages = queryClient.getQueryData(['chat', 'messages']);

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ['chat', 'messages'] }, (old: any) => {
        if (!old) return old;

        // Update attachment status in cached data
        return {
          ...old,
          pages: old.pages?.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: any) => ({
              ...msg,
              attachments: msg.attachments?.map((att: ChatAttachment) =>
                att.id === attachmentId
                  ? { ...att, status: 'rejected' as const, rejected_reason: rejectionReason }
                  : att
              ),
            })),
          })),
        };
      });

      // Return context with previous value for rollback
      return { previousMessages };
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate chat queries to refetch messages with updated attachments
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

        toast.success('Documento rejeitado');
      } else {
        toast.error(response.error || 'Erro ao rejeitar documento');
      }
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat', 'messages'], context.previousMessages);
      }

      console.error('Reject mutation error:', error);
      toast.error('Erro ao rejeitar documento. Tente novamente.');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
    },
  });

  return {
    /**
     * Accept an attachment
     */
    acceptAttachment: acceptMutation.mutate,

    /**
     * Reject an attachment with a reason
     */
    rejectAttachment: rejectMutation.mutate,

    /**
     * Whether an accept operation is in progress
     */
    isAccepting: acceptMutation.isPending,

    /**
     * Whether a reject operation is in progress
     */
    isRejecting: rejectMutation.isPending,

    /**
     * Whether any operation is in progress
     */
    isLoading: acceptMutation.isPending || rejectMutation.isPending,

    /**
     * Error from accept mutation
     */
    acceptError: acceptMutation.error,

    /**
     * Error from reject mutation
     */
    rejectError: rejectMutation.error,
  };
}
