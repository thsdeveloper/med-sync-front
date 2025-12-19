/**
 * useDeleteMessage Hook
 *
 * Wrapper around shared useDeleteMessage hook with web-specific toast notifications.
 * Uses React Query for state management and handles storage cleanup.
 *
 * @hook
 * @example
 * ```tsx
 * const { deleteMessage, isDeleting } = useDeleteMessage();
 *
 * const handleDelete = () => {
 *   deleteMessage(
 *     { messageId: message.id, conversationId: conversation.id },
 *     {
 *       onSuccess: () => {
 *         // Handle success (e.g., remove from local state)
 *       },
 *     }
 *   );
 * };
 * ```
 */

import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { useDeleteMessage as useSharedDeleteMessage } from '@medsync/shared/hooks';
import { useEffect, useState } from 'react';

/**
 * Hook for deleting chat messages
 * Uses the shared hook with web-specific toast notifications
 */
export function useDeleteMessage() {
  const supabase = getSupabaseBrowserClient();
  const { user } = useSupabaseAuth();
  const [staffId, setStaffId] = useState<string | null>(null);

  // Get staff ID for current user
  useEffect(() => {
    const getStaffId = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('medical_staff')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setStaffId(data.id);
      }
    };
    getStaffId();
  }, [user?.id, supabase]);

  // Pass both staffId (for medical_staff users) and user.id (for admin users)
  const mutation = useSharedDeleteMessage(supabase, {
    staffId: staffId || undefined,
    adminUserId: user?.id,
  });

  return {
    /**
     * Delete a message
     */
    deleteMessage: (
      params: { messageId: string; conversationId: string },
      options?: {
        onSuccess?: (result: { success: boolean; error?: string }) => void;
        onError?: (error: Error) => void;
      }
    ) => {
      if (!staffId && !user?.id) {
        toast.error('Aguarde, carregando dados do usuário...');
        return;
      }
      mutation.mutate(params, {
        onSuccess: (result) => {
          if (result.success) {
            toast.success('Mensagem excluída com sucesso');
          } else {
            toast.error(result.error || 'Erro ao excluir mensagem');
          }
          options?.onSuccess?.(result);
        },
        onError: (error) => {
          console.error('Delete mutation error:', error);
          toast.error('Erro ao excluir mensagem. Tente novamente.');
          options?.onError?.(error);
        },
      });
    },

    /**
     * Delete a message (async version)
     */
    deleteMessageAsync: mutation.mutateAsync,

    /**
     * Whether a delete operation is in progress
     */
    isDeleting: mutation.isPending,

    /**
     * Whether the hook is ready to delete (staffId or user.id available)
     */
    isReady: !!(staffId || user?.id),

    /**
     * Error from delete mutation
     */
    deleteError: mutation.error,
  };
}
