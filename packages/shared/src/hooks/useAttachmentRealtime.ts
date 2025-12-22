/**
 * useAttachmentRealtime Hook
 *
 * Custom React hook for subscribing to real-time attachment status changes via Supabase Realtime.
 * Listens to UPDATE events on chat_attachments table for a specific conversation.
 *
 * Features:
 * - Real-time subscription to attachment status changes
 * - Filtered by conversation_id to only receive relevant updates
 * - Automatic cleanup on unmount to prevent memory leaks
 * - Graceful handling of network interruptions with automatic reconnection
 * - TypeScript type safety with ChatAttachment type
 * - Callback interface for status change events
 *
 * @hook
 * @example
 * ```tsx
 * const handleStatusChange = useCallback((attachment: ChatAttachment) => {
 *   // Update local state or show notification
 *   setAttachments(prev => prev.map(a =>
 *     a.id === attachment.id ? attachment : a
 *   ));
 * }, []);
 *
 * useAttachmentRealtime(supabaseClient, conversationId, handleStatusChange);
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { ChatAttachment } from '../schemas/chat.schema';

export interface UseAttachmentRealtimeOptions {
  /**
   * Callback fired when an attachment status changes
   * @param attachment The updated attachment record
   */
  onStatusChange?: (attachment: ChatAttachment) => void;

  /**
   * Callback fired when an attachment is deleted
   * @param attachmentId The ID of the deleted attachment
   */
  onDelete?: (attachmentId: string) => void;

  /**
   * Whether the subscription is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Subscribe to real-time attachment status changes for a conversation
 *
 * @param supabase - Supabase client instance (platform-agnostic)
 * @param conversationId - ID of the conversation to monitor attachments for
 * @param onStatusChange - Callback fired when attachment status changes
 * @param options - Additional configuration options (includes onDelete callback)
 */
export function useAttachmentRealtime(
  supabase: SupabaseClient,
  conversationId: string | null,
  onStatusChange?: (attachment: ChatAttachment) => void,
  options: Omit<UseAttachmentRealtimeOptions, 'onStatusChange'> = {}
) {
  const { enabled = true, onDelete } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateRef = useRef<{ id: string; status: string; timestamp: number } | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Function to create and subscribe to channel
  const createChannel = useCallback(() => {
    if (!conversationId || (!onStatusChange && !onDelete)) {
      return null;
    }

    const channelName = `chat_attachments:${conversationId}`;

    // Build channel with event subscriptions
    let channel = supabase.channel(channelName);

    // Subscribe to UPDATE events on chat_attachments table (for status changes)
    if (onStatusChange) {
      channel = channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_attachments',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedAttachment = payload.new as ChatAttachment;

          // Deduplicate events: prevent processing same status change twice
          const now = Date.now();
          const lastUpdate = lastUpdateRef.current;
          if (
            lastUpdate &&
            lastUpdate.id === updatedAttachment.id &&
            lastUpdate.status === updatedAttachment.status &&
            now - lastUpdate.timestamp < 1000 // Within 1 second
          ) {
            return;
          }

          // Store this update for deduplication
          lastUpdateRef.current = {
            id: updatedAttachment.id,
            status: updatedAttachment.status,
            timestamp: now,
          };

          // Call the status change callback
          onStatusChange(updatedAttachment);
        }
      );
    }

    // Subscribe to DELETE events on chat_attachments table
    if (onDelete) {
      channel = channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_attachments',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deletedAttachmentId = payload.old?.id;
          if (deletedAttachmentId) {
            console.log(`[useAttachmentRealtime] Attachment deleted: ${deletedAttachmentId}`);
            onDelete(deletedAttachmentId);
          }
        }
      );
    }

    return channel;
  }, [supabase, conversationId, onStatusChange, onDelete]);

  // Function to handle reconnection
  const reconnect = useCallback(() => {
    if (!isMountedRef.current || !enabled) return;

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Remove existing channel if any
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (e) {
        // Ignore errors when removing channel
      }
      channelRef.current = null;
    }

    // Create new channel
    const channel = createChannel();
    if (!channel) return;

    const channelName = `chat_attachments:${conversationId}`;

    // Subscribe with status handling
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[useAttachmentRealtime] Subscribed to ${channelName}`);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // Log as warning instead of error (this is expected when coming back from background)
        console.warn(`[useAttachmentRealtime] Channel ${status.toLowerCase()} for ${channelName}, will reconnect...`);

        // Schedule reconnection after a delay
        if (isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnect();
          }, 2000); // Wait 2 seconds before reconnecting
        }
      } else if (status === 'CLOSED') {
        console.log(`[useAttachmentRealtime] Channel closed for ${channelName}`);
      }
    });

    channelRef.current = channel;
  }, [supabase, conversationId, enabled, createChannel]);

  useEffect(() => {
    isMountedRef.current = true;

    // Don't subscribe if disabled, no conversation ID, or no callbacks
    if (!enabled || !conversationId || (!onStatusChange && !onDelete)) {
      return;
    }

    // Initial subscription
    reconnect();

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Remove channel
      if (channelRef.current) {
        const channelName = `chat_attachments:${conversationId}`;
        console.log(`[useAttachmentRealtime] Unsubscribing from ${channelName}`);
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          // Ignore errors during cleanup
        }
        channelRef.current = null;
      }
    };
  }, [enabled, conversationId, onStatusChange, onDelete, reconnect, supabase]);

  // Return nothing - this is a side-effect only hook
  return null;
}
