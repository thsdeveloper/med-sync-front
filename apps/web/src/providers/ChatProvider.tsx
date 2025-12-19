'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useOrganization } from './OrganizationProvider';
import { useSupabaseAuth } from './SupabaseAuthProvider';
import { useSupportConversations, useInvalidateChatQueries } from '@medsync/shared/hooks';
import { queryKeys } from '@medsync/shared/query';
import type { SupportConversationWithDetails } from '@medsync/shared';

type ChatContextValue = {
  conversations: SupportConversationWithDetails[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  selectedConversationId: string | null;
  selectConversation: (id: string | null) => void;
  loadConversations: () => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  const { activeOrganization } = useOrganization();
  const { invalidateConversations } = useInvalidateChatQueries();

  const [isConnected, setIsConnected] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Use the optimized hook that calls the SQL function (single query instead of N+1)
  const {
    data: conversations = [],
    isLoading,
    refetch,
  } = useSupportConversations(
    supabase,
    activeOrganization?.id || '',
    user?.id || '',
    {
      enabled: !!activeOrganization?.id && !!user?.id,
    }
  );

  // Calculate total unread count from conversations
  const unreadCount = useMemo(
    () => conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0),
    [conversations]
  );

  // Wrapper for refetch to maintain API compatibility
  const loadConversations = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Subscribe to realtime updates with incremental updates (not full reload)
  useEffect(() => {
    if (!activeOrganization?.id || !user?.id) return;

    const channel = supabase
      .channel(`admin_chat:${activeOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          // Check if message belongs to a conversation of this organization
          const { data: conv } = await supabase
            .from('chat_conversations')
            .select('id, organization_id, conversation_type')
            .eq('id', payload.new.conversation_id)
            .maybeSingle();

          if (
            conv?.organization_id === activeOrganization.id &&
            conv?.conversation_type === 'support'
          ) {
            // Get the new message with sender details
            const { data: newMsg } = await supabase
              .from('chat_messages')
              .select(`
                id, content, created_at,
                sender:medical_staff (id, name, color, avatar_url)
              `)
              .eq('id', payload.new.id)
              .maybeSingle();

            // Incremental update: only update the affected conversation
            queryClient.setQueryData(
              queryKeys.chat.conversations.support(activeOrganization.id, user.id),
              (oldData: SupportConversationWithDetails[] | undefined) => {
                if (!oldData) return oldData;

                const conversationIndex = oldData.findIndex(c => c.id === conv.id);

                if (conversationIndex === -1) {
                  // New conversation - refetch to get all details
                  refetch();
                  return oldData;
                }

                // Update existing conversation
                const updatedConversations = [...oldData];
                const existingConv = updatedConversations[conversationIndex];

                // Check if this is NOT our own message (to increment unread)
                const isOwnMessage =
                  payload.new.admin_sender_id === user.id ||
                  payload.new.sender_id === existingConv.participants?.[0]?.staff_id;

                // Normalize sender (Supabase may return array for relations)
                const senderData = newMsg?.sender;
                const normalizedSender = Array.isArray(senderData)
                  ? senderData[0]
                  : senderData;

                updatedConversations[conversationIndex] = {
                  ...existingConv,
                  last_message: newMsg ? {
                    id: newMsg.id,
                    content: newMsg.content,
                    created_at: newMsg.created_at,
                    sender: normalizedSender || undefined,
                  } : existingConv.last_message,
                  unread_count: isOwnMessage
                    ? existingConv.unread_count
                    : (existingConv.unread_count || 0) + 1,
                  updated_at: new Date().toISOString(),
                };

                // Sort by updated_at descending
                return updatedConversations.sort(
                  (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                );
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_conversations',
          filter: `organization_id=eq.${activeOrganization.id}`,
        },
        (payload) => {
          // New conversation created - only refetch if it's a support conversation
          if (payload.new.conversation_type === 'support') {
            refetch();
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrganization?.id, user?.id, supabase, queryClient, refetch]);

  // Select a conversation
  const selectConversation = useCallback((id: string | null) => {
    setSelectedConversationId(id);
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!user?.id || !content.trim()) return;

      // First, ensure admin is a participant
      const { data: existingParticipant } = await supabase
        .from('chat_admin_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingParticipant) {
        // Add admin as participant
        await supabase.from('chat_admin_participants').insert({
          conversation_id: conversationId,
          user_id: user.id,
        });
      }

      // Check if user has a medical_staff record (some admins might also be doctors)
      const { data: staffRecord } = await supabase
        .from('medical_staff')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let insertError;
      if (staffRecord) {
        // Admin has a staff record, use sender_id
        const { error } = await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          sender_id: staffRecord.id,
          content: content.trim(),
        });
        insertError = error;
      } else {
        // Admin doesn't have a staff record, use admin_sender_id
        const { error } = await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          admin_sender_id: user.id,
          content: content.trim(),
        });
        insertError = error;
      }

      if (insertError) {
        console.error('Error sending message:', insertError);
        throw insertError;
      }

      // Update conversation updated_at
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Mark as read
      await markAsRead(conversationId);
    },
    [user?.id, supabase]
  );

  // Mark conversation as read
  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!user?.id || !activeOrganization?.id) return;

      // Upsert admin participant with last_read_at
      await supabase
        .from('chat_admin_participants')
        .upsert(
          {
            conversation_id: conversationId,
            user_id: user.id,
            last_read_at: new Date().toISOString(),
          },
          {
            onConflict: 'conversation_id,user_id',
          }
        );

      // Optimistic update: set unread count to 0 for this conversation
      queryClient.setQueryData(
        queryKeys.chat.conversations.support(activeOrganization.id, user.id),
        (oldData: SupportConversationWithDetails[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((conv) =>
            conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
          );
        }
      );
    },
    [user?.id, activeOrganization?.id, supabase, queryClient]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      unreadCount,
      isLoading,
      isConnected,
      selectedConversationId,
      selectConversation,
      loadConversations,
      sendMessage,
      markAsRead,
    }),
    [
      conversations,
      unreadCount,
      isLoading,
      isConnected,
      selectedConversationId,
      selectConversation,
      loadConversations,
      sendMessage,
      markAsRead,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};
