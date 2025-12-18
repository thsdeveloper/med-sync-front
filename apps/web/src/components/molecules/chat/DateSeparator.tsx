'use client';

import { memo } from 'react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateSeparatorProps {
  date: string;
}

function formatMessageDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "dd 'de' MMMM", { locale: ptBR });
}

/**
 * DateSeparator - Shows date separator between message groups
 */
export const DateSeparator = memo(function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
        {formatMessageDate(date)}
      </span>
    </div>
  );
});
