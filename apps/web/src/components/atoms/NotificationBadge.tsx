'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'destructive' | 'warning' | 'success';
type BadgeSize = 'sm' | 'md' | 'lg';

interface NotificationBadgeProps {
  count: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  maxCount?: number;
  showZero?: boolean;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  warning: 'bg-amber-500 text-white',
  success: 'bg-emerald-500 text-white',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'h-4 min-w-4 text-[10px] px-1',
  md: 'h-5 min-w-5 text-xs px-1.5',
  lg: 'h-6 min-w-6 text-sm px-2',
};

export const NotificationBadge = memo(function NotificationBadge({
  count,
  variant = 'destructive',
  size = 'md',
  maxCount = 99,
  showZero = false,
  pulse = false,
  className,
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium leading-none',
        variantStyles[variant],
        sizeStyles[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      {displayCount}
    </span>
  );
});
