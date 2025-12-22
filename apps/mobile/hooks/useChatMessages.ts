/**
 * useChatMessages Hook
 *
 * Combines React Query with Supabase Realtime for optimal chat experience.
 * Uses shared hooks for mutations while maintaining realtime updates.
 *
 * ARCHITECTURE:
 * - Uses React Query as single source of truth (no duplicate useState)
 * - Updates cache directly via queryClient.setQueryData
 * - Handles conversation transitions with isTransitioning state
 * - Debounces markAsRead calls to prevent excessive DB writes
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useUnreadCount } from '@/providers/unread-count-provider';
import {
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useMarkAsRead,
  useAttachmentRealtime,
  useInvalidateChatQueries,
} from '@medsync/shared/hooks';
import { queryKeys, queryConfig } from '@medsync/shared/query';
import type { MessageWithSender, ChatAttachment } from '@medsync/shared';

// Extended message type that includes admin_sender_id from database
interface EnrichedMessage extends MessageWithSender {
  admin_sender_id?: string | null;
}

// Admin info cache type
interface AdminInfo {
  id: string;
  name: string;
  email: string;
}

interface UseChatMessagesOptions {
  conversationId: string;
  enabled?: boolean;
}

// Debounce delay for markAsRead calls (Fase 4)
const MARK_AS_READ_DEBOUNCE_MS = 500;

/**
 * Fetches admin user info from database
 * Uses the get_admin_sender_info RPC function
 */
async function fetchAdminInfo(adminId: string): Promise<AdminInfo | null> {
  try {
    const { data, error } = await supabase.rpc('get_admin_sender_info', {
      p_admin_user_id: adminId,
    });

    if (error || !data || data.length === 0) {
      console.warn('[useChatMessages] Failed to fetch admin info:', error?.message);
      return null;
    }

    return data[0] as AdminInfo;
  } catch (err) {
    console.error('[useChatMessages] Error fetching admin info:', err);
    return null;
  }
}

/**
 * Enriches messages with admin sender info when message is from admin
 * Admin messages have admin_sender_id set and sender_id null
 */
function enrichMessageWithAdminSender(
  msg: any,
  staffId: string | null,
  adminCache: Map<string, AdminInfo>
): EnrichedMessage {
  // Check if message is from admin (has admin_sender_id but no sender_id)
  if (msg.admin_sender_id && !msg.sender_id) {
    const adminInfo = adminCache.get(msg.admin_sender_id);
    const adminName = adminInfo?.name || 'Suporte';

    return {
      ...msg,
      sender: {
        id: msg.admin_sender_id,
        name: adminName,
        color: '#6366F1',
        avatar_url: null, // Admin avatar could be organization logo in the future
      },
      is_own: false, // Staff user is viewing, so admin messages are never "own"
    };
  }

  // Regular staff message
  return {
    ...msg,
    is_own: msg.sender_id === staffId,
  };
}

interface UseChatMessagesReturn {
  messages: EnrichedMessage[];
  isLoading: boolean;
  isSending: boolean;
  isDeleting: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  refetch: () => void;
}

/**
 * Hook that combines shared React Query hooks with Realtime subscriptions
 * for a seamless chat experience on mobile.
 *
 * Key improvements:
 * - Uses React Query as single source of truth (no duplicate useState)
 * - Handles conversation transitions with isTransitioning ref
 * - Debounces markAsRead calls
 */
export function useChatMessages({
  conversationId,
  enabled = true,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const { staff } = useAuth();
  const { refreshUnreadCount } = useUnreadCount();
  const { invalidateMessages } = useInvalidateChatQueries();
  const queryClient = useQueryClient();
  const adminCacheRef = useRef<Map<string, AdminInfo>>(new Map());

  // Transition state ref to prevent race conditions during conversation switches
  const isTransitioningRef = useRef(false);
  const currentConversationRef = useRef<string | null>(null);

  // Query key for this conversation's messages
  const queryKey = useMemo(
    () => queryKeys.chat.messages.list(conversationId, {}),
    [conversationId]
  );

  // Use shared query hook for initial data (Fase 6: use queryConfig.realtime.staleTime)
  const {
    data: messagesData,
    isLoading,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useMessages(supabase, conversationId, {
    enabled: enabled && !!conversationId && !isTransitioningRef.current,
    limit: 100,
    staleTime: queryConfig.realtime.staleTime, // Fase 6: Use 30s instead of 0
  });

  // Process and enrich messages from query data
  const messages = useMemo<EnrichedMessage[]>(() => {
    if (!messagesData || !Array.isArray(messagesData)) {
      return [];
    }

    // Enrich messages with is_own flag and admin sender info
    return messagesData.map((msg: any) =>
      enrichMessageWithAdminSender(msg, staff?.id || null, adminCacheRef.current)
    );
  }, [messagesData, staff?.id]);

  // Handle conversation transition with proper async/await (Fase 1: fix race condition)
  useEffect(() => {
    if (!conversationId || !enabled) return;

    // Skip if same conversation
    if (currentConversationRef.current === conversationId) return;

    const switchConversation = async () => {
      console.log('[useChatMessages] Switching to conversation:', conversationId);

      // 1. Mark as transitioning to block realtime events
      isTransitioningRef.current = true;

      // 2. Clear admin cache for fresh data
      adminCacheRef.current.clear();

      // 3. Invalidate cache and wait for completion
      await invalidateMessages(conversationId);

      // 4. Refetch and wait for new data
      await refetch();

      // 5. Update current conversation ref
      currentConversationRef.current = conversationId;

      // 6. Re-enable realtime processing
      isTransitioningRef.current = false;

      console.log('[useChatMessages] Transition complete for:', conversationId);
    };

    switchConversation();
  }, [conversationId, enabled, invalidateMessages, refetch]);

  // Log query results for debugging
  useEffect(() => {
    console.log('[useChatMessages] Query state - isLoading:', isLoading, 'messages length:', messages.length, 'error:', queryError, 'dataUpdatedAt:', dataUpdatedAt);
  }, [isLoading, messages.length, queryError, dataUpdatedAt]);

  // Use shared mutation hooks
  const sendMutation = useSendMessage(supabase, staff?.id || '', staff?.organization_id ?? undefined);
  const deleteMutation = useDeleteMessage(supabase, staff?.id || '');
  const markAsReadMutation = useMarkAsRead(supabase);

  // Track if we've already marked this conversation as read
  const hasMarkedAsReadRef = useRef<string | null>(null);
  // Debounce timer ref for markAsRead (Fase 4)
  const markAsReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced markAsRead function (Fase 4: prevent excessive DB calls)
  const debouncedMarkAsRead = useCallback(
    (convId: string, userId: string) => {
      // Clear any pending timeout
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }

      // Schedule the markAsRead call
      markAsReadTimeoutRef.current = setTimeout(() => {
        markAsReadMutation.mutate(
          { conversationId: convId, userId },
          {
            onSuccess: () => {
              console.log('[useChatMessages] markAsRead success (debounced)');
              refreshUnreadCount();
            },
            onError: (error) => {
              console.error('[useChatMessages] markAsRead error:', error);
            },
          }
        );
      }, MARK_AS_READ_DEBOUNCE_MS);
    },
    [markAsReadMutation, refreshUnreadCount]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, []);

  // Mark conversation as read when opened (only once per conversation)
  useEffect(() => {
    // Skip if already marked this conversation as read
    if (hasMarkedAsReadRef.current === conversationId) {
      return;
    }

    if (conversationId && staff?.id) {
      console.log('[useChatMessages] Marking conversation as read:', conversationId);
      hasMarkedAsReadRef.current = conversationId;

      // Use immediate call for initial open (not debounced)
      markAsReadMutation.mutate(
        { conversationId, userId: staff.id },
        {
          onSuccess: () => {
            console.log('[useChatMessages] Initial markAsRead success');
            refreshUnreadCount();
          },
          onError: (error) => {
            console.error('[useChatMessages] Initial markAsRead error:', error);
            hasMarkedAsReadRef.current = null;
          },
        }
      );
    }
  }, [conversationId, staff?.id, refreshUnreadCount, markAsReadMutation]);

  // Handle realtime attachment status changes (Fase 2: use queryClient.setQueryData)
  const handleAttachmentStatusChange = useCallback(
    (updatedAttachment: ChatAttachment) => {
      // Update cache directly using queryClient.setQueryData
      queryClient.setQueryData<EnrichedMessage[]>(queryKey, (oldMessages) => {
        if (!oldMessages) return oldMessages;

        return oldMessages.map((msg) => {
          if (!msg.attachments || msg.attachments.length === 0) return msg;

          const hasAttachment = msg.attachments.some(
            (att) => att.id === updatedAttachment.id
          );

          if (!hasAttachment) return msg;

          return {
            ...msg,
            attachments: msg.attachments.map((att) =>
              att.id === updatedAttachment.id ? updatedAttachment : att
            ),
          };
        });
      });

      // Show alert for own attachments
      if (updatedAttachment.sender_id === staff?.id) {
        if (updatedAttachment.status === 'accepted') {
          Alert.alert(
            'Documento Aprovado',
            `${updatedAttachment.file_name} foi aprovado`,
            [{ text: 'OK' }]
          );
        } else if (updatedAttachment.status === 'rejected') {
          Alert.alert(
            'Documento Rejeitado',
            updatedAttachment.rejected_reason || `${updatedAttachment.file_name} foi rejeitado`,
            [{ text: 'OK' }]
          );
        }
      }
    },
    [queryClient, queryKey, staff?.id]
  );

  // Subscribe to attachment status changes
  useAttachmentRealtime(supabase, conversationId, handleAttachmentStatusChange);

  // Store refs for functions used in realtime callbacks to avoid stale closures
  const staffIdRef = useRef(staff?.id);
  const debouncedMarkAsReadRef = useRef(debouncedMarkAsRead);

  // Keep refs updated
  useEffect(() => {
    staffIdRef.current = staff?.id;
    debouncedMarkAsReadRef.current = debouncedMarkAsRead;
  });

  // Subscribe to new messages via Realtime (Fase 2: use queryClient.setQueryData)
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_messages_mobile:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Skip if transitioning between conversations (Fase 1: prevent race condition)
          if (isTransitioningRef.current) {
            console.log('[useChatMessages] Skipping INSERT during transition');
            return;
          }

          // Fetch the full message with sender info and attachments
          const { data: newMsg } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:medical_staff (id, name, color, avatar_url),
              attachments:chat_attachments (
                id,
                file_name,
                file_type,
                file_path,
                file_size,
                status,
                rejected_reason,
                created_at
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMsg) {
            // If message is from admin, fetch admin info if not cached
            if (newMsg.admin_sender_id && !newMsg.sender_id && !adminCacheRef.current.has(newMsg.admin_sender_id)) {
              const adminInfo = await fetchAdminInfo(newMsg.admin_sender_id);
              if (adminInfo) {
                adminCacheRef.current.set(newMsg.admin_sender_id, adminInfo);
              }
            }

            // Check if message might have attachments but they weren't loaded
            let messageAttachments = newMsg.attachments || [];
            const msgContent = newMsg.content?.trim() || '';
            const isLikelyAttachmentMessage =
              msgContent === '' ||
              msgContent.length < 30 ||
              msgContent.includes('Anexo enviado');

            if (messageAttachments.length === 0 && isLikelyAttachmentMessage && newMsg.sender_id) {
              const msgTime = new Date(newMsg.created_at).getTime();
              const { data: attachmentsData } = await supabase
                .from('chat_attachments')
                .select(`
                  id, conversation_id, message_id, sender_id, file_name, file_type,
                  file_path, file_size, status, rejected_reason, created_at
                `)
                .eq('conversation_id', conversationId)
                .eq('sender_id', newMsg.sender_id)
                .is('message_id', null)
                .gte('created_at', new Date(msgTime - 10000).toISOString())
                .lte('created_at', new Date(msgTime + 10000).toISOString());

              if (attachmentsData?.length) {
                messageAttachments = attachmentsData;
              }
            }

            // Get current staffId from ref
            const currentStaffId = staffIdRef.current;

            // Enrich message with admin sender info if applicable
            const enrichedMsg = {
              ...enrichMessageWithAdminSender(newMsg, currentStaffId || null, adminCacheRef.current),
              attachments: messageAttachments,
            };

            // Update React Query cache directly (Fase 2: single source of truth)
            queryClient.setQueryData<EnrichedMessage[]>(queryKey, (oldMessages) => {
              if (!oldMessages) return [enrichedMsg];

              // Avoid duplicates (from optimistic updates)
              if (oldMessages.some((m) => m.id === enrichedMsg.id)) {
                return oldMessages.map((m) =>
                  m.id === enrichedMsg.id ? enrichedMsg : m
                );
              }
              return [...oldMessages, enrichedMsg];
            });

            // Mark as read using debounced function (Fase 4)
            if (currentStaffId) {
              debouncedMarkAsReadRef.current(conversationId, currentStaffId);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Skip if transitioning between conversations
          if (isTransitioningRef.current) {
            console.log('[useChatMessages] Skipping DELETE during transition');
            return;
          }

          const deletedId = payload.old?.id;
          if (deletedId) {
            // Update React Query cache directly (Fase 2)
            queryClient.setQueryData<EnrichedMessage[]>(queryKey, (oldMessages) => {
              if (!oldMessages) return oldMessages;
              return oldMessages.filter((m) => m.id !== deletedId);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, queryKey]);

  // Send message handler
  // Note: Empty content is allowed for attachment-only messages
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !staff?.id) return;

      try {
        await sendMutation.mutateAsync({
          conversationId,
          content: content,
        });
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
        throw error;
      }
    },
    [conversationId, staff?.id, sendMutation]
  );

  // Delete message handler
  const deleteMessageHandler = useCallback(
    async (messageId: string) => {
      if (!messageId || !conversationId) return;

      try {
        const result = await deleteMutation.mutateAsync({
          messageId,
          conversationId,
        });

        if (!result.success) {
          Alert.alert('Erro', result.error || 'Não foi possível excluir a mensagem.');
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        Alert.alert('Erro', 'Não foi possível excluir a mensagem. Tente novamente.');
        throw error;
      }
    },
    [conversationId, deleteMutation]
  );

  return {
    messages, // Now using React Query cache directly (Fase 2)
    isLoading,
    isSending: sendMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error: queryError,
    sendMessage,
    deleteMessage: deleteMessageHandler,
    refetch,
  };
}
