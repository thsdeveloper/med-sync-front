import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRealtime } from '@/providers/realtime-provider';
import type { SwapRequestPayload } from '@/lib/realtime-types';
import type { ShiftSwapRequestWithDetails } from '@medsync/shared';

interface UseRealtimeSwapRequestsOptions {
  /** Enable/disable realtime updates (defaults to true) */
  enabled?: boolean;
}

interface UseRealtimeSwapRequestsReturn {
  /** Current list of swap requests with realtime updates applied */
  swapRequests: ShiftSwapRequestWithDetails[];
  /** Manually set swap requests (useful for initial data load) */
  setSwapRequests: React.Dispatch<React.SetStateAction<ShiftSwapRequestWithDetails[]>>;
  /** Whether realtime is connected */
  isConnected: boolean;
  /** Pending incoming requests count (for badge display) */
  pendingIncomingCount: number;
  /** Pending outgoing requests count */
  pendingOutgoingCount: number;
  /** Total pending count */
  totalPendingCount: number;
}

/**
 * Hook that provides realtime updates for shift swap requests
 *
 * @param initialRequests - Initial swap requests data (from initial fetch)
 * @param staffId - Current staff member's ID (to distinguish incoming vs outgoing)
 * @param options - Hook options
 * @returns Object with swap requests state and realtime status
 *
 * @example
 * ```tsx
 * const {
 *   swapRequests,
 *   pendingIncomingCount,
 *   isConnected
 * } = useRealtimeSwapRequests(fetchedRequests, staff.id);
 * ```
 */
export function useRealtimeSwapRequests(
  initialRequests: ShiftSwapRequestWithDetails[] = [],
  staffId?: string,
  options: UseRealtimeSwapRequestsOptions = {}
): UseRealtimeSwapRequestsReturn {
  const { enabled = true } = options;
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequestWithDetails[]>(initialRequests);
  const { subscribeToSwapRequests, isConnected } = useRealtime();
  const prevInitialRequestsRef = useRef<string>('');

  // Sync with initial data when it changes (e.g., after pull-to-refresh)
  // Use JSON stringified comparison to avoid infinite loops
  useEffect(() => {
    const currentKey = JSON.stringify(initialRequests.map(r => r.id).sort());
    if (currentKey !== prevInitialRequestsRef.current) {
      prevInitialRequestsRef.current = currentKey;
      setSwapRequests(initialRequests);
    }
  }, [initialRequests]);

  // Handle realtime payload
  const handleSwapRequestChange = useCallback((payload: SwapRequestPayload) => {
    console.log('[useRealtimeSwapRequests] Received:', payload.eventType, payload.new?.id || payload.old?.id);

    setSwapRequests((currentRequests) => {
      switch (payload.eventType) {
        case 'INSERT': {
          if (!payload.new) return currentRequests;
          // Check if request already exists (avoid duplicates)
          const exists = currentRequests.some((r) => r.id === payload.new!.id);
          if (exists) return currentRequests;
          // Add new request at the beginning (most recent first)
          return [payload.new as ShiftSwapRequestWithDetails, ...currentRequests];
        }

        case 'UPDATE': {
          if (!payload.new) return currentRequests;
          return currentRequests.map((request) =>
            request.id === payload.new!.id
              ? { ...request, ...payload.new } as ShiftSwapRequestWithDetails
              : request
          );
        }

        case 'DELETE': {
          if (!payload.old) return currentRequests;
          return currentRequests.filter((request) => request.id !== payload.old!.id);
        }

        default:
          return currentRequests;
      }
    });
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToSwapRequests(handleSwapRequestChange);
    return unsubscribe;
  }, [enabled, subscribeToSwapRequests, handleSwapRequestChange]);

  // Memoized counts
  const pendingIncomingCount = useMemo(
    () =>
      swapRequests.filter(
        (r) => r.status === 'pending' && r.target_staff_id === staffId
      ).length,
    [swapRequests, staffId]
  );

  const pendingOutgoingCount = useMemo(
    () =>
      swapRequests.filter(
        (r) => r.status === 'pending' && r.requester_id === staffId
      ).length,
    [swapRequests, staffId]
  );

  const totalPendingCount = useMemo(
    () => swapRequests.filter((r) => r.status === 'pending').length,
    [swapRequests]
  );

  return {
    swapRequests,
    setSwapRequests,
    isConnected,
    pendingIncomingCount,
    pendingOutgoingCount,
    totalPendingCount,
  };
}
