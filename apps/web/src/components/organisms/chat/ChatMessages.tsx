'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { format, parseISO, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { useChat } from '@/providers/ChatProvider';
import { DocumentAttachmentCard } from '@/components/molecules/DocumentAttachmentCard';
import { AttachmentReviewDialog } from '@/components/organisms/AttachmentReviewDialog';
import { useAttachmentReview } from '@/hooks/useAttachmentReview';
import type { MessageWithSender, SupportConversationWithDetails, ChatAttachment } from '@medsync/shared';

interface ChatMessagesProps {
  conversationId: string;
}

export function ChatMessages({ conversationId }: ChatMessagesProps) {
  const supabase = getSupabaseBrowserClient();
  const { user } = useSupabaseAuth();
  const { markAsRead, conversations } = useChat();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [conversation, setConversation] = useState<SupportConversationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatAttachment | null>(null);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject'>('accept');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook for attachment review operations
  const { acceptAttachment, rejectAttachment, isLoading: isReviewing } = useAttachmentReview();

  // Get staff ID and admin status for current user
  useEffect(() => {
    const getStaffInfo = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('medical_staff')
        .select('id, funcao')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setStaffId(data.id);
        setIsAdmin(data.funcao === 'Administrador');
      }
    };
    getStaffInfo();
  }, [user?.id, supabase]);

  // Load messages with attachments
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      // Load messages with attachments
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:medical_staff (id, name, color),
          attachments:chat_attachments (
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
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        // Enrich messages with admin sender info if needed
        const enrichedMessages = messagesData.map((msg) => {
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
  }, [conversationId, staffId, supabase, user?.id]);

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
              sender:medical_staff (id, name, color)
            `)
            .eq('id', payload.new.id)
            .maybeSingle();

          if (newMsg) {
            let enrichedMsg = { ...newMsg, is_own: newMsg.sender_id === staffId };

            // Handle admin messages
            if (newMsg.admin_sender_id && !newMsg.sender_id) {
              enrichedMsg = {
                ...newMsg,
                sender: { id: newMsg.admin_sender_id, name: 'Administrador', color: '#6366F1' },
                is_own: newMsg.admin_sender_id === user?.id,
              };
            }

            setMessages((prev) => [...prev, enrichedMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, staffId, supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

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
            <Avatar className="h-10 w-10">
              <AvatarFallback
                style={{
                  backgroundColor:
                    conversation.participants?.[0]?.staff?.color || '#0066CC',
                }}
                className="text-white"
              >
                {getInitials(getConversationTitle())}
              </AvatarFallback>
            </Avatar>
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
                      'flex gap-2 max-w-[80%]',
                      isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback
                          style={{
                            backgroundColor: msg.sender?.color || '#6B7280',
                          }}
                          className="text-white text-xs"
                        >
                          {getInitials(msg.sender?.name || '?')}
                        </AvatarFallback>
                      </Avatar>
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
    </div>
  );
}
