import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRealtime } from '@/providers/realtime-provider';
import type { ShiftPayload, ShiftWithRelations } from '@/lib/realtime-types';

interface UseRealtimeShiftsOptions {
  /** Enable/disable realtime updates (defaults to true) */
  enabled?: boolean;
}

interface UseRealtimeShiftsReturn {
  /** Current list of shifts with realtime updates applied */
  shifts: ShiftWithRelations[];
  /** Manually set shifts (useful for initial data load) */
  setShifts: React.Dispatch<React.SetStateAction<ShiftWithRelations[]>>;
  /** Whether realtime is connected */
  isConnected: boolean;
  /** Pending shifts count */
  pendingCount: number;
}

/**
 * Hook that provides realtime updates for shifts
 *
 * @param initialShifts - Initial shifts data (from initial fetch)
 * @param options - Hook options
 * @returns Object with shifts state and realtime status
 *
 * @example
 * ```tsx
 * const { shifts, isConnected, pendingCount } = useRealtimeShifts(fetchedShifts);
 * ```
 */
export function useRealtimeShifts(
  initialShifts: ShiftWithRelations[] = [],
  options: UseRealtimeShiftsOptions = {}
): UseRealtimeShiftsReturn {
  const { enabled = true } = options;
  const [shifts, setShifts] = useState<ShiftWithRelations[]>(initialShifts);
  const { subscribeToShifts, isConnected } = useRealtime();
  const prevInitialShiftsRef = useRef<string>('');

  // Sync with initial data when it changes (e.g., after pull-to-refresh)
  // Use JSON stringified comparison to avoid infinite loops
  useEffect(() => {
    const currentKey = JSON.stringify(initialShifts.map(s => s.id).sort());
    if (currentKey !== prevInitialShiftsRef.current) {
      prevInitialShiftsRef.current = currentKey;
      setShifts(initialShifts);
    }
  }, [initialShifts]);

  // Handle realtime payload
  const handleShiftChange = useCallback((payload: ShiftPayload) => {
    console.log('[useRealtimeShifts] Received:', payload.eventType, payload.new?.id || payload.old?.id);

    setShifts((currentShifts) => {
      switch (payload.eventType) {
        case 'INSERT': {
          if (!payload.new) return currentShifts;
          // Check if shift already exists (avoid duplicates)
          const exists = currentShifts.some((s) => s.id === payload.new!.id);
          if (exists) return currentShifts;
          // Add new shift and sort by start_time
          return [...currentShifts, payload.new as ShiftWithRelations].sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
        }

        case 'UPDATE': {
          if (!payload.new) return currentShifts;
          return currentShifts.map((shift) =>
            shift.id === payload.new!.id
              ? { ...shift, ...payload.new } as ShiftWithRelations
              : shift
          );
        }

        case 'DELETE': {
          if (!payload.old) return currentShifts;
          return currentShifts.filter((shift) => shift.id !== payload.old!.id);
        }

        default:
          return currentShifts;
      }
    });
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToShifts(handleShiftChange);
    return unsubscribe;
  }, [enabled, subscribeToShifts, handleShiftChange]);

  // Memoized pending count
  const pendingCount = useMemo(
    () => shifts.filter((shift) => shift.status === 'pending').length,
    [shifts]
  );

  return {
    shifts,
    setShifts,
    isConnected,
    pendingCount,
  };
}
