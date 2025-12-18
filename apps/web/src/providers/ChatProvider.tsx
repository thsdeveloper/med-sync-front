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
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useOrganization } from './OrganizationProvider';
import { useSupabaseAuth } from './SupabaseAuthProvider';
import type { SupportConversationWithDetails, ChatMessage } from '@medsync/shared';

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
  const { user } = useSupabaseAuth();
  const { activeOrganization } = useOrganization();

  const [conversations, setConversations] = useState<SupportConversationWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Load support conversations for the organization
  const loadConversations = useCallback(async () => {
    if (!activeOrganization?.id || !user?.id) {
      setConversations([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get support conversations for this organization
      const { data: convData, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          participants:chat_participants (
            staff_id,
            last_read_at,
            staff:medical_staff (id, name, color, avatar_url)
          ),
          organization:organizations (id, name, logo_url)
        `)
        .eq('organization_id', activeOrganization.id)
        .eq('conversation_type', 'support')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      if (convData) {
        // Get last message and unread count for each conversation
        const conversationsWithDetails = await Promise.all(
          convData.map(async (conv) => {
            // Get last message
            const { data: lastMessage } = await supabase
              .from('chat_messages')
              .select(`
                id, content, created_at,
                sender:medical_staff (id, name, color, avatar_url)
              `)
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get admin participant to check last_read_at
            const { data: adminParticipant } = await supabase
              .from('chat_admin_participants')
              .select('last_read_at')
              .eq('conversation_id', conv.id)
              .eq('user_id', user.id)
              .maybeSingle();

            // Count unread messages (after admin's last_read_at)
            let unreadCount = 0;
            if (adminParticipant?.last_read_at) {
              const { count } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .gt('created_at', adminParticipant.last_read_at);

              unreadCount = count || 0;
            } else {
              // If no admin participant record, count all messages
              const { count } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id);

              unreadCount = count || 0;
            }

            return {
              ...conv,
              last_message: lastMessage,
              unread_count: unreadCount,
            } as SupportConversationWithDetails;
          })
        );

        setConversations(conversationsWithDetails);

        // Calculate total unread count
        const totalUnread = conversationsWithDetails.reduce(
          (acc, conv) => acc + (conv.unread_count || 0),
          0
        );
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganization?.id, user?.id, supabase]);

  // Load conversations on mount and when organization changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!activeOrganization?.id) return;

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
            // Reload conversations to update last message and unread count
            loadConversations();
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
        () => {
          // New conversation created
          loadConversations();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrganization?.id, supabase, loadConversations]);

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

      // We need to get the medical_staff id for this user to send messages
      // For now, we'll create a system message or handle differently
      // In this implementation, admins will have their messages sent with a special sender_id

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
      if (!user?.id) return;

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

      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );

      // Update total unread count
      setUnreadCount((prev) => {
        const conv = conversations.find((c) => c.id === conversationId);
        return Math.max(0, prev - (conv?.unread_count || 0));
      });
    },
    [user?.id, supabase, conversations]
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
