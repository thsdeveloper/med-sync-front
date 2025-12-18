'use client';

import { memo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { MessageTimestamp } from './MessageTimestamp';
import { ReadReceiptIcon, type ReadStatus } from './ReadReceiptIcon';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  readStatus?: ReadStatus;
  isHighlighted?: boolean;
  className?: string;
}

/**
 * MessageBubble - Individual message bubble with styling
 */
export const MessageBubble = memo(
  forwardRef<HTMLDivElement, MessageBubbleProps>(function MessageBubble(
    {
      content,
      timestamp,
      isOwn,
      senderName,
      readStatus,
      isHighlighted,
      className,
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl px-4 py-2 max-w-full break-words',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm',
          isHighlighted && 'ring-2 ring-yellow-400 ring-offset-2',
          className
        )}
      >
        {/* Sender name for received messages */}
        {!isOwn && senderName && (
          <p className="text-xs font-medium text-primary mb-1">{senderName}</p>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap">{content}</p>

        {/* Footer: timestamp and read receipt */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}
        >
          <MessageTimestamp
            timestamp={timestamp}
            variant="inline"
            className={isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}
          />
          {isOwn && readStatus && <ReadReceiptIcon status={readStatus} />}
        </div>
      </div>
    );
  })
);
