'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useOrganization } from './OrganizationProvider';
import { useSupabaseAuth } from './SupabaseAuthProvider';
import type { Notification, ShiftSwapRequestWithDetails } from '@medsync/shared';

// Tipo estendido de notificação com detalhes do swap
type NotificationWithSwapDetails = Notification & {
  swap_request?: ShiftSwapRequestWithDetails;
};

type NotificationContextValue = {
  notifications: NotificationWithSwapDetails[];
  unreadCount: number;
  pendingSwapsCount: number; // Trocas aguardando aprovação admin
  isLoading: boolean;
  isConnected: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const supabase = getSupabaseBrowserClient();
  const { user } = useSupabaseAuth();
  const { activeOrganization } = useOrganization();

  const [notifications, setNotifications] = useState<NotificationWithSwapDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingSwapsCount, setPendingSwapsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Carregar contagem de trocas pendentes de aprovação admin
  const loadPendingSwapsCount = useCallback(async () => {
    if (!activeOrganization?.id) {
      setPendingSwapsCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('shift_swap_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', activeOrganization.id)
        .eq('admin_status', 'pending_admin');

      if (error) {
        console.error('Error loading pending swaps count:', error);
        return;
      }

      setPendingSwapsCount(count ?? 0);
    } catch (error) {
      console.error('Error loading pending swaps count:', error);
    }
  }, [activeOrganization?.id, supabase]);

  // Carregar notificações do usuário
  const loadNotifications = useCallback(async () => {
    if (!activeOrganization?.id || !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Buscar notificações do admin (user_id)
      const { data: notifData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', activeOrganization.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      if (notifData) {
        // Para notificações de swap, buscar detalhes
        const notificationsWithDetails = await Promise.all(
          notifData.map(async (notif) => {
            if (notif.type.startsWith('shift_swap_') && notif.data?.swap_request_id) {
              const { data: swapRequest } = await supabase
                .from('shift_swap_requests')
                .select(`
                  *,
                  requester:medical_staff!shift_swap_requests_requester_id_fkey (
                    id, name, color, especialidades(nome)
                  ),
                  target_staff:medical_staff!shift_swap_requests_target_staff_id_fkey (
                    id, name, color, especialidades(nome)
                  ),
                  original_shift:shifts!shift_swap_requests_original_shift_id_fkey (
                    id, start_time, end_time, status,
                    sectors (name, color)
                  ),
                  target_shift:shifts!shift_swap_requests_target_shift_id_fkey (
                    id, start_time, end_time, status,
                    sectors (name, color)
                  )
                `)
                .eq('id', notif.data.swap_request_id)
                .maybeSingle();

              return {
                ...notif,
                swap_request: swapRequest || undefined,
              } as NotificationWithSwapDetails;
            }

            return notif as NotificationWithSwapDetails;
          })
        );

        setNotifications(notificationsWithDetails);

        // Calcular total de não lidas
        const totalUnread = notificationsWithDetails.filter((n) => !n.read).length;
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganization?.id, user?.id, supabase]);

  // Carregar notificações e contagem de trocas pendentes
  useEffect(() => {
    loadNotifications();
    loadPendingSwapsCount();
  }, [loadNotifications, loadPendingSwapsCount]);

  // Subscribe para atualizações em tempo real (notificações e trocas)
  useEffect(() => {
    if (!activeOrganization?.id || !user?.id) return;

    const channel = supabase
      .channel(`admin-notifications:${activeOrganization.id}`)
      // Notificações do usuário
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      // Trocas de plantão da organização (para atualizar badge de pendentes)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_swap_requests',
          filter: `organization_id=eq.${activeOrganization.id}`,
        },
        () => {
          loadPendingSwapsCount();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrganization?.id, user?.id, supabase, loadNotifications, loadPendingSwapsCount]);

  // Marcar uma notificação como lida
  const markAsRead = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [supabase]
  );

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id || !activeOrganization?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('organization_id', activeOrganization.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }

    // Atualizar estado local
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
    );

    setUnreadCount(0);
  }, [user?.id, activeOrganization?.id, supabase]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      pendingSwapsCount,
      isLoading,
      isConnected,
      loadNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, pendingSwapsCount, isLoading, isConnected, loadNotifications, markAsRead, markAllAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
};
