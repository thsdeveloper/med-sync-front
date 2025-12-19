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
import {
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useMarkAsRead,
  useAttachmentRealtime,
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
  const [localMessages, setLocalMessages] = useState<EnrichedMessage[]>([]);
  const adminCacheRef = useRef<Map<string, AdminInfo>>(new Map());

  // Use shared query hook for initial data
  const {
    data: messagesData,
    isLoading,
    error: queryError,
    refetch,
  } = useMessages(supabase, conversationId, {
    enabled: enabled && !!conversationId,
    limit: 100,
  });

  // Sync query data to local state with admin message enrichment
  useEffect(() => {
    if (!messagesData || !Array.isArray(messagesData)) return;

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

      // Enrich messages with admin sender info and is_own flag
      const enrichedMessages = messagesData.map((msg: any) =>
        enrichMessageWithAdminSender(msg, staff?.id || null, adminCacheRef.current)
      );
      setLocalMessages(enrichedMessages);
    };

    processMessages();
  }, [messagesData, staff?.id]);

  // Use shared mutation hooks
  const sendMutation = useSendMessage(supabase, staff?.id || '', staff?.organization_id ?? undefined);
  const deleteMutation = useDeleteMessage(supabase, staff?.id || '');
  const markAsReadMutation = useMarkAsRead(supabase, staff?.id || '');

  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId && staff?.id) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId, staff?.id]);

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

            // Enrich message with admin sender info if applicable
            const enrichedMsg = enrichMessageWithAdminSender(newMsg, staff?.id || null, adminCacheRef.current);

            setLocalMessages((prev) => {
              // Avoid duplicates (from optimistic updates)
              if (prev.some((m) => m.id === enrichedMsg.id)) {
                return prev.map((m) =>
                  m.id === enrichedMsg.id ? enrichedMsg : m
                );
              }
              return [...prev, enrichedMsg];
            });

            // Mark as read
            if (staff?.id) {
              markAsReadMutation.mutate(conversationId);
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
  }, [conversationId, staff?.id]);

  // Send message handler
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !conversationId || !staff?.id) return;

      try {
        await sendMutation.mutateAsync({
          conversationId,
          content: content.trim(),
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
