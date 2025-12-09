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
import type {
  ConnectionStatus,
  RealtimeContextValue,
  ShiftCallback,
  SwapRequestCallback,
  ShiftResponseCallback,
  FixedScheduleCallback,
  ShiftAttendanceCallback,
  ShiftPayload,
  SwapRequestPayload,
  ShiftResponsePayload,
  FixedSchedulePayload,
  ShiftAttendancePayload,
} from '@/lib/realtime-types';

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

// Retry configuration for exponential backoff
const MAX_RETRY_DELAY = 30000; // 30 seconds
const INITIAL_RETRY_DELAY = 1000; // 1 second

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { staff, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  // Refs for managing channel and callbacks
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryAttemptRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Callback sets for each subscription type
  const shiftCallbacksRef = useRef<Set<ShiftCallback>>(new Set());
  const swapRequestCallbacksRef = useRef<Set<SwapRequestCallback>>(new Set());
  const shiftResponseCallbacksRef = useRef<Set<ShiftResponseCallback>>(new Set());
  const fixedScheduleCallbacksRef = useRef<Set<FixedScheduleCallback>>(new Set());
  const shiftAttendanceCallbacksRef = useRef<Set<ShiftAttendanceCallback>>(new Set());

  // Handle shift changes
  const handleShiftChange = useCallback((payload: ShiftPayload) => {
    shiftCallbacksRef.current.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('[Realtime] Error in shift callback:', error);
      }
    });
  }, []);

  // Handle swap request changes
  const handleSwapRequestChange = useCallback((payload: SwapRequestPayload) => {
    swapRequestCallbacksRef.current.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('[Realtime] Error in swap request callback:', error);
      }
    });
  }, []);

  // Handle shift response changes
  const handleShiftResponseChange = useCallback((payload: ShiftResponsePayload) => {
    shiftResponseCallbacksRef.current.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('[Realtime] Error in shift response callback:', error);
      }
    });
  }, []);

  // Handle fixed schedule changes
  const handleFixedScheduleChange = useCallback((payload: FixedSchedulePayload) => {
    fixedScheduleCallbacksRef.current.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('[Realtime] Error in fixed schedule callback:', error);
      }
    });
  }, []);

  // Handle shift attendance changes (check-in/check-out)
  const handleShiftAttendanceChange = useCallback((payload: ShiftAttendancePayload) => {
    shiftAttendanceCallbacksRef.current.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error('[Realtime] Error in shift attendance callback:', error);
      }
    });
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Connect to realtime channel
  const connect = useCallback(() => {
    if (!staff?.id) {
      console.log('[Realtime] No staff ID, skipping connection');
      return;
    }

    // Cleanup any existing connection
    cleanup();

    const staffId = staff.id;
    console.log('[Realtime] Connecting for staff:', staffId);
    setConnectionStatus('connecting');

    // Create channel with unique name per staff
    const channel = supabase
      .channel(`medsync-staff-${staffId}`)
      // Subscribe to shifts for this staff member
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `staff_id=eq.${staffId}`,
        },
        (payload) => handleShiftChange(payload as unknown as ShiftPayload)
      )
      // Subscribe to swap requests where this staff is the target
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_swap_requests',
          filter: `target_staff_id=eq.${staffId}`,
        },
        (payload) => handleSwapRequestChange(payload as unknown as SwapRequestPayload)
      )
      // Subscribe to swap requests where this staff is the requester
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_swap_requests',
          filter: `requester_id=eq.${staffId}`,
        },
        (payload) => handleSwapRequestChange(payload as unknown as SwapRequestPayload)
      )
      // Subscribe to shift responses for this staff
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_responses',
          filter: `staff_id=eq.${staffId}`,
        },
        (payload) => handleShiftResponseChange(payload as unknown as ShiftResponsePayload)
      )
      // Subscribe to fixed schedules for this staff
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fixed_schedules',
          filter: `staff_id=eq.${staffId}`,
        },
        (payload) => handleFixedScheduleChange(payload as unknown as FixedSchedulePayload)
      )
      // Subscribe to shift attendance (check-in/check-out) for this staff
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_attendance',
          filter: `staff_id=eq.${staffId}`,
        },
        (payload) => handleShiftAttendanceChange(payload as unknown as ShiftAttendancePayload)
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Subscription status:', status, err);

        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          retryAttemptRef.current = 0; // Reset retry counter on success
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Realtime] Channel error:', err);
          setConnectionStatus('error');
          scheduleRetry();
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    channelRef.current = channel;
  }, [
    staff?.id,
    cleanup,
    handleShiftChange,
    handleSwapRequestChange,
    handleShiftResponseChange,
    handleFixedScheduleChange,
    handleShiftAttendanceChange,
  ]);

  // Schedule retry with exponential backoff
  const scheduleRetry = useCallback(() => {
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, retryAttemptRef.current),
      MAX_RETRY_DELAY
    );

    console.log(`[Realtime] Scheduling retry in ${delay}ms (attempt ${retryAttemptRef.current + 1})`);

    retryTimeoutRef.current = setTimeout(() => {
      retryAttemptRef.current += 1;
      connect();
    }, delay);
  }, [connect]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && connectionStatus === 'disconnected' && isAuthenticated && staff?.id) {
        console.log('[Realtime] App became active, reconnecting...');
        connect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [connectionStatus, isAuthenticated, staff?.id, connect]);

  // Main effect: connect when authenticated
  useEffect(() => {
    if (isAuthenticated && staff?.id) {
      connect();
    } else {
      cleanup();
      setConnectionStatus('disconnected');
    }

    return cleanup;
  }, [isAuthenticated, staff?.id, connect, cleanup]);

  // Subscription methods
  const subscribeToShifts = useCallback((callback: ShiftCallback) => {
    shiftCallbacksRef.current.add(callback);
    return () => {
      shiftCallbacksRef.current.delete(callback);
    };
  }, []);

  const subscribeToSwapRequests = useCallback((callback: SwapRequestCallback) => {
    swapRequestCallbacksRef.current.add(callback);
    return () => {
      swapRequestCallbacksRef.current.delete(callback);
    };
  }, []);

  const subscribeToShiftResponses = useCallback((callback: ShiftResponseCallback) => {
    shiftResponseCallbacksRef.current.add(callback);
    return () => {
      shiftResponseCallbacksRef.current.delete(callback);
    };
  }, []);

  const subscribeToFixedSchedules = useCallback((callback: FixedScheduleCallback) => {
    fixedScheduleCallbacksRef.current.add(callback);
    return () => {
      fixedScheduleCallbacksRef.current.delete(callback);
    };
  }, []);

  const subscribeToShiftAttendance = useCallback((callback: ShiftAttendanceCallback) => {
    shiftAttendanceCallbacksRef.current.add(callback);
    return () => {
      shiftAttendanceCallbacksRef.current.delete(callback);
    };
  }, []);

  const value: RealtimeContextValue = {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    subscribeToShifts,
    subscribeToSwapRequests,
    subscribeToShiftResponses,
    subscribeToFixedSchedules,
    subscribeToShiftAttendance,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook to access realtime context
 * @throws Error if used outside of RealtimeProvider
 */
export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
