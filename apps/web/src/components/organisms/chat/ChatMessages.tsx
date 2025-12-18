'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { format, parseISO, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Loader2, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { useChat } from '@/providers/ChatProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { DocumentAttachmentCard } from '@/components/molecules/DocumentAttachmentCard';
import { AttachmentReviewDialog } from '@/components/organisms/AttachmentReviewDialog';
import { ConfirmationDialog, useConfirmationDialog } from '@/components/organisms/ConfirmationDialog';
import { useAttachmentReview } from '@/hooks/useAttachmentReview';
import { useDeleteMessage } from '@/hooks/useDeleteMessage';
import { useAttachmentRealtime } from '@medsync/shared/hooks';
import { toast } from 'sonner';
import type { MessageWithSender, SupportConversationWithDetails, ChatAttachment } from '@medsync/shared';

interface ChatMessagesProps {
  conversationId: string;
}

export function ChatMessages({ conversationId }: ChatMessagesProps) {
  const supabase = getSupabaseBrowserClient();
  const { user } = useSupabaseAuth();
  const { markAsRead, conversations } = useChat();
  const { activeRole } = useOrganization();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [conversation, setConversation] = useState<SupportConversationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);

  // Admin can be owner or admin role from user_organizations
  const isAdmin = activeRole === 'owner' || activeRole === 'admin';
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatAttachment | null>(null);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject'>('accept');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook for attachment review operations
  const { acceptAttachment, rejectAttachment, isLoading: isReviewing } = useAttachmentReview();

  // Hook for deleting messages
  const { deleteMessage, isDeleting } = useDeleteMessage();
  const {
    isOpen: isDeleteDialogOpen,
    data: messageToDelete,
    openConfirmation: openDeleteDialog,
    closeConfirmation: closeDeleteDialog,
  } = useConfirmationDialog<MessageWithSender>();

  // Get staff ID for current user (if they are also a medical_staff)
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
      }
    };
    getStaffInfo();
  }, [user?.id, supabase]);

  /**
   * Associates attachments to messages using message_id or fallback to sender_id + timestamp
   */
  const associateAttachmentsToMessages = useCallback(
    (messagesData: any[], attachmentsData: ChatAttachment[]) => {
      // Track which attachments have been assigned
      const assignedAttachmentIds = new Set<string>();

      return messagesData.map((msg) => {
        // First: try to match by message_id
        let msgAttachments = attachmentsData.filter(
          (a) => a.message_id === msg.id && !assignedAttachmentIds.has(a.id)
        );

        // Fallback: if no attachments found and message contains "Anexo enviado"
        if (msgAttachments.length === 0 && msg.content?.includes('Anexo enviado')) {
          const msgTime = new Date(msg.created_at).getTime();
          // Find attachments from same sender created within 10 seconds of the message
          msgAttachments = attachmentsData.filter((a) => {
            if (assignedAttachmentIds.has(a.id)) return false;
            if (a.message_id !== null) return false;

            const attTime = new Date(a.created_at).getTime();
            const timeDiff = Math.abs(attTime - msgTime);

            // Match by sender_id (staff) or if message has no sender_id (admin message)
            const senderMatch = a.sender_id === msg.sender_id;

            return senderMatch && timeDiff < 10000; // 10 seconds window
          });
        }

        // Mark these attachments as assigned
        msgAttachments.forEach((a) => assignedAttachmentIds.add(a.id));

        return { ...msg, attachments: msgAttachments };
      });
    },
    []
  );

  // Load messages with attachments
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      // Load messages separately (without relying on message_id relation)
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:medical_staff (id, name, color, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // Load ALL attachments for this conversation by conversation_id
      const { data: attachmentsData } = await supabase
        .from('chat_attachments')
        .select(`
          id,
          conversation_id,
          message_id,
          sender_id,
          file_name,
          file_type,
          file_path,
          file_size,
          status,
          rejected_reason,
          reviewed_by,
          reviewed_at,
          created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        // Associate attachments to messages
        const messagesWithAttachments = associateAttachmentsToMessages(
          messagesData,
          attachmentsData || []
        );

        // Enrich messages with admin sender info if needed
        const enrichedMessages = messagesWithAttachments.map((msg) => {
          // Check if this is an admin message
          if (msg.admin_sender_id && !msg.sender_id) {
            return {
              ...msg,
              sender: { id: msg.admin_sender_id, name: 'Administrador', color: '#6366F1' },
              is_own: msg.admin_sender_id === user?.id,
            };
          }
          return {
            ...msg,
            is_own: msg.sender_id === staffId,
          };
        });
        setMessages(enrichedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, staffId, supabase, user?.id, associateAttachmentsToMessages]);

  // Update conversation from context
  useEffect(() => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) {
      setConversation(conv);
    }
  }, [conversationId, conversations]);

  // Load messages when conversationId or staffId changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Mark as read once when conversation is opened (separate from loadMessages)
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId]); // Only run when conversationId changes, not markAsRead

  // Subscribe to new messages
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
          // Fetch the full message with sender info
          const { data: newMsg } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:medical_staff (id, name, color, avatar_url)
            `)
            .eq('id', payload.new.id)
            .maybeSingle();

          if (newMsg) {
            let enrichedMsg: any = { ...newMsg, is_own: newMsg.sender_id === staffId, attachments: [] };

            // Handle admin messages
            if (newMsg.admin_sender_id && !newMsg.sender_id) {
              enrichedMsg = {
                ...newMsg,
                sender: { id: newMsg.admin_sender_id, name: 'Administrador', color: '#6366F1' },
                is_own: newMsg.admin_sender_id === user?.id,
                attachments: [],
              };
            }

            // If message contains "Anexo enviado", fetch attachments for this conversation
            // and associate them using the same logic as loadMessages
            if (newMsg.content?.includes('Anexo enviado')) {
              const msgTime = new Date(newMsg.created_at).getTime();
              // Fetch attachments created around the same time by the same sender
              const { data: attachmentsData } = await supabase
                .from('chat_attachments')
                .select(`
                  id,
                  conversation_id,
                  message_id,
                  sender_id,
                  file_name,
                  file_type,
                  file_path,
                  file_size,
                  status,
                  rejected_reason,
                  reviewed_by,
                  reviewed_at,
                  created_at
                `)
                .eq('conversation_id', conversationId)
                .eq('sender_id', newMsg.sender_id)
                .is('message_id', null)
                .gte('created_at', new Date(msgTime - 10000).toISOString())
                .lte('created_at', new Date(msgTime + 10000).toISOString());

              if (attachmentsData && attachmentsData.length > 0) {
                enrichedMsg.attachments = attachmentsData;
              }
            }

            setMessages((prev) => [...prev, enrichedMsg]);
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
          // Remove deleted message from local state
          const deletedId = payload.old?.id;
          if (deletedId) {
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, staffId, supabase, user?.id]);

  // Handle real-time attachment status changes
  const handleAttachmentStatusChange = useCallback(
    (updatedAttachment: ChatAttachment) => {
      // Update messages with the new attachment status
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (!msg.attachments || msg.attachments.length === 0) return msg;

          // Check if this message contains the updated attachment
          const hasAttachment = msg.attachments.some(
            (att) => att.id === updatedAttachment.id
          );

          if (!hasAttachment) return msg;

          // Update the specific attachment in this message
          return {
            ...msg,
            attachments: msg.attachments.map((att) =>
              att.id === updatedAttachment.id ? updatedAttachment : att
            ),
          };
        })
      );

      // Show toast notification
      if (updatedAttachment.status === 'accepted') {
        toast.success('Documento Aprovado', {
          description: `${updatedAttachment.file_name} foi aprovado`,
        });
      } else if (updatedAttachment.status === 'rejected') {
        toast.error('Documento Rejeitado', {
          description: updatedAttachment.rejected_reason || `${updatedAttachment.file_name} foi rejeitado`,
        });
      }
    },
    []
  );

  // Subscribe to real-time attachment status changes
  useAttachmentRealtime(supabase, conversationId, handleAttachmentStatusChange);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatMessageDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const shouldShowDateSeparator = (current: MessageWithSender, index: number) => {
    if (index === 0) return true;
    const previous = messages[index - 1];
    return !isSameDay(parseISO(current.created_at), parseISO(previous.created_at));
  };

  const getConversationTitle = () => {
    if (!conversation) return 'Conversa';
    const staffParticipant = conversation.participants?.[0];
    return staffParticipant?.staff?.name || conversation.name || 'Conversa';
  };

  // Handle attachment review actions
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
            // Reload messages to show updated attachment status
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
            // Reload messages to show updated attachment status
            loadMessages();
          },
        }
      );
    }
  };

  const handleViewAttachment = async (attachment: ChatAttachment) => {
    try {
      // Fetch signed URL from API
      const response = await fetch(`/api/chat/attachments/${attachment.id}/download`);
      if (!response.ok) {
        console.error('Failed to fetch signed URL');
        return;
      }

      const data = await response.json();
      if (data.signedUrl) {
        // Open in new tab
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = (msg: MessageWithSender) => {
    openDeleteDialog(msg);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    deleteMessage(
      { messageId: messageToDelete.id },
      {
        onSuccess: (response) => {
          if (response.success) {
            closeDeleteDialog();
            // Remove message from local state
            setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
          }
        },
      }
    );
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
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        {conversation && (
          <>
            <UserAvatar
              name={getConversationTitle()}
              avatarUrl={conversation.participants?.[0]?.staff?.avatar_url}
              color={conversation.participants?.[0]?.staff?.color}
              size="md"
            />
            <div>
              <h2 className="font-semibold">{getConversationTitle()}</h2>
              <p className="text-sm text-muted-foreground">
                Conversa de suporte
              </p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem ainda
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Envie uma mensagem para iniciar a conversa
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const showDate = shouldShowDateSeparator(msg, index);
              const isOwn = msg.is_own;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {formatMessageDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      'flex gap-2 max-w-[80%] group',
                      isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    {/* Delete button - visible on hover for own messages */}
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteMessage(msg)}
                        className="self-center opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Excluir mensagem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {!isOwn && (
                      <UserAvatar
                        name={msg.sender?.name || '?'}
                        avatarUrl={msg.sender?.avatar_url}
                        color={msg.sender?.color}
                        size="sm"
                        className="flex-shrink-0"
                      />
                    )}
                    <div className="flex flex-col gap-2">
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        )}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium text-primary mb-1">
                            {msg.sender?.name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            isOwn
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          )}
                        >
                          {format(parseISO(msg.created_at), 'HH:mm')}
                        </p>
                      </div>

                      {/* Display attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2">
                          {msg.attachments.map((attachment) => (
                            <DocumentAttachmentCard
                              key={attachment.id}
                              attachment={attachment}
                              onAccept={isAdmin ? () => handleAcceptClick(attachment) : undefined}
                              onReject={isAdmin ? () => handleRejectClick(attachment) : undefined}
                              onView={() => handleViewAttachment(attachment)}
                              showActions={isAdmin && attachment.status === 'pending'}
                              isLoading={isReviewing}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
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

      {/* Delete Message Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteMessage}
        title="Excluir mensagem"
        description={
          messageToDelete?.attachments && messageToDelete.attachments.length > 0
            ? 'Tem certeza que deseja excluir esta mensagem? Os arquivos anexados tambem serao excluidos. Esta acao nao pode ser desfeita.'
            : 'Tem certeza que deseja excluir esta mensagem? Esta acao nao pode ser desfeita.'
        }
        variant="danger"
        confirmLabel="Excluir"
        isLoading={isDeleting}
      />
    </div>
  );
}
