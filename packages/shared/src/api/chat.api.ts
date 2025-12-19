/**
 * Chat API Functions
 *
 * Platform-agnostic API functions for chat operations.
 * These functions accept a Supabase client and return typed results.
 * Used by React Query hooks in both web and mobile apps.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ChatConversation,
  ChatMessage,
  ConversationWithDetails,
  MessageWithSender,
  SupportConversationWithDetails,
  CreateConversationData,
  SendMessageData,
} from '../schemas/chat.schema';

// ============================================
// TYPES
// ============================================

export interface GetConversationsParams {
  userId: string;
  organizationId: string;
  type?: 'direct' | 'group';
  limit?: number;
}

export interface GetSupportConversationsParams {
  organizationId: string;
  userId: string; // admin user id for unread calculation
}

export interface GetMessagesParams {
  conversationId: string;
  limit?: number;
  before?: string; // cursor for pagination (message id)
  after?: string;
}

export interface GetMessagesResult {
  messages: MessageWithSender[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface SendMessageParams {
  conversationId: string;
  content: string;
  senderId: string;
}

export interface DeleteMessageParams {
  messageId: string;
  senderId?: string; // medical_staff.id - For authorization check
  adminSenderId?: string; // auth.users.id - For admin authorization check
}

// ============================================
// CONVERSATION QUERIES
// ============================================

/**
 * Get all conversations for a user in an organization
 */
export async function getConversations(
  supabase: SupabaseClient,
  params: GetConversationsParams
): Promise<ConversationWithDetails[]> {
  const { userId, organizationId, type, limit = 50 } = params;

  // First get conversation IDs where user is a participant
  const { data: participantData, error: participantError } = await supabase
    .from('chat_participants')
    .select('conversation_id')
    .eq('staff_id', userId);

  if (participantError) {
    throw new Error(`Failed to get conversations: ${participantError.message}`);
  }

  if (!participantData || participantData.length === 0) {
    return [];
  }

  const conversationIds = participantData.map((p) => p.conversation_id);

  // Build query for conversations
  let query = supabase
    .from('chat_conversations')
    .select(`
      *,
      participants:chat_participants (
        staff_id,
        staff:medical_staff (
          id,
          name,
          color,
          avatar_url
        )
      )
    `)
    .eq('organization_id', organizationId)
    .in('id', conversationIds)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq('type', type);
  }

  const { data: conversations, error: conversationsError } = await query;

  if (conversationsError) {
    throw new Error(`Failed to get conversations: ${conversationsError.message}`);
  }

  // Get last message for each conversation
  const conversationsWithLastMessage = await Promise.all(
    (conversations || []).map(async (conversation) => {
      const { data: lastMessageData } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          sender:medical_staff (
            id,
            name
          )
        `)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get unread count
      const { data: participantInfo } = await supabase
        .from('chat_participants')
        .select('last_read_at')
        .eq('conversation_id', conversation.id)
        .eq('staff_id', userId)
        .single();

      let unreadCount = 0;
      if (participantInfo?.last_read_at) {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .gt('created_at', participantInfo.last_read_at)
          .neq('sender_id', userId);
        unreadCount = count || 0;
      }

      return {
        ...conversation,
        last_message: lastMessageData || null,
        unread_count: unreadCount,
      } as ConversationWithDetails;
    })
  );

  return conversationsWithLastMessage;
}

/**
 * Get a single conversation by ID with all details
 */
export async function getConversationById(
  supabase: SupabaseClient,
  conversationId: string
): Promise<ConversationWithDetails | null> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(`
      *,
      participants:chat_participants (
        staff_id,
        staff:medical_staff (
          id,
          name,
          color,
          avatar_url
        )
      ),
      organization:organizations (
        id,
        name,
        logo_url
      )
    `)
    .eq('id', conversationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get conversation: ${error.message}`);
  }

  return data as ConversationWithDetails;
}

/**
 * Get support conversations with details using optimized SQL function.
 * Returns all data in a single query instead of N+1 pattern.
 */
export async function getSupportConversationsWithDetails(
  supabase: SupabaseClient,
  params: GetSupportConversationsParams
): Promise<SupportConversationWithDetails[]> {
  const { organizationId, userId } = params;

  const { data, error } = await supabase.rpc('get_support_conversations_with_details', {
    p_organization_id: organizationId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to get support conversations: ${error.message}`);
  }

  return (data || []) as SupportConversationWithDetails[];
}

// ============================================
// MESSAGE QUERIES
// ============================================

/**
 * Get messages for a conversation with pagination
 */
export async function getMessages(
  supabase: SupabaseClient,
  params: GetMessagesParams
): Promise<GetMessagesResult> {
  const { conversationId, limit = 50, before, after } = params;

  let query = supabase
    .from('chat_messages')
    .select(`
      *,
      sender:medical_staff (
        id,
        name,
        color,
        avatar_url
      ),
      attachments:chat_attachments (
        id,
        file_name,
        file_type,
        file_path,
        file_size,
        status,
        rejected_reason,
        reviewed_at,
        created_at
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more

  if (before) {
    query = query.lt('id', before);
  }

  if (after) {
    query = query.gt('id', after);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  const messages = data || [];
  const hasMore = messages.length > limit;

  // Remove the extra message used for pagination check
  if (hasMore) {
    messages.pop();
  }

  // Reverse to get chronological order
  const orderedMessages = messages.reverse();

  return {
    messages: orderedMessages as MessageWithSender[],
    hasMore,
    nextCursor: hasMore ? messages[messages.length - 1]?.id : undefined,
  };
}

// ============================================
// MESSAGE MUTATIONS
// ============================================

/**
 * Send a new message to a conversation
 */
export async function sendMessage(
  supabase: SupabaseClient,
  params: SendMessageParams
): Promise<MessageWithSender> {
  const { conversationId, content, senderId } = params;

  // Insert message
  const { data: message, error: messageError } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
    })
    .select(`
      *,
      sender:medical_staff (
        id,
        name,
        color,
        avatar_url
      )
    `)
    .single();

  if (messageError) {
    throw new Error(`Failed to send message: ${messageError.message}`);
  }

  // Update conversation's updated_at
  await supabase
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Update sender's last_read_at
  await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('staff_id', senderId);

  return message as MessageWithSender;
}

/**
 * Delete a message (soft delete or hard delete based on your policy)
 */
export async function deleteMessage(
  supabase: SupabaseClient,
  params: DeleteMessageParams
): Promise<{ success: boolean; error?: string }> {
  const { messageId, senderId, adminSenderId } = params;

  // Verify ownership
  const { data: message, error: checkError } = await supabase
    .from('chat_messages')
    .select('id, sender_id, admin_sender_id, conversation_id')
    .eq('id', messageId)
    .single();

  if (checkError || !message) {
    return { success: false, error: 'Mensagem não encontrada' };
  }

  // Check if the user owns this message (either as staff or admin)
  const isOwner =
    (senderId && message.sender_id === senderId) ||
    (adminSenderId && message.admin_sender_id === adminSenderId);

  if (!isOwner) {
    return { success: false, error: 'Você não pode deletar mensagens de outros usuários' };
  }

  // Delete attachments from storage first
  const { data: attachments } = await supabase
    .from('chat_attachments')
    .select('file_path')
    .eq('message_id', messageId);

  if (attachments && attachments.length > 0) {
    const paths = attachments.map((a) => a.file_path);
    await supabase.storage.from('chat-attachments').remove(paths);
  }

  // Delete attachment records
  await supabase.from('chat_attachments').delete().eq('message_id', messageId);

  // Delete the message
  const { error: deleteError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (deleteError) {
    return { success: false, error: `Erro ao deletar: ${deleteError.message}` };
  }

  return { success: true };
}

// ============================================
// CONVERSATION MUTATIONS
// ============================================

/**
 * Create a new conversation
 */
export async function createConversation(
  supabase: SupabaseClient,
  data: CreateConversationData & { creatorId: string }
): Promise<ChatConversation> {
  const { organization_id, type, name, participant_ids, creatorId } = data;

  // Include creator in participants if not already
  const allParticipants = participant_ids.includes(creatorId)
    ? participant_ids
    : [...participant_ids, creatorId];

  // For direct conversations, check if one already exists
  if (type === 'direct' && allParticipants.length === 2) {
    const existingConversation = await findExistingDirectConversation(
      supabase,
      organization_id,
      allParticipants
    );
    if (existingConversation) {
      return existingConversation;
    }
  }

  // Create conversation
  const { data: conversation, error: conversationError } = await supabase
    .from('chat_conversations')
    .insert({
      organization_id,
      type,
      name: name || null,
    })
    .select()
    .single();

  if (conversationError) {
    throw new Error(`Failed to create conversation: ${conversationError.message}`);
  }

  // Add participants
  const participantRecords = allParticipants.map((staffId) => ({
    conversation_id: conversation.id,
    staff_id: staffId,
  }));

  const { error: participantsError } = await supabase
    .from('chat_participants')
    .insert(participantRecords);

  if (participantsError) {
    // Rollback conversation creation
    await supabase.from('chat_conversations').delete().eq('id', conversation.id);
    throw new Error(`Failed to add participants: ${participantsError.message}`);
  }

  return conversation as ChatConversation;
}

/**
 * Find existing direct conversation between two users
 */
async function findExistingDirectConversation(
  supabase: SupabaseClient,
  organizationId: string,
  participantIds: string[]
): Promise<ChatConversation | null> {
  // Get direct conversations for the organization
  const { data: conversations } = await supabase
    .from('chat_conversations')
    .select(`
      *,
      participants:chat_participants (staff_id)
    `)
    .eq('organization_id', organizationId)
    .eq('type', 'direct');

  if (!conversations) return null;

  // Find conversation with exact same participants
  for (const conv of conversations) {
    const convParticipantIds = conv.participants.map((p: { staff_id: string }) => p.staff_id);
    if (
      convParticipantIds.length === participantIds.length &&
      participantIds.every((id) => convParticipantIds.includes(id))
    ) {
      return conv as ChatConversation;
    }
  }

  return null;
}

/**
 * Mark conversation as read for a user
 */
export async function markConversationAsRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('staff_id', userId);

  if (error) {
    throw new Error(`Failed to mark as read: ${error.message}`);
  }
}

/**
 * Get unread count for a user across all conversations
 */
export async function getTotalUnreadCount(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<number> {
  // Get all conversations the user is part of
  const { data: conversations } = await supabase
    .from('chat_participants')
    .select(`
      conversation_id,
      last_read_at,
      conversation:chat_conversations!inner (
        organization_id
      )
    `)
    .eq('staff_id', userId);

  if (!conversations) return 0;

  // Filter by organization and count unread
  let totalUnread = 0;

  for (const conv of conversations) {
    const convOrg = (conv.conversation as unknown as { organization_id: string })?.organization_id;
    if (convOrg !== organizationId) continue;

    if (conv.last_read_at) {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.conversation_id)
        .gt('created_at', conv.last_read_at)
        .neq('sender_id', userId);

      totalUnread += count || 0;
    }
  }

  return totalUnread;
}
