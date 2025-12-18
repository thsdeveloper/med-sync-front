'use client';

import { useCallback, useMemo } from 'react';
import { parseISO } from 'date-fns';
import type { ReadStatus } from '@/components/atoms/chat/ReadReceiptIcon';

interface UseReadReceiptsOptions {
  /**
   * The last_read_at timestamp from the conversation participant
   * This is when the other party last read the conversation
   */
  participantLastReadAt: string | null | undefined;
}

interface UseReadReceiptsReturn {
  /**
   * Returns the read status for a message based on its created_at timestamp
   */
  getReadStatus: (messageCreatedAt: string) => ReadStatus;
  /**
   * Check if a specific message has been read
   */
  isMessageRead: (messageCreatedAt: string) => boolean;
}

/**
 * Hook to determine read receipt status for messages
 *
 * Uses the participant's last_read_at timestamp to determine if messages have been read.
 * This is a simple but effective approach that doesn't require additional database tables.
 *
 * Logic:
 * - If message.created_at <= participant.last_read_at -> 'read'
 * - If message.created_at > participant.last_read_at -> 'delivered'
 * - If no participant data -> 'sent'
 */
export function useReadReceipts({
  participantLastReadAt,
}: UseReadReceiptsOptions): UseReadReceiptsReturn {
  const lastReadTime = useMemo(() => {
    if (!participantLastReadAt) return null;
    return parseISO(participantLastReadAt).getTime();
  }, [participantLastReadAt]);

  const isMessageRead = useCallback(
    (messageCreatedAt: string): boolean => {
      if (!lastReadTime) return false;
      const messageTime = parseISO(messageCreatedAt).getTime();
      return messageTime <= lastReadTime;
    },
    [lastReadTime]
  );

  const getReadStatus = useCallback(
    (messageCreatedAt: string): ReadStatus => {
      if (!lastReadTime) {
        return 'sent';
      }

      const messageTime = parseISO(messageCreatedAt).getTime();

      if (messageTime <= lastReadTime) {
        return 'read';
      }

      return 'delivered';
    },
    [lastReadTime]
  );

  return {
    getReadStatus,
    isMessageRead,
  };
}
