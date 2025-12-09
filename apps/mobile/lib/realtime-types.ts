import type {
  Shift,
  ShiftSwapRequest,
  FixedSchedule,
  ShiftAttendance,
} from '@medsync/shared';

/**
 * Realtime event types from Supabase Postgres Changes
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Connection status for Realtime channel
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Generic payload type for Supabase Realtime Postgres Changes
 */
export interface RealtimePayload<T> {
  commit_timestamp: string;
  eventType: RealtimeEvent;
  schema: string;
  table: string;
  new: T | null;
  old: T | null;
  errors: string[] | null;
}

/**
 * Shift response type from database
 */
export interface ShiftResponse {
  id: string;
  shift_id: string;
  staff_id: string;
  response: 'accepted' | 'declined' | 'pending';
  responded_at: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Extended Shift type with relations (as returned from queries)
 */
export type ShiftWithRelations = Omit<Shift, 'sectors' | 'medical_staff'> & {
  sectors?: {
    id?: string;
    name?: string;
    color?: string;
  };
  organizations?: {
    name?: string;
  };
  fixed_schedules?: {
    facility_id?: string;
    shift_type?: string;
    facilities?: {
      name?: string;
      type?: string;
      address?: string;
    };
  };
  medical_staff?: {
    name?: string;
    role?: string;
    color?: string;
  };
};

/**
 * Typed payloads for each table subscription
 */
export type ShiftPayload = RealtimePayload<Shift>;
export type SwapRequestPayload = RealtimePayload<ShiftSwapRequest>;
export type ShiftResponsePayload = RealtimePayload<ShiftResponse>;
export type FixedSchedulePayload = RealtimePayload<FixedSchedule>;
export type ShiftAttendancePayload = RealtimePayload<ShiftAttendance>;

/**
 * Callback types for subscriptions
 */
export type ShiftCallback = (payload: ShiftPayload) => void;
export type SwapRequestCallback = (payload: SwapRequestPayload) => void;
export type ShiftResponseCallback = (payload: ShiftResponsePayload) => void;
export type FixedScheduleCallback = (payload: FixedSchedulePayload) => void;
export type ShiftAttendanceCallback = (payload: ShiftAttendancePayload) => void;

/**
 * Realtime context value interface
 */
export interface RealtimeContextValue {
  /** Whether the realtime channel is connected */
  isConnected: boolean;
  /** Current connection status */
  connectionStatus: ConnectionStatus;
  /** Subscribe to shifts changes for a specific staff member */
  subscribeToShifts: (callback: ShiftCallback) => () => void;
  /** Subscribe to swap requests (both incoming and outgoing) */
  subscribeToSwapRequests: (callback: SwapRequestCallback) => () => void;
  /** Subscribe to shift responses */
  subscribeToShiftResponses: (callback: ShiftResponseCallback) => () => void;
  /** Subscribe to fixed schedules changes */
  subscribeToFixedSchedules: (callback: FixedScheduleCallback) => () => void;
  /** Subscribe to shift attendance changes (check-in/check-out) */
  subscribeToShiftAttendance: (callback: ShiftAttendanceCallback) => () => void;
}
