/**
 * Chat Query Hooks
 *
 * React Query hooks for fetching chat data.
 * Platform-agnostic - accepts Supabase client as parameter.
 */

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { queryKeys, type ConversationFilters, type MessageFilters } from '../../query';
import { queryConfig } from '../../query/query-config';
import {
  getConversations,
  getConversationById,
  getMessages,
  getTotalUnreadCount,
  getSupportConversationsWithDetails,
  type GetConversationsParams,
  type GetMessagesParams,
} from '../../api/chat.api';
import type { ConversationWithDetails, MessageWithSender } from '../../schemas/chat.schema';

// ============================================
// TYPES
// ============================================

export interface UseConversationsOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  type?: 'direct' | 'group';
}

export interface UseConversationOptions {
  enabled?: boolean;
  staleTime?: number;
}

export interface UseSupportConversationsOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

export interface UseMessagesOptions {
  enabled?: boolean;
  staleTime?: number;
  limit?: number;
}

export interface UseUnreadCountOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

// ============================================
// CONVERSATIONS QUERIES
// ============================================

/**
 * Hook to fetch all conversations for a user
 *
 * @example
 * const { data: conversations, isLoading } = useConversations(
 *   supabase,
 *   userId,
 *   organizationId
 * );
 */
export function useConversations(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
  options?: UseConversationsOptions
) {
  const filters: ConversationFilters = {
    type: options?.type,
  };

  return useQuery({
    queryKey: queryKeys.chat.conversations.list(userId, filters),
    queryFn: () =>
      getConversations(supabase, {
        userId,
        organizationId,
        type: options?.type,
      }),
    enabled: options?.enabled ?? (!!userId && !!organizationId),
    staleTime: options?.staleTime ?? queryConfig.standard.staleTime,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? queryConfig.standard.refetchOnWindowFocus,
    gcTime: queryConfig.standard.gcTime,
    retry: queryConfig.standard.retry,
  });
}

/**
 * Hook to fetch a single conversation by ID
 *
 * @example
 * const { data: conversation } = useConversation(supabase, conversationId);
 */
export function useConversation(
  supabase: SupabaseClient,
  conversationId: string,
  options?: UseConversationOptions
) {
  return useQuery({
    queryKey: queryKeys.chat.conversations.detail(conversationId),
    queryFn: () => getConversationById(supabase, conversationId),
    enabled: options?.enabled ?? !!conversationId,
    staleTime: options?.staleTime ?? queryConfig.standard.staleTime,
    gcTime: queryConfig.standard.gcTime,
  });
}

/**
 * Hook to fetch support conversations with details using optimized SQL function.
 * Returns conversations with last_message, unread_count, and participants in a single query.
 *
 * @example
 * const { data: conversations, isLoading } = useSupportConversations(
 *   supabase,
 *   organizationId,
 *   userId
 * );
 */
export function useSupportConversations(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  options?: UseSupportConversationsOptions
) {
  return useQuery({
    queryKey: queryKeys.chat.conversations.support(organizationId, userId),
    queryFn: () =>
      getSupportConversationsWithDetails(supabase, {
        organizationId,
        userId,
      }),
    enabled: options?.enabled ?? (!!organizationId && !!userId),
    staleTime: options?.staleTime ?? queryConfig.standard.staleTime,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? queryConfig.standard.refetchOnWindowFocus,
    gcTime: queryConfig.standard.gcTime,
    retry: queryConfig.standard.retry,
  });
}

// ============================================
// MESSAGES QUERIES
// ============================================

/**
 * Hook to fetch messages for a conversation (simple, non-paginated)
 *
 * @example
 * const { data: messages } = useMessages(supabase, conversationId);
 */
export function useMessages(
  supabase: SupabaseClient,
  conversationId: string,
  options?: UseMessagesOptions
) {
  const filters: MessageFilters = {
    limit: options?.limit ?? 50,
  };

  return useQuery({
    queryKey: queryKeys.chat.messages.list(conversationId, filters),
    queryFn: async () => {
      const result = await getMessages(supabase, {
        conversationId,
        limit: options?.limit ?? 50,
      });
      return result.messages;
    },
    enabled: options?.enabled ?? !!conversationId,
    staleTime: options?.staleTime ?? queryConfig.realtime.staleTime,
    gcTime: queryConfig.realtime.gcTime,
    refetchOnWindowFocus: queryConfig.realtime.refetchOnWindowFocus,
  });
}

/**
 * Hook to fetch messages with infinite scroll pagination
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage
 * } = useMessagesInfinite(supabase, conversationId);
 *
 * // Access all messages
 * const allMessages = data?.pages.flatMap(page => page.messages) ?? [];
 */
export function useMessagesInfinite(
  supabase: SupabaseClient,
  conversationId: string,
  options?: UseMessagesOptions
) {
  const limit = options?.limit ?? 30;

  return useInfiniteQuery({
    queryKey: queryKeys.chat.messages.infinite(conversationId),
    queryFn: async ({ pageParam }) => {
      return getMessages(supabase, {
        conversationId,
        limit,
        before: pageParam as string | undefined,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled: options?.enabled ?? !!conversationId,
    staleTime: options?.staleTime ?? queryConfig.infinite.staleTime,
    gcTime: queryConfig.infinite.gcTime,
    maxPages: queryConfig.infinite.maxPages,
  });
}

// ============================================
// UNREAD COUNT QUERIES
// ============================================

/**
 * Hook to fetch total unread message count
 *
 * @example
 * const { data: unreadCount } = useUnreadCount(
 *   supabase,
 *   userId,
 *   organizationId,
 *   { refetchInterval: 30000 }
 * );
 */
export function useUnreadCount(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string,
  options?: UseUnreadCountOptions
) {
  return useQuery({
    queryKey: [...queryKeys.chat.all, 'unread-count', userId, organizationId],
    queryFn: () => getTotalUnreadCount(supabase, userId, organizationId),
    enabled: options?.enabled ?? (!!userId && !!organizationId),
    staleTime: queryConfig.realtime.staleTime,
    gcTime: queryConfig.realtime.gcTime,
    refetchInterval: options?.refetchInterval,
  });
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook to prefetch a conversation's messages
 * Useful when hovering over a conversation in the list
 */
export function usePrefetchMessages(supabase: SupabaseClient) {
  const queryClient = useQueryClient();

  return async (conversationId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.chat.messages.list(conversationId, {}),
      queryFn: () => getMessages(supabase, { conversationId, limit: 30 }),
      staleTime: queryConfig.standard.staleTime,
    });
  };
}

/**
 * Hook to invalidate chat queries
 * Useful when receiving realtime updates
 */
export function useInvalidateChatQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateConversations: (userId?: string) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.conversations.list(userId, {}),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.conversations.all(),
        });
      }
    },

    invalidateMessages: (conversationId: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages.list(conversationId, {}),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages.infinite(conversationId),
      });
    },

    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.all,
      });
    },
  };
}
