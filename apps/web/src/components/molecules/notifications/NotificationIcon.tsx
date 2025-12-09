'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ArrowLeftRight, Calendar, CheckCircle, XCircle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/providers/NotificationProvider';
import type { Notification, NotificationType } from '@medsync/shared';

// Ícones por tipo de notificação
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'shift_swap_request':
    case 'shift_swap_accepted':
      return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
    case 'shift_swap_admin_approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'shift_swap_rejected':
    case 'shift_swap_admin_rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'shift_assigned':
    case 'shift_reminder':
      return <Calendar className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

export function NotificationIcon() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

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

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setOpen(false);

    // Navegar baseado no tipo de notificação
    if (notif.type.startsWith('shift_swap_')) {
      router.push('/dashboard/trocas');
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push('/dashboard/trocas');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Pegar apenas as 5 notificações mais recentes
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{unreadCount} nova(s)</Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas
              </Button>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma notificação</p>
            <p className="text-xs mt-1">Notificações de trocas de plantão aparecerão aqui</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {recentNotifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`flex items-start gap-3 p-3 cursor-pointer focus:bg-accent ${
                  !notif.read ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-medium truncate text-sm ${
                        !notif.read ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {notif.title}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(notif.created_at)}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      !notif.read ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {notif.body}
                  </p>
                </div>
                {!notif.read && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
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
          Ver todas as trocas de plantão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
