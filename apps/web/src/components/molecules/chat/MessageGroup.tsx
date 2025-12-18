'use client';

import { memo, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { MessageBubble, type ReadStatus } from '@/components/atoms/chat';
import { UserAvatar } from '@/components/atoms';
import { DocumentAttachmentCard } from '@/components/molecules/DocumentAttachmentCard';
import { cn } from '@/lib/utils';
import type { MessageWithSender, ChatAttachment } from '@medsync/shared';

interface MessageGroupProps {
  messages: MessageWithSender[];
  isOwn: boolean;
  senderName: string;
  senderColor?: string;
  senderAvatarUrl?: string;
  onDeleteMessage?: (message: MessageWithSender) => void;
  onAcceptAttachment?: (attachment: ChatAttachment) => void;
  onRejectAttachment?: (attachment: ChatAttachment) => void;
  onViewAttachment?: (attachment: ChatAttachment) => void;
  isAdmin?: boolean;
  isReviewing?: boolean;
  getReadStatus?: (message: MessageWithSender) => ReadStatus;
  highlightedMessageId?: string | null;
}

/**
 * MessageGroup - Groups consecutive messages from the same sender
 * Shows avatar only once at top, groups messages with reduced spacing
 */
export const MessageGroup = memo(function MessageGroup({
  messages,
  isOwn,
  senderName,
  senderColor,
  senderAvatarUrl,
  onDeleteMessage,
  onAcceptAttachment,
  onRejectAttachment,
  onViewAttachment,
  isAdmin,
  isReviewing,
  getReadStatus,
  highlightedMessageId,
}: MessageGroupProps) {
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  if (messages.length === 0) return null;

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[80%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Avatar - only for received messages */}
      {!isOwn && (
        <UserAvatar
          name={senderName}
          avatarUrl={senderAvatarUrl}
          color={senderColor}
          size="sm"
          className="flex-shrink-0 mt-auto"
        />
      )}

      {/* Messages stack */}
      <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {messages.map((msg, index) => {
          const isFirst = index === 0;
          const isLast = index === messages.length - 1;
          const readStatus = getReadStatus?.(msg);
          const isHighlighted = highlightedMessageId === msg.id;

          return (
            <div key={msg.id} className="group flex items-end gap-1">
              {/* Delete button for own messages */}
              {isOwn && onDeleteMessage && (
                <button
                  onClick={() => onDeleteMessage(msg)}
                  className="self-center opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Excluir mensagem"
                  aria-label="Excluir mensagem"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <div className="flex flex-col gap-1">
                <MessageBubble
                  ref={(el) => {
                    if (el) messageRefs.current.set(msg.id, el);
                  }}
                  content={msg.content}
                  timestamp={msg.created_at}
                  isOwn={isOwn}
                  senderName={isFirst && !isOwn ? senderName : undefined}
                  readStatus={isOwn ? readStatus : undefined}
                  isHighlighted={isHighlighted}
                />

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-2 mt-1">
                    {msg.attachments.map((attachment) => (
                      <DocumentAttachmentCard
                        key={attachment.id}
                        attachment={attachment}
                        onAccept={
                          isAdmin && attachment.status === 'pending' && onAcceptAttachment
                            ? () => onAcceptAttachment(attachment)
                            : undefined
                        }
                        onReject={
                          isAdmin && attachment.status === 'pending' && onRejectAttachment
                            ? () => onRejectAttachment(attachment)
                            : undefined
                        }
                        onView={onViewAttachment ? () => onViewAttachment(attachment) : undefined}
                        showActions={isAdmin && attachment.status === 'pending'}
                        isLoading={isReviewing}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
