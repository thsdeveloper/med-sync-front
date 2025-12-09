'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/providers/ChatProvider';
import type { SupportConversationWithDetails } from '@medsync/shared';

export function ChatNotificationIcon() {
  const router = useRouter();
  const { conversations, unreadCount, isLoading, markAsRead } = useChat();
  const [open, setOpen] = useState(false);

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
    // Get the staff participant name (the user who started the support chat)
    const staffParticipant = conv.participants?.[0];
    return staffParticipant?.staff?.name || conv.name || 'Conversa';
  };

  const getStaffColor = (conv: SupportConversationWithDetails) => {
    const staffParticipant = conv.participants?.[0];
    return staffParticipant?.staff?.color || '#0066CC';
  };

  const handleConversationClick = (conv: SupportConversationWithDetails) => {
    markAsRead(conv.id);
    setOpen(false);
    router.push(`/dashboard/chat?id=${conv.id}`);
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push('/dashboard/chat');
  };

  // Get only conversations with messages
  const recentConversations = conversations
    .filter((c) => c.last_message)
    .slice(0, 5);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Mensagens de suporte</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold">Mensagens</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} nova(s)</Badge>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : recentConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma mensagem ainda</p>
            <p className="text-xs mt-1">
              Mensagens de suporte dos profissionais aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {recentConversations.map((conv) => (
              <DropdownMenuItem
                key={conv.id}
                className="flex items-start gap-3 p-3 cursor-pointer focus:bg-accent"
                onClick={() => handleConversationClick(conv)}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback
                    style={{ backgroundColor: getStaffColor(conv) }}
                    className="text-white text-sm"
                  >
                    {getInitials(getConversationName(conv))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-medium truncate ${
                        (conv.unread_count || 0) > 0 ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {getConversationName(conv)}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {conv.last_message && formatTime(conv.last_message.created_at)}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      (conv.unread_count || 0) > 0
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {conv.last_message?.content || 'Nenhuma mensagem'}
                  </p>
                </div>
                {(conv.unread_count || 0) > 0 && (
                  <Badge
                    variant="default"
                    className="h-5 min-w-5 px-1 flex-shrink-0"
                  >
                    {conv.unread_count}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm font-medium text-primary cursor-pointer"
          onClick={handleViewAll}
        >
          Ver todas as mensagens
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
