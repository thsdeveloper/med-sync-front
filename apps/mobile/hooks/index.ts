// Re-export existing hooks
export { useColorScheme } from './use-color-scheme';

// Realtime hooks
export { useRealtimeShifts } from './use-realtime-shifts';
export { useRealtimeSwapRequests } from './use-realtime-swap-requests';

// Feature hooks
export { useShiftAttendance } from './use-shift-attendance';

// Re-export types for convenience
export type { ShiftWithRelations } from '@/lib/realtime-types';
