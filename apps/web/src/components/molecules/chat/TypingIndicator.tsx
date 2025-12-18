'use client';

import { memo } from 'react';
import { TypingDots } from '@/components/atoms/chat';
import { UserAvatar } from '@/components/atoms';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  userName: string;
  userColor?: string;
  userAvatarUrl?: string;
  className?: string;
}

/**
 * TypingIndicator - Shows "[User] is typing..." with animated dots
 */
export const TypingIndicator = memo(function TypingIndicator({
  userName,
  userColor,
  userAvatarUrl,
  className,
}: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      <UserAvatar
        name={userName}
        avatarUrl={userAvatarUrl}
        color={userColor}
        size="sm"
        className="flex-shrink-0"
      />
      <div className="flex items-center gap-2 bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
        <TypingDots />
      </div>
    </div>
  );
});
