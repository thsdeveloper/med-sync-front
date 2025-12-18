'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface TypingUser {
  id: string;
  name: string;
  color?: string;
  avatarUrl?: string;
}

interface UseTypingIndicatorOptions {
  conversationId: string;
  userId: string;
  userName: string;
  userColor?: string;
  userAvatarUrl?: string;
  enabled?: boolean;
}

interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  startTyping: () => void;
  stopTyping: () => void;
}

const TYPING_TIMEOUT = 5000; // 5 seconds until typing indicator disappears
const BROADCAST_INTERVAL = 3000; // Rebroadcast every 3 seconds while typing

/**
 * Hook for real-time typing indicators using Supabase Presence
 *
 * Uses Supabase Realtime Presence to broadcast and receive typing status.
 * Typing status is ephemeral and not persisted to the database.
 */
export function useTypingIndicator({
  conversationId,
  userId,
  userName,
  userColor,
  userAvatarUrl,
  enabled = true,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof getSupabaseBrowserClient>['channel'] extends (name: string) => infer R ? R : never>(null);

  // Setup presence channel
  useEffect(() => {
    if (!enabled || !conversationId) return;

    const supabase = getSupabaseBrowserClient();
    const channelName = `typing:${conversationId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          // Skip own typing indicator
          if (key === userId) return;

          // Get the most recent presence
          const presence = presences[presences.length - 1] as any;
          if (presence?.isTyping) {
            users.push({
              id: key,
              name: presence.userName || 'Usuário',
              color: presence.userColor,
              avatarUrl: presence.userAvatarUrl,
            });
          }
        });

        setTypingUsers(users);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, userId, enabled]);

  // Clear typing status after timeout
  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (broadcastIntervalRef.current) {
      clearInterval(broadcastIntervalRef.current);
      broadcastIntervalRef.current = null;
    }
  }, []);

  const broadcastTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current) return;

      channelRef.current.track({
        isTyping,
        userName,
        userColor,
        userAvatarUrl,
        lastTyping: new Date().toISOString(),
      });
    },
    [userName, userColor, userAvatarUrl]
  );

  const startTyping = useCallback(() => {
    // Clear any existing timeout
    clearTypingTimeout();

    // Broadcast typing status
    broadcastTypingStatus(true);

    // Setup interval to keep broadcasting while typing
    broadcastIntervalRef.current = setInterval(() => {
      broadcastTypingStatus(true);
    }, BROADCAST_INTERVAL);

    // Setup timeout to stop typing after inactivity
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTypingStatus(false);
      clearTypingTimeout();
    }, TYPING_TIMEOUT);
  }, [broadcastTypingStatus, clearTypingTimeout]);

  const stopTyping = useCallback(() => {
    clearTypingTimeout();
    broadcastTypingStatus(false);
  }, [broadcastTypingStatus, clearTypingTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTypingTimeout();
    };
  }, [clearTypingTimeout]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
