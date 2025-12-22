import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

interface UnreadCountContextValue {
  totalUnreadCount: number;
  isLoading: boolean;
  refreshUnreadCount: () => Promise<void>;
  /** Set the currently active conversation to prevent incrementing for messages in that conversation */
  setActiveConversation: (conversationId: string | null) => void;
}

const UnreadCountContext = createContext<UnreadCountContextValue | undefined>(undefined);

export function UnreadCountProvider({ children }: { children: React.ReactNode }) {
  const { staff, isAuthenticated } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for managing subscriptions
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const participantsChannelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  // Active conversation ref - used to skip incrementing for messages in the current conversation
  const activeConversationRef = useRef<string | null>(null);

  // Function to set the active conversation (called by chat screens)
  const setActiveConversation = useCallback((conversationId: string | null) => {
    console.log('[UnreadCount] Active conversation set to:', conversationId);
    activeConversationRef.current = conversationId;
  }, []);

  // Fetch unread count from the database
  const fetchUnreadCount = useCallback(async () => {
    if (!staff?.id) {
      setTotalUnreadCount(0);
      setIsLoading(false);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(staff.id)) {
      console.error('[UnreadCount] Invalid staff ID format:', staff.id);
      setTotalUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[UnreadCount] Fetching unread count for staff:', staff.id);

      const { data, error } = await supabase.rpc('get_staff_total_unread_count', {
        p_staff_id: staff.id,
      });

      if (error) {
        // Only log as error if it's not a known transient issue
        const isTransientError = error.message?.includes('Failed to fetch') ||
                                 error.message?.includes('network') ||
                                 error.code === 'PGRST301'; // JWT expired

        if (isTransientError) {
          console.warn('[UnreadCount] Transient error (will retry):', error.message);
        } else {
          console.error('[UnreadCount] Error fetching unread count:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
        }
        return;
      }

      if (isMountedRef.current) {
        console.log('[UnreadCount] Total unread count:', data);
        setTotalUnreadCount(data ?? 0);
      }
    } catch (error) {
      console.error('[UnreadCount] Exception fetching unread count:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [staff?.id]);

  // Expose refresh function
  const refreshUnreadCount = useCallback(async () => {
    console.log('[UnreadCount] refreshUnreadCount() called - fetching new count...');
    setIsLoading(true);
    await fetchUnreadCount();
    console.log('[UnreadCount] refreshUnreadCount() completed');
  }, [fetchUnreadCount]);

  // Cleanup subscriptions
  const cleanup = useCallback(() => {
    if (messagesChannelRef.current) {
      try {
        supabase.removeChannel(messagesChannelRef.current);
      } catch (error) {
        console.log('[UnreadCount] Error removing messages channel:', error);
      }
      messagesChannelRef.current = null;
    }

    if (participantsChannelRef.current) {
      try {
        supabase.removeChannel(participantsChannelRef.current);
      } catch (error) {
        console.log('[UnreadCount] Error removing participants channel:', error);
      }
      participantsChannelRef.current = null;
    }
  }, []);

  // Setup realtime subscriptions
  const setupSubscriptions = useCallback(() => {
    if (!staff?.id) {
      console.log('[UnreadCount] No staff ID, skipping subscriptions');
      return;
    }

    // Cleanup any existing subscriptions
    cleanup();

    const staffId = staff.id;
    console.log('[UnreadCount] Setting up subscriptions for staff:', staffId);

    // Subscribe to new messages in chat_messages table
    // Fase 3: Use incremental update instead of full refetch
    const messagesChannel = supabase
      .channel(`unread-messages-${staffId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('[UnreadCount] New message received:', payload);

          const newRecord = payload.new as {
            sender_id?: string;
            admin_sender_id?: string;
            conversation_id?: string;
          };

          // Skip if the message sender is the current user
          if (newRecord.sender_id === staffId) {
            console.log('[UnreadCount] Message from current user, skipping');
            return;
          }

          // Skip if the message is from the currently active conversation
          if (newRecord.conversation_id === activeConversationRef.current) {
            console.log('[UnreadCount] Message from active conversation, skipping increment');
            return;
          }

          console.log('[UnreadCount] Message from another user in inactive conversation, incrementing count...');
          // Increment count locally instead of full refetch
          if (isMountedRef.current) {
            setTotalUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[UnreadCount] Messages channel status:', status, err ?? '');
      });

    messagesChannelRef.current = messagesChannel;

    // Subscribe to updates on chat_participants (for last_read_at changes)
    const participantsChannel = supabase
      .channel(`unread-participants-${staffId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `staff_id=eq.${staffId}`,
        },
        (payload) => {
          console.log('[UnreadCount] Participant updated:', payload);
          // Refetch when last_read_at changes (user marked messages as read)
          fetchUnreadCount();
        }
      )
      .subscribe((status, err) => {
        console.log('[UnreadCount] Participants channel status:', status, err ?? '');
      });

    participantsChannelRef.current = participantsChannel;
  }, [staff?.id, cleanup, fetchUnreadCount]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isAuthenticated && staff?.id) {
        console.log('[UnreadCount] App became active, refreshing count...');
        fetchUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, staff?.id, fetchUnreadCount]);

  // Main effect: setup when authenticated
  useEffect(() => {
    isMountedRef.current = true;

    if (isAuthenticated && staff?.id) {
      fetchUnreadCount();
      setupSubscriptions();
    } else {
      setTotalUnreadCount(0);
      setIsLoading(false);
      cleanup();
    }

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [isAuthenticated, staff?.id, fetchUnreadCount, setupSubscriptions, cleanup]);

  const value: UnreadCountContextValue = {
    totalUnreadCount,
    isLoading,
    refreshUnreadCount,
    setActiveConversation,
  };

  return (
    <UnreadCountContext.Provider value={value}>
      {children}
    </UnreadCountContext.Provider>
  );
}

/**
 * Hook to access unread count context
 * @throws Error if used outside of UnreadCountProvider
 */
export function useUnreadCount() {
  const context = useContext(UnreadCountContext);
  if (context === undefined) {
    throw new Error('useUnreadCount must be used within an UnreadCountProvider');
  }
  return context;
}
