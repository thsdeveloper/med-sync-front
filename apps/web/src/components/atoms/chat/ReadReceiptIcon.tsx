'use client';

import { memo } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReadStatus = 'sent' | 'delivered' | 'read';

interface ReadReceiptIconProps {
  status: ReadStatus;
  className?: string;
}

/**
 * ReadReceiptIcon - Shows message delivery/read status
 * - sent: Single gray check
 * - delivered: Double gray checks
 * - read: Double blue checks
 */
export const ReadReceiptIcon = memo(function ReadReceiptIcon({
  status,
  className,
}: ReadReceiptIconProps) {
  const baseClassName = cn('h-3.5 w-3.5 flex-shrink-0', className);

  switch (status) {
    case 'sent':
      return (
        <Check
          className={cn(baseClassName, 'text-muted-foreground/70')}
          aria-label="Mensagem enviada"
        />
      );
    case 'delivered':
      return (
        <CheckCheck
          className={cn(baseClassName, 'text-muted-foreground/70')}
          aria-label="Mensagem entregue"
        />
      );
    case 'read':
      return (
        <CheckCheck
          className={cn(baseClassName, 'text-primary')}
          aria-label="Mensagem lida"
        />
      );
    default:
      return null;
  }
});
