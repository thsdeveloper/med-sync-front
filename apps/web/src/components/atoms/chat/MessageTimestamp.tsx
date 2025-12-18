'use client';

import { memo } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageTimestampProps {
  timestamp: string;
  variant?: 'inline' | 'subtle';
  className?: string;
}

/**
 * MessageTimestamp - Displays formatted message time
 */
export const MessageTimestamp = memo(function MessageTimestamp({
  timestamp,
  variant = 'inline',
  className,
}: MessageTimestampProps) {
  const formattedTime = format(parseISO(timestamp), 'HH:mm');

  return (
    <time
      dateTime={timestamp}
      className={cn(
        'text-xs select-none',
        variant === 'inline' && 'text-current opacity-70',
        variant === 'subtle' && 'text-muted-foreground',
        className
      )}
    >
      {formattedTime}
    </time>
  );
});
