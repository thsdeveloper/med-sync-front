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

import { useEffect, useRef } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { ChatAttachment } from '../schemas/chat.schema';

export interface UseAttachmentRealtimeOptions {
  /**
   * Callback fired when an attachment status changes
   * @param attachment The updated attachment record
   */
  onStatusChange?: (attachment: ChatAttachment) => void;

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
 * @param options - Additional configuration options
 */
export function useAttachmentRealtime(
  supabase: SupabaseClient,
  conversationId: string | null,
  onStatusChange?: (attachment: ChatAttachment) => void,
  options: Omit<UseAttachmentRealtimeOptions, 'onStatusChange'> = {}
) {
  const { enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUpdateRef = useRef<{ id: string; status: string; timestamp: number } | null>(null);

  useEffect(() => {
    // Don't subscribe if disabled, no conversation ID, or no callback
    if (!enabled || !conversationId || !onStatusChange) {
      return;
    }

    // Create channel with unique name for this conversation
    const channelName = `chat_attachments:${conversationId}`;

    // Subscribe to UPDATE events on chat_attachments table
    const channel = supabase
      .channel(channelName)
      .on(
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
          // This can happen if both trigger notification and realtime fire
          const now = Date.now();
          const lastUpdate = lastUpdateRef.current;
          if (
            lastUpdate &&
            lastUpdate.id === updatedAttachment.id &&
            lastUpdate.status === updatedAttachment.status &&
            now - lastUpdate.timestamp < 1000 // Within 1 second
          ) {
            // Skip duplicate event
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
      )
      .subscribe((status) => {
        // Log subscription status for debugging
        if (status === 'SUBSCRIBED') {
          console.log(`[useAttachmentRealtime] Subscribed to ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[useAttachmentRealtime] Channel error for ${channelName}`);
        } else if (status === 'TIMED_OUT') {
          console.warn(`[useAttachmentRealtime] Subscription timed out for ${channelName}`);
        } else if (status === 'CLOSED') {
          console.log(`[useAttachmentRealtime] Channel closed for ${channelName}`);
        }
      });

    // Store channel ref for cleanup
    channelRef.current = channel;

    // Cleanup function: unsubscribe and remove channel
    return () => {
      if (channelRef.current) {
        console.log(`[useAttachmentRealtime] Unsubscribing from ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, conversationId, onStatusChange, enabled]);

  // Return nothing - this is a side-effect only hook
  return null;
}
