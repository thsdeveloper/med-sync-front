/**
 * Chat Mutation Hooks
 *
 * React Query mutation hooks for chat operations.
 * Platform-agnostic - accepts Supabase client as parameter.
 *
 * Note: UI callbacks (toasts, alerts) should be provided by the consuming
 * component, not defined here, to maintain platform independence.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { queryKeys } from '../../query';
import { mutationConfig } from '../../query/query-config';
import {
  sendMessage,
  deleteMessage,
  createConversation,
  markConversationAsRead,
  type SendMessageParams,
  type DeleteMessageParams,
} from '../../api/chat.api';
import type {
  ChatConversation,
  MessageWithSender,
  CreateConversationData,
} from '../../schemas/chat.schema';

// ============================================
// TYPES
// ============================================

export interface SendMessageMutationParams {
  conversationId: string;
  content: string;
}

export interface CreateConversationMutationParams extends CreateConversationData {}

// ============================================
// SEND MESSAGE
// ============================================

/**
 * Hook to send a message to a conversation
 *
 * @example
 * const { mutate: sendMessage, isPending } = useSendMessage(
 *   supabase,
 *   userId,
 *   organizationId
 * );
 *
 * sendMessage(
 *   { conversationId, content: 'Hello!' },
 *   {
 *     onSuccess: () => toast.success('Mensagem enviada!'),
 *     onError: (err) => toast.error(err.message),
 *   }
 * );
 */
export function useSendMessage(
  supabase: SupabaseClient,
  userId: string,
  organizationId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendMessageMutationParams): Promise<MessageWithSender> => {
      return sendMessage(supabase, {
        conversationId: params.conversationId,
        content: params.content,
        senderId: userId,
      });
    },

    // Optimistic update
    onMutate: async (variables) => {
      const { conversationId, content } = variables;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.chat.messages.list(conversationId, {}),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.chat.messages.infinite(conversationId),
      });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(
        queryKeys.chat.messages.list(conversationId, {})
      );

      // Optimistically add the new message
      const optimisticMessage: MessageWithSender = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: userId,
        content,
        created_at: new Date().toISOString(),
        is_own: true,
      };

      queryClient.setQueryData(
        queryKeys.chat.messages.list(conversationId, {}),
        (old: MessageWithSender[] | undefined) => {
          return old ? [...old, optimisticMessage] : [optimisticMessage];
        }
      );

      return { previousMessages, conversationId };
    },

    onSuccess: (newMessage, variables) => {
      const { conversationId } = variables;

      // Replace optimistic message with real one
      queryClient.setQueryData(
        queryKeys.chat.messages.list(conversationId, {}),
        (old: MessageWithSender[] | undefined) => {
          if (!old) return [newMessage];
          return old.map((msg) =>
            msg.id.startsWith('temp-') ? newMessage : msg
          );
        }
      );

      // Invalidate conversations list to update last_message
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.conversations.list(userId, {}),
        });
      }
    },

    onError: (error, variables, context) => {
      // Rollback to previous messages
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages.list(context.conversationId, {}),
          context.previousMessages
        );
      }
    },

    ...mutationConfig.optimistic,
  });
}

// ============================================
// DELETE MESSAGE
// ============================================

/**
 * Hook to delete a message
 *
 * @example
 * const { mutate: deleteMsg } = useDeleteMessage(supabase, { staffId: 'xxx' });
 * // OR for admins without staff record:
 * const { mutate: deleteMsg } = useDeleteMessage(supabase, { adminUserId: 'xxx' });
 *
 * deleteMsg(
 *   { messageId, conversationId },
 *   {
 *     onSuccess: (result) => {
 *       if (result.success) toast.success('Mensagem excluída!');
 *       else toast.error(result.error);
 *     }
 *   }
 * );
 */
export function useDeleteMessage(
  supabase: SupabaseClient,
  userIds: string | { staffId?: string; adminUserId?: string }
) {
  const queryClient = useQueryClient();

  // Support legacy string parameter (staffId) or new object format
  const { staffId, adminUserId } =
    typeof userIds === 'string'
      ? { staffId: userIds, adminUserId: undefined }
      : userIds;

  return useMutation({
    mutationFn: async (params: { messageId: string; conversationId: string }) => {
      return deleteMessage(supabase, {
        messageId: params.messageId,
        senderId: staffId,
        adminSenderId: adminUserId,
      });
    },

    // Optimistic update
    onMutate: async (variables) => {
      const { messageId, conversationId } = variables;

      await queryClient.cancelQueries({
        queryKey: queryKeys.chat.messages.list(conversationId, {}),
      });

      const previousMessages = queryClient.getQueryData(
        queryKeys.chat.messages.list(conversationId, {})
      );

      // Optimistically remove the message
      queryClient.setQueryData(
        queryKeys.chat.messages.list(conversationId, {}),
        (old: MessageWithSender[] | undefined) => {
          return old ? old.filter((msg) => msg.id !== messageId) : [];
        }
      );

      return { previousMessages, conversationId };
    },

    onSuccess: (result, variables) => {
      if (!result.success) {
        // If deletion failed, rollback will happen in onError
        throw new Error(result.error);
      }

      // Invalidate conversation to update last_message
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations.detail(variables.conversationId),
      });
    },

    onError: (error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages.list(context.conversationId, {}),
          context.previousMessages
        );
      }
    },

    ...mutationConfig.optimistic,
  });
}

// ============================================
// CREATE CONVERSATION
// ============================================

/**
 * Hook to create a new conversation
 *
 * @example
 * const { mutate: createConv } = useCreateConversation(supabase, userId);
 *
 * createConv(
 *   {
 *     organization_id: orgId,
 *     type: 'direct',
 *     participant_ids: [otherUserId]
 *   },
 *   {
 *     onSuccess: (conversation) => {
 *       router.push(`/chat/${conversation.id}`);
 *     }
 *   }
 * );
 */
export function useCreateConversation(supabase: SupabaseClient, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: CreateConversationMutationParams
    ): Promise<ChatConversation> => {
      return createConversation(supabase, {
        ...params,
        creatorId: userId,
      });
    },

    onSuccess: (newConversation) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations.all(),
      });

      // Set the new conversation in cache
      queryClient.setQueryData(
        queryKeys.chat.conversations.detail(newConversation.id),
        newConversation
      );
    },

    ...mutationConfig.standard,
  });
}

// ============================================
// MARK AS READ
// ============================================

/**
 * Hook to mark a conversation as read
 *
 * @example
 * const { mutate: markRead } = useMarkAsRead(supabase, userId);
 * markRead(conversationId);
 */
export function useMarkAsRead(supabase: SupabaseClient, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string): Promise<void> => {
      return markConversationAsRead(supabase, conversationId, userId);
    },

    onSuccess: (_, conversationId) => {
      // Update unread count in cache
      queryClient.setQueryData(
        queryKeys.chat.conversations.list(userId, {}),
        (old: any[] | undefined) => {
          if (!old) return old;
          return old.map((conv) =>
            conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
          );
        }
      );

      // Invalidate total unread count
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.chat.all, 'unread-count'],
      });
    },

    // Don't show errors for mark as read - it's not critical
    retry: 0,
  });
}
