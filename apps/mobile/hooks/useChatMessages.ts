/**
 * useChatMessages Hook
 *
 * Combines React Query with Supabase Realtime for optimal chat experience.
 * Uses shared hooks for mutations while maintaining realtime updates.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { Alert } from 'react-native';
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
 */
export function useChatMessages({
  conversationId,
  enabled = true,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const { staff } = useAuth();
  const { refreshUnreadCount } = useUnreadCount();
  const { invalidateMessages } = useInvalidateChatQueries();
  const [localMessages, setLocalMessages] = useState<EnrichedMessage[]>([]);
  const adminCacheRef = useRef<Map<string, AdminInfo>>(new Map());

  // Use shared query hook for initial data
  const {
    data: messagesData,
    isLoading,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useMessages(supabase, conversationId, {
    enabled: enabled && !!conversationId,
    limit: 100,
    staleTime: 0,
  });

  // Force invalidation and refetch when conversation changes to always get fresh data
  useEffect(() => {
    if (conversationId && enabled) {
      console.log('[useChatMessages] Invalidating and refetching for conversation:', conversationId);
      // Clear local messages to avoid showing stale data
      setLocalMessages([]);
      // Clear admin cache for fresh data
      adminCacheRef.current.clear();
      // Invalidate to clear cached data
      invalidateMessages(conversationId);
      // Then refetch to get fresh data
      refetch();
    }
  }, [conversationId, enabled, invalidateMessages, refetch]);

  // Log query results for debugging
  useEffect(() => {
    console.log('[useChatMessages] Query state - isLoading:', isLoading, 'messagesData length:', messagesData?.length ?? 0, 'error:', queryError, 'dataUpdatedAt:', dataUpdatedAt);
  }, [isLoading, messagesData, queryError, dataUpdatedAt]);

  // Sync query data to local state with admin message enrichment and attachment association
  useEffect(() => {
    console.log('[useChatMessages] Syncing messages - count:', messagesData?.length ?? 0);
    if (!messagesData || !Array.isArray(messagesData)) {
      return;
    }

    const processMessages = async () => {
      // Find unique admin IDs that need to be fetched
      const adminIds = new Set<string>();
      messagesData.forEach((msg: any) => {
        if (msg.admin_sender_id && !msg.sender_id && !adminCacheRef.current.has(msg.admin_sender_id)) {
          adminIds.add(msg.admin_sender_id);
        }
      });

      // Fetch admin info for unknown admins
      if (adminIds.size > 0) {
        const fetchPromises = Array.from(adminIds).map(async (adminId) => {
          const info = await fetchAdminInfo(adminId);
          if (info) {
            adminCacheRef.current.set(adminId, info);
          }
        });
        await Promise.all(fetchPromises);
      }

      // Fetch ALL attachments for this conversation to handle unlinked ones
      const { data: allAttachments } = await supabase
        .from('chat_attachments')
        .select(`
          id, conversation_id, message_id, sender_id, file_name, file_type,
          file_path, file_size, status, rejected_reason, created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // Associate unlinked attachments to messages by time proximity
      const assignedAttachmentIds = new Set<string>();
      const messagesWithAttachments = messagesData.map((msg: any) => {
        // First, keep any attachments already linked via message_id
        let msgAttachments = (allAttachments || []).filter(
          (a: any) => a.message_id === msg.id && !assignedAttachmentIds.has(a.id)
        );

        // Mark these as assigned
        msgAttachments.forEach((a: any) => assignedAttachmentIds.add(a.id));

        // Fallback: associate by time proximity for messages without linked attachments
        if (msgAttachments.length === 0) {
          const msgContent = msg.content?.trim() || '';
          const isLikelyAttachmentMessage =
            msgContent === '' ||
            msgContent.length < 30 ||
            msgContent.includes('Anexo enviado');

          if (isLikelyAttachmentMessage) {
            const msgTime = new Date(msg.created_at).getTime();
            msgAttachments = (allAttachments || []).filter((a: any) => {
              if (assignedAttachmentIds.has(a.id)) return false;
              if (a.message_id !== null) return false;
              const attTime = new Date(a.created_at).getTime();
              const timeDiff = Math.abs(attTime - msgTime);
              const senderMatch = a.sender_id === msg.sender_id;
              return senderMatch && timeDiff < 10000; // 10 seconds window
            });
            msgAttachments.forEach((a: any) => assignedAttachmentIds.add(a.id));
          }
        }

        return { ...msg, attachments: msgAttachments };
      });

      // Enrich messages with admin sender info and is_own flag
      const enrichedMessages = messagesWithAttachments.map((msg: any) =>
        enrichMessageWithAdminSender(msg, staff?.id || null, adminCacheRef.current)
      );
      setLocalMessages(enrichedMessages);
    };

    processMessages();
  }, [messagesData, staff?.id, conversationId]);

  // Use shared mutation hooks
  const sendMutation = useSendMessage(supabase, staff?.id || '', staff?.organization_id ?? undefined);
  const deleteMutation = useDeleteMessage(supabase, staff?.id || '');
  // Use the hook without defaultUserId to avoid closure issues
  const markAsReadMutation = useMarkAsRead(supabase);

  // Track if we've already marked this conversation as read
  const hasMarkedAsReadRef = useRef<string | null>(null);

  // Mark conversation as read when opened (only once per conversation)
  useEffect(() => {
    console.log('[useChatMessages] useEffect triggered - conversationId:', conversationId, 'staff?.id:', staff?.id, 'hasMarkedAsRead:', hasMarkedAsReadRef.current);

    // Skip if already marked this conversation as read
    if (hasMarkedAsReadRef.current === conversationId) {
      console.log('[useChatMessages] Already marked as read, skipping');
      return;
    }

    if (conversationId && staff?.id) {
      console.log('[useChatMessages] Calling markAsReadMutation.mutate with:', { conversationId, userId: staff.id });
      hasMarkedAsReadRef.current = conversationId;

      // Pass userId directly in the mutation params to avoid stale closure issues
      markAsReadMutation.mutate(
        { conversationId, userId: staff.id },
        {
          onSuccess: () => {
            console.log('[useChatMessages] markAsReadMutation.onSuccess - calling refreshUnreadCount()');
            // Refresh the unread count badge after marking as read
            refreshUnreadCount();
          },
          onError: (error) => {
            console.error('[useChatMessages] markAsReadMutation.onError:', error);
            // Reset so it can retry
            hasMarkedAsReadRef.current = null;
          },
        }
      );
    } else {
      console.log('[useChatMessages] Skipping markAsRead - missing conversationId or staff.id');
    }
  }, [conversationId, staff?.id, refreshUnreadCount, markAsReadMutation]);

  // Handle realtime attachment status changes
  const handleAttachmentStatusChange = useCallback(
    (updatedAttachment: ChatAttachment) => {
      setLocalMessages((prevMessages) =>
        prevMessages.map((msg) => {
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
        })
      );

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
    [staff?.id]
  );

  // Subscribe to attachment status changes
  useAttachmentRealtime(supabase, conversationId, handleAttachmentStatusChange);

  // Store refs for functions used in realtime callbacks to avoid stale closures
  const markAsReadRef = useRef(markAsReadMutation.mutate);
  const refreshUnreadCountRef = useRef(refreshUnreadCount);
  const staffIdRef = useRef(staff?.id);

  // Keep refs updated
  useEffect(() => {
    markAsReadRef.current = markAsReadMutation.mutate;
    refreshUnreadCountRef.current = refreshUnreadCount;
    staffIdRef.current = staff?.id;
  });

  // Subscribe to new messages via Realtime
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

            // Check if message might have attachments but they weren't loaded (message_id not yet linked)
            // This handles the race condition where attachments are uploaded before message_id is linked
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

            setLocalMessages((prev) => {
              // Avoid duplicates (from optimistic updates)
              if (prev.some((m) => m.id === enrichedMsg.id)) {
                return prev.map((m) =>
                  m.id === enrichedMsg.id ? enrichedMsg : m
                );
              }
              return [...prev, enrichedMsg];
            });

            // Mark as read and refresh unread count using refs
            if (currentStaffId) {
              markAsReadRef.current(
                { conversationId, userId: currentStaffId },
                {
                  onSuccess: () => {
                    refreshUnreadCountRef.current();
                  },
                }
              );
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
          const deletedId = payload.old?.id;
          if (deletedId) {
            setLocalMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

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
    messages: localMessages,
    isLoading,
    isSending: sendMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error: queryError,
    sendMessage,
    deleteMessage: deleteMessageHandler,
    refetch,
  };
}
