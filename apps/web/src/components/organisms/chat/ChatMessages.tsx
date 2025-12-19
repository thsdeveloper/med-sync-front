'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { parseISO, isSameDay, differenceInMinutes } from 'date-fns';
import { MessageCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { useChat } from '@/providers/ChatProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import {
  useReadReceipts,
  useMessageSearch,
  useTypingIndicator,
  useChatMessages,
  type EnrichedMessage,
} from '@/hooks';
import { ChatHeader } from './ChatHeader';
import { MessageGroup } from '@/components/molecules/chat/MessageGroup';
import { DateSeparator } from '@/components/molecules/chat/DateSeparator';
import { TypingIndicator } from '@/components/molecules/chat/TypingIndicator';
import { AttachmentPreviewModal } from '@/components/molecules/chat/AttachmentPreviewModal';
import { AttachmentReviewDialog } from '@/components/organisms/AttachmentReviewDialog';
import { ConfirmationDialog, useConfirmationDialog } from '@/components/organisms/ConfirmationDialog';
import { useAttachmentReview } from '@/hooks/useAttachmentReview';
import { useDeleteMessage } from '@/hooks/useDeleteMessage';
import { useAttachmentRealtime } from '@medsync/shared/hooks';
import { toast } from 'sonner';
import type { MessageWithSender, SupportConversationWithDetails, ChatAttachment } from '@medsync/shared';
import type { ReadStatus } from '@/components/atoms/chat/ReadReceiptIcon';

interface ChatMessagesProps {
  conversationId: string;
  onBack?: () => void;
}

interface MessageGroupData {
  senderId: string;
  senderName: string;
  senderColor?: string;
  senderAvatarUrl?: string;
  isOwn: boolean;
  messages: EnrichedMessage[];
  date: string;
}

const MESSAGE_GROUPING_WINDOW_MINUTES = 5;

/**
 * Groups messages by sender and time window
 */
function groupMessages(
  messages: EnrichedMessage[],
  currentUserId: string | null,
  staffId: string | null
): MessageGroupData[] {
  const groups: MessageGroupData[] = [];
  let currentGroup: MessageGroupData | null = null;

  messages.forEach((msg) => {
    const senderId = msg.sender_id || msg.admin_sender_id || 'unknown';
    const isOwn = msg.is_own || msg.admin_sender_id === currentUserId || msg.sender_id === staffId;
    const senderName = msg.sender?.name || 'Administrador';
    const senderColor = msg.sender?.color;
    const senderAvatarUrl = msg.sender?.avatar_url ?? undefined;
    const msgDate = parseISO(msg.created_at);

    // Check if we should start a new group
    const shouldStartNewGroup =
      !currentGroup ||
      currentGroup.senderId !== senderId ||
      currentGroup.isOwn !== isOwn ||
      !isSameDay(parseISO(currentGroup.date), msgDate) ||
      (currentGroup.messages.length > 0 &&
        differenceInMinutes(
          msgDate,
          parseISO(currentGroup.messages[currentGroup.messages.length - 1].created_at)
        ) > MESSAGE_GROUPING_WINDOW_MINUTES);

    if (shouldStartNewGroup) {
      currentGroup = {
        senderId,
        senderName,
        senderColor,
        senderAvatarUrl,
        isOwn,
        messages: [msg],
        date: msg.created_at,
      };
      groups.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.messages.push(msg);
    }
  });

  return groups;
}

export function ChatMessages({ conversationId, onBack }: ChatMessagesProps) {
  const supabase = getSupabaseBrowserClient();
  const { user } = useSupabaseAuth();
  const { markAsRead, conversations } = useChat();
  const { activeRole } = useOrganization();
  const [conversation, setConversation] = useState<SupportConversationWithDetails | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);

  // Admin can be owner or admin role
  const isAdmin = activeRole === 'owner' || activeRole === 'admin';
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatAttachment | null>(null);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject'>('accept');
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Use the new cached hook for messages
  const {
    messages,
    isLoading,
    refetch: loadMessages,
    addMessage,
    removeMessage,
    updateMessageAttachment,
  } = useChatMessages(conversationId, {
    enabled: !!conversationId && staffId !== null,
    userId: user?.id,
    staffId,
  });

  // Hooks
  const { acceptAttachment, rejectAttachment, isLoading: isReviewing } = useAttachmentReview();
  const { deleteMessage, isDeleting } = useDeleteMessage();
  const {
    isOpen: isDeleteDialogOpen,
    data: messageToDelete,
    openConfirmation: openDeleteDialog,
    closeConfirmation: closeDeleteDialog,
  } = useConfirmationDialog<MessageWithSender>();

  // Read receipts hook - use admin_participants for last_read_at
  const participantLastReadAt = conversation?.admin_participants?.[0]?.last_read_at;
  const { getReadStatus } = useReadReceipts({ participantLastReadAt });

  // Message search hook
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    currentIndex: searchCurrentIndex,
    totalResults: searchTotalResults,
    goToNext: searchGoToNext,
    goToPrevious: searchGoToPrevious,
  } = useMessageSearch({ messages });

  // Typing indicator hook
  const { typingUsers } = useTypingIndicator({
    conversationId,
    userId: user?.id || '',
    userName: 'Administrador',
    enabled: !!user?.id,
  });

  // Current highlighted message for search
  const highlightedMessageId = searchResults[searchCurrentIndex] || null;

  // Scroll to highlighted message when search result changes
  useEffect(() => {
    if (highlightedMessageId && messagesContainerRef.current) {
      const element = messagesContainerRef.current.querySelector(
        `[data-message-id="${highlightedMessageId}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedMessageId]);

  // Get staff ID for current user
  useEffect(() => {
    const getStaffInfo = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('medical_staff')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setStaffId(data.id);
      } else {
        // Set to empty string to indicate lookup is done but no staff record
        setStaffId('');
      }
    };
    getStaffInfo();
  }, [user?.id, supabase]);

  // Update conversation from context
  useEffect(() => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) setConversation(conv);
  }, [conversationId, conversations]);

  // Mark as read
  useEffect(() => {
    if (conversationId) markAsRead(conversationId);
  }, [conversationId, markAsRead]);

  // Subscribe to new messages (realtime incremental updates)
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: newMsg } = await supabase
            .from('chat_messages')
            .select(`*, sender:medical_staff (id, name, color, avatar_url)`)
            .eq('id', payload.new.id)
            .maybeSingle();

          if (newMsg) {
            let enrichedMsg: EnrichedMessage = {
              ...newMsg,
              is_own: newMsg.sender_id === staffId,
              attachments: [],
            };

            if (newMsg.admin_sender_id && !newMsg.sender_id) {
              enrichedMsg = {
                ...newMsg,
                sender: { id: newMsg.admin_sender_id, name: 'Administrador', color: '#6366F1' },
                is_own: newMsg.admin_sender_id === user?.id,
                attachments: [],
              };
            }

            if (newMsg.content?.includes('Anexo enviado')) {
              const msgTime = new Date(newMsg.created_at).getTime();
              const { data: attachmentsData } = await supabase
                .from('chat_attachments')
                .select(`
                  id, conversation_id, message_id, sender_id, file_name, file_type,
                  file_path, file_size, status, rejected_reason, reviewed_by, reviewed_at, created_at
                `)
                .eq('conversation_id', conversationId)
                .eq('sender_id', newMsg.sender_id)
                .is('message_id', null)
                .gte('created_at', new Date(msgTime - 10000).toISOString())
                .lte('created_at', new Date(msgTime + 10000).toISOString());

              if (attachmentsData?.length) enrichedMsg.attachments = attachmentsData;
            }

            addMessage(enrichedMsg);
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
          if (deletedId) removeMessage(deletedId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, staffId, supabase, user?.id, addMessage, removeMessage]);

  // Attachment status changes
  const handleAttachmentStatusChange = useCallback(
    (updatedAttachment: ChatAttachment) => {
      updateMessageAttachment(updatedAttachment.id, updatedAttachment);

      if (updatedAttachment.status === 'accepted') {
        toast.success('Documento Aprovado', {
          description: `${updatedAttachment.file_name} foi aprovado`,
        });
      } else if (updatedAttachment.status === 'rejected') {
        toast.error('Documento Rejeitado', {
          description:
            updatedAttachment.rejected_reason || `${updatedAttachment.file_name} foi rejeitado`,
        });
      }
    },
    [updateMessageAttachment]
  );

  useAttachmentRealtime(supabase, conversationId, handleAttachmentStatusChange);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages
  const messageGroups = useMemo(
    () => groupMessages(messages, user?.id || null, staffId),
    [messages, user?.id, staffId]
  );

  // Get read status for a message (only for own messages)
  const getMessageReadStatus = useCallback(
    (msg: MessageWithSender): ReadStatus => {
      if (!msg.is_own) return 'sent';
      return getReadStatus(msg.created_at);
    },
    [getReadStatus]
  );

  // Handlers
  const handleAcceptClick = (attachment: ChatAttachment) => {
    setSelectedAttachment(attachment);
    setReviewAction('accept');
    setReviewDialogOpen(true);
  };

  const handleRejectClick = (attachment: ChatAttachment) => {
    setSelectedAttachment(attachment);
    setReviewAction('reject');
    setReviewDialogOpen(true);
  };

  const handleReviewConfirm = (rejectionReason?: string) => {
    if (!selectedAttachment) return;

    if (reviewAction === 'accept') {
      acceptAttachment(
        { attachmentId: selectedAttachment.id },
        {
          onSuccess: () => {
            setReviewDialogOpen(false);
            setSelectedAttachment(null);
            loadMessages();
          },
        }
      );
    } else {
      if (!rejectionReason) return;
      rejectAttachment(
        { attachmentId: selectedAttachment.id, rejectionReason },
        {
          onSuccess: () => {
            setReviewDialogOpen(false);
            setSelectedAttachment(null);
            loadMessages();
          },
        }
      );
    }
  };

  const handleViewAttachment = async (attachment: ChatAttachment) => {
    setPreviewAttachment(attachment);
    setIsLoadingPreview(true);
    setPreviewSignedUrl(null);

    try {
      const response = await fetch(`/api/chat/attachments/${attachment.id}/download`);
      if (!response.ok) {
        console.error('Failed to fetch signed URL');
        return;
      }
      const data = await response.json();
      if (data.signedUrl) {
        setPreviewSignedUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewAttachment(null);
    setPreviewSignedUrl(null);
  };

  const handleDownloadAttachment = async (attachment: ChatAttachment) => {
    try {
      const response = await fetch(`/api/chat/attachments/${attachment.id}/download`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleDeleteMessage = (msg: MessageWithSender) => openDeleteDialog(msg);

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    deleteMessage(
      { messageId: messageToDelete.id, conversationId },
      {
        onSuccess: (response) => {
          if (response.success) {
            closeDeleteDialog();
            removeMessage(messageToDelete.id);
          }
        },
      }
    );
  };

  // Check if we need date separator between groups
  const shouldShowDateSeparator = (currentGroup: MessageGroupData, index: number): boolean => {
    if (index === 0) return true;
    const previousGroup = messageGroups[index - 1];
    return !isSameDay(parseISO(currentGroup.date), parseISO(previousGroup.date));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header with search */}
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        messages={messages}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchTotalResults={searchTotalResults}
        searchCurrentResult={searchCurrentIndex}
        onSearchNext={searchGoToNext}
        onSearchPrevious={searchGoToPrevious}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Envie uma mensagem para iniciar a conversa
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map((group, index) => (
                <div key={`${group.senderId}-${group.date}-${index}`}>
                  {shouldShowDateSeparator(group, index) && <DateSeparator date={group.date} />}
                  <div data-message-id={group.messages[0]?.id}>
                    <MessageGroup
                      messages={group.messages}
                      isOwn={group.isOwn}
                      senderName={group.senderName}
                      senderColor={group.senderColor}
                      senderAvatarUrl={group.senderAvatarUrl}
                      onDeleteMessage={group.isOwn ? handleDeleteMessage : undefined}
                      onAcceptAttachment={isAdmin ? handleAcceptClick : undefined}
                      onRejectAttachment={isAdmin ? handleRejectClick : undefined}
                      onViewAttachment={handleViewAttachment}
                      isAdmin={isAdmin}
                      isReviewing={isReviewing}
                      getReadStatus={getMessageReadStatus}
                      highlightedMessageId={highlightedMessageId}
                    />
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <TypingIndicator
                  userName={typingUsers[0].name}
                  userColor={typingUsers[0].color}
                  userAvatarUrl={typingUsers[0].avatarUrl}
                />
              )}

              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Review Dialog */}
      <AttachmentReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        attachment={selectedAttachment}
        action={reviewAction}
        onConfirm={handleReviewConfirm}
        isLoading={isReviewing}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteMessage}
        title="Excluir mensagem"
        description={
          messageToDelete?.attachments?.length
            ? 'Tem certeza que deseja excluir esta mensagem? Os arquivos anexados também serão excluídos. Esta ação não pode ser desfeita.'
            : 'Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.'
        }
        variant="danger"
        confirmLabel="Excluir"
        isLoading={isDeleting}
      />

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        attachment={previewAttachment}
        open={!!previewAttachment}
        onOpenChange={(open) => !open && handleClosePreview()}
        onDownload={handleDownloadAttachment}
        signedUrl={previewSignedUrl}
        isLoading={isLoadingPreview}
      />
    </div>
  );
}
