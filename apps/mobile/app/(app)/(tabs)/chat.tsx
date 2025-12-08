import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import type { ConversationWithDetails } from '@medsync/shared';

export default function ChatScreen() {
  const { staff } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!staff?.id) return;

    setIsLoading(true);
    try {
      // Get conversations where the user is a participant
      const { data: participantData } = await supabase
        .from('chat_participants')
        .select('conversation_id')
        .eq('staff_id', staff.id);

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const conversationIds = participantData.map((p) => p.conversation_id);

      // Get full conversation details
      const { data: conversationsData } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          participants:chat_participants (
            staff_id,
            last_read_at,
            staff:medical_staff (id, name, color)
          )
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsData) {
        // Get last message for each conversation
        const conversationsWithMessages = await Promise.all(
          conversationsData.map(async (conv) => {
            const { data: lastMessage } = await supabase
              .from('chat_messages')
              .select(`
                id, content, created_at,
                sender:medical_staff (id, name)
              `)
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Count unread messages
            const participant = conv.participants.find(
              (p: any) => p.staff_id === staff.id
            );
            const lastReadAt = participant?.last_read_at;

            let unreadCount = 0;
            if (lastReadAt) {
              const { count } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .gt('created_at', lastReadAt)
                .neq('sender_id', staff.id);

              unreadCount = count || 0;
            }

            return {
              ...conv,
              last_message: lastMessage,
              unread_count: unreadCount,
            };
          })
        );

        setConversations(conversationsWithMessages);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [staff?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!staff?.id) return;

    const channel = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [staff?.id, loadConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const getConversationName = (conv: ConversationWithDetails) => {
    if (conv.name) return conv.name;

    // For direct chats, get the other participant's name
    const otherParticipant = conv.participants.find(
      (p: any) => p.staff_id !== staff?.id
    );
    return otherParticipant?.staff?.name || 'Conversa';
  };

  const getConversationAvatar = (conv: ConversationWithDetails) => {
    if (conv.type === 'group') {
      return { name: conv.name || 'Grupo', color: '#6B7280' };
    }

    const otherParticipant = conv.participants.find(
      (p: any) => p.staff_id !== staff?.id
    );
    return {
      name: otherParticipant?.staff?.name || '?',
      color: otherParticipant?.staff?.color || '#0066CC',
    };
  };

  const formatMessageTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return 'Ontem';
    }
    return format(date, 'dd/MM', { locale: ptBR });
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const renderConversationItem = ({ item }: { item: ConversationWithDetails }) => {
    const avatar = getConversationAvatar(item);
    const name = getConversationName(item);
    const hasUnread = (item.unread_count || 0) > 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/(app)/chat/${item.id}`)}
      >
        <Avatar name={avatar.name} color={avatar.color} size="lg" />

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.conversationName, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {item.last_message && (
              <Text style={[styles.messageTime, hasUnread && styles.unreadTime]}>
                {formatMessageTime(item.last_message.created_at)}
              </Text>
            )}
          </View>

          <View style={styles.conversationPreview}>
            {item.last_message ? (
              <Text
                style={[styles.lastMessage, hasUnread && styles.unreadText]}
                numberOfLines={1}
              >
                {item.last_message.sender?.id === staff?.id && 'Você: '}
                {item.last_message.content}
              </Text>
            ) : (
              <Text style={styles.noMessages}>Nenhuma mensagem</Text>
            )}

            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unread_count! > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversa..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Nenhuma conversa encontrada'
                : 'Nenhuma conversa ainda'}
            </Text>
            <Text style={styles.emptySubtext}>
              Suas conversas com outros médicos e administradores aparecerão aqui
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadTime: {
    color: '#0066CC',
    fontWeight: '500',
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  noMessages: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#0066CC',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 68,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
