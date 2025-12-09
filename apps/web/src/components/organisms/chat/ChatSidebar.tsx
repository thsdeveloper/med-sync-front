'use client';

import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useChat } from '@/providers/ChatProvider';
import type { SupportConversationWithDetails } from '@medsync/shared';

interface ChatSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ChatSidebar({ selectedId, onSelect }: ChatSidebarProps) {
  const { conversations, isLoading } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return 'Ontem';
    }
    return format(date, 'dd/MM', { locale: ptBR });
  };

  const getConversationName = (conv: SupportConversationWithDetails) => {
    const staffParticipant = conv.participants?.[0];
    return staffParticipant?.staff?.name || conv.name || 'Conversa';
  };

  const getStaffColor = (conv: SupportConversationWithDetails) => {
    const staffParticipant = conv.participants?.[0];
    return staffParticipant?.staff?.color || '#0066CC';
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full border-r">
        <div className="p-4 border-b">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r w-80 flex-shrink-0">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Nenhuma conversa encontrada'
                : 'Nenhuma mensagem de suporte'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mensagens dos profissionais aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => {
              const hasUnread = (conv.unread_count || 0) > 0;
              const isSelected = selectedId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-accent/50',
                    isSelected && 'bg-accent'
                  )}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback
                      style={{ backgroundColor: getStaffColor(conv) }}
                      className="text-white"
                    >
                      {getInitials(getConversationName(conv))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'font-medium truncate',
                          hasUnread ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {getConversationName(conv)}
                      </span>
                      {conv.last_message && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={cn(
                          'text-sm truncate flex-1',
                          hasUnread
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                        )}
                      >
                        {conv.last_message?.content || 'Nenhuma mensagem'}
                      </p>
                      {hasUnread && (
                        <Badge variant="default" className="h-5 min-w-5 px-1">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
