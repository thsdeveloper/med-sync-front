/**
 * useChatMessages Hook
 *
 * React Query hook for fetching chat messages with attachments.
 * Includes caching, deduplication, and admin message support.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@medsync/shared/query';
import { queryConfig } from '@medsync/shared/query/query-config';
import type { ChatAttachment, MessageWithSender } from '@medsync/shared';

// Extended message type that includes admin_sender_id from database
export interface EnrichedMessage extends MessageWithSender {
  admin_sender_id?: string | null;
}

export interface UseChatMessagesOptions {
  enabled?: boolean;
  userId?: string;
  staffId?: string | null;
}

export interface UseChatMessagesResult {
  messages: EnrichedMessage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addMessage: (message: EnrichedMessage) => void;
  removeMessage: (messageId: string) => void;
  updateMessageAttachment: (attachmentId: string, updatedAttachment: ChatAttachment) => void;
}

/**
 * Associates attachments to messages based on message_id or time proximity
 */
function associateAttachmentsToMessages(
  messagesData: any[],
  attachmentsData: ChatAttachment[]
): any[] {
  const assignedAttachmentIds = new Set<string>();

  return messagesData.map((msg) => {
    let msgAttachments = attachmentsData.filter(
      (a) => a.message_id === msg.id && !assignedAttachmentIds.has(a.id)
    );

    // Fallback: associate by time proximity for "Anexo enviado" messages
    if (msgAttachments.length === 0 && msg.content?.includes('Anexo enviado')) {
      const msgTime = new Date(msg.created_at).getTime();
      msgAttachments = attachmentsData.filter((a) => {
        if (assignedAttachmentIds.has(a.id)) return false;
        if (a.message_id !== null) return false;
        const attTime = new Date(a.created_at).getTime();
        const timeDiff = Math.abs(attTime - msgTime);
        const senderMatch = a.sender_id === msg.sender_id;
        return senderMatch && timeDiff < 10000;
      });
    }

    msgAttachments.forEach((a) => assignedAttachmentIds.add(a.id));
    return { ...msg, attachments: msgAttachments };
  });
}

/**
 * Enriches messages with is_own flag and admin sender info
 */
function enrichMessages(
  messages: any[],
  userId: string | undefined,
  staffId: string | null
): EnrichedMessage[] {
  return messages.map((msg) => {
    if (msg.admin_sender_id && !msg.sender_id) {
      return {
        ...msg,
        sender: { id: msg.admin_sender_id, name: 'Administrador', color: '#6366F1' },
        is_own: msg.admin_sender_id === userId,
      };
    }
    return { ...msg, is_own: msg.sender_id === staffId };
  });
}

/**
 * Hook to fetch chat messages with caching and deduplication
 */
export function useChatMessages(
  conversationId: string,
  options?: UseChatMessagesOptions
): UseChatMessagesResult {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { enabled = true, userId, staffId } = options || {};

  const queryKey = queryKeys.chat.messages.list(conversationId, {});

  const { data, isLoading, error, refetch: queryRefetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`*, sender:medical_staff (id, name, color, avatar_url)`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw new Error(`Failed to load messages: ${messagesError.message}`);
      }

      // Fetch attachments
      const { data: attachmentsData } = await supabase
        .from('chat_attachments')
        .select(`
          id, conversation_id, message_id, sender_id, file_name, file_type,
          file_path, file_size, status, rejected_reason, reviewed_by, reviewed_at, created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // Associate and enrich
      const messagesWithAttachments = associateAttachmentsToMessages(
        messagesData || [],
        attachmentsData || []
      );

      return enrichMessages(messagesWithAttachments, userId, staffId ?? null);
    },
    enabled: enabled && !!conversationId,
    staleTime: queryConfig.realtime.staleTime,
    gcTime: queryConfig.realtime.gcTime,
    refetchOnWindowFocus: queryConfig.realtime.refetchOnWindowFocus,
  });

  // Refetch wrapper
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Add message to cache (for realtime updates)
  const addMessage = useCallback(
    (message: EnrichedMessage) => {
      queryClient.setQueryData<EnrichedMessage[]>(queryKey, (old) => {
        if (!old) return [message];
        // Avoid duplicates
        if (old.some((m) => m.id === message.id)) {
          return old.map((m) => (m.id === message.id ? message : m));
        }
        return [...old, message];
      });
    },
    [queryClient, queryKey]
  );

  // Remove message from cache
  const removeMessage = useCallback(
    (messageId: string) => {
      queryClient.setQueryData<EnrichedMessage[]>(queryKey, (old) => {
        if (!old) return old;
        return old.filter((m) => m.id !== messageId);
      });
    },
    [queryClient, queryKey]
  );

  // Update attachment in message
  const updateMessageAttachment = useCallback(
    (attachmentId: string, updatedAttachment: ChatAttachment) => {
      queryClient.setQueryData<EnrichedMessage[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((msg) => {
          if (!msg.attachments?.length) return msg;
          const hasAttachment = msg.attachments.some((att) => att.id === attachmentId);
          if (!hasAttachment) return msg;
          return {
            ...msg,
            attachments: msg.attachments.map((att) =>
              att.id === attachmentId ? updatedAttachment : att
            ),
          };
        });
      });
    },
    [queryClient, queryKey]
  );

  return {
    messages: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
    addMessage,
    removeMessage,
    updateMessageAttachment,
  };
}
