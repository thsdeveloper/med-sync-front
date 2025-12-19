/**
 * useAttachmentReview Hook
 *
 * Wrapper around shared useUpdateAttachmentStatus hook with web-specific toast notifications.
 * Provides accept and reject operations for document attachments.
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

import { useState } from 'react';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { useUpdateAttachmentStatus } from '@medsync/shared/hooks';
import type { ChatAttachment } from '@medsync/shared';

interface AcceptAttachmentParams {
  attachmentId: string;
}

interface RejectAttachmentParams {
  attachmentId: string;
  rejectionReason: string;
}

/**
 * Hook for managing attachment review operations
 * Uses the shared hook with web-specific toast notifications
 */
export function useAttachmentReview() {
  const supabase = getSupabaseBrowserClient();
  const { user } = useSupabaseAuth();
  const { activeOrganization } = useOrganization();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const mutation = useUpdateAttachmentStatus(
    supabase,
    user?.id || '',
    activeOrganization?.id
  );

  const acceptAttachment = (
    params: AcceptAttachmentParams,
    options?: {
      onSuccess?: (attachment: ChatAttachment) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    setIsAccepting(true);
    mutation.mutate(
      {
        attachmentId: params.attachmentId,
        status: 'accepted',
      },
      {
        onSuccess: (attachment) => {
          toast.success('Documento aprovado com sucesso');
          setIsAccepting(false);
          options?.onSuccess?.(attachment);
        },
        onError: (error) => {
          console.error('Accept mutation error:', error);
          toast.error('Erro ao aprovar documento. Tente novamente.');
          setIsAccepting(false);
          options?.onError?.(error);
        },
      }
    );
  };

  const rejectAttachment = (
    params: RejectAttachmentParams,
    options?: {
      onSuccess?: (attachment: ChatAttachment) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    setIsRejecting(true);
    mutation.mutate(
      {
        attachmentId: params.attachmentId,
        status: 'rejected',
        rejectedReason: params.rejectionReason,
      },
      {
        onSuccess: (attachment) => {
          toast.success('Documento rejeitado');
          setIsRejecting(false);
          options?.onSuccess?.(attachment);
        },
        onError: (error) => {
          console.error('Reject mutation error:', error);
          toast.error('Erro ao rejeitar documento. Tente novamente.');
          setIsRejecting(false);
          options?.onError?.(error);
        },
      }
    );
  };

  return {
    /**
     * Accept an attachment
     */
    acceptAttachment,

    /**
     * Reject an attachment with a reason
     */
    rejectAttachment,

    /**
     * Whether an accept operation is in progress
     */
    isAccepting,

    /**
     * Whether a reject operation is in progress
     */
    isRejecting,

    /**
     * Whether any operation is in progress
     */
    isLoading: isAccepting || isRejecting || mutation.isPending,

    /**
     * Error from mutation
     */
    error: mutation.error,
  };
}
