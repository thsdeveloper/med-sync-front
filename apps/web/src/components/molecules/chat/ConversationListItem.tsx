'use client';

import { memo } from 'react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/atoms';
import { cn } from '@/lib/utils';
import type { SupportConversationWithDetails } from '@medsync/shared';

interface ConversationListItemProps {
  conversation: SupportConversationWithDetails;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function formatTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Ontem';
  }
  return format(date, 'dd/MM', { locale: ptBR });
}

function getConversationName(conv: SupportConversationWithDetails): string {
  const staffParticipant = conv.participants?.[0];
  return staffParticipant?.staff?.name || conv.name || 'Conversa';
}

function getStaffColor(conv: SupportConversationWithDetails): string {
  const staffParticipant = conv.participants?.[0];
  return staffParticipant?.staff?.color || '#0066CC';
}

function getStaffAvatarUrl(conv: SupportConversationWithDetails): string | undefined {
  const staffParticipant = conv.participants?.[0];
  return staffParticipant?.staff?.avatar_url ?? undefined;
}

export const ConversationListItem = memo(function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationListItemProps) {
  const hasUnread = (conversation.unread_count || 0) > 0;
  const name = getConversationName(conversation);

  return (
    <button
      onClick={() => onSelect(conversation.id)}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left transition-colors',
        'hover:bg-accent/50 active:bg-accent/70',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        isSelected && 'bg-accent'
      )}
      aria-selected={isSelected}
      role="option"
    >
      <UserAvatar
        name={name}
        avatarUrl={getStaffAvatarUrl(conversation)}
        color={getStaffColor(conversation)}
        size="lg"
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'font-medium truncate',
              hasUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {name}
          </span>
          {conversation.last_message && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatTime(conversation.last_message.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p
            className={cn(
              'text-sm truncate flex-1',
              hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {conversation.last_message?.content || 'Nenhuma mensagem'}
          </p>
          {hasUnread && (
            <Badge variant="default" className="h-5 min-w-5 px-1 flex-shrink-0">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
});
