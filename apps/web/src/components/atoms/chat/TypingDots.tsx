'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface TypingDotsProps {
  className?: string;
}

/**
 * TypingDots - Animated typing indicator dots
 */
export const TypingDots = memo(function TypingDots({ className }: TypingDotsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)} aria-label="Digitando">
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '600ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: '150ms', animationDuration: '600ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: '300ms', animationDuration: '600ms' }}
      />
    </div>
  );
});
