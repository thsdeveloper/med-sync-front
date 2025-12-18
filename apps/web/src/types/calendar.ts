/**
 * Calendar data types for shift management
 *
 * These types define the structure for calendar data used in the shifts calendar feature.
 * The types are designed to work with the get_calendar_shifts RPC function and the
 * /api/calendar/shifts endpoint.
 */

/**
 * Raw shift data returned from the API
 */
export interface CalendarShift {
  /** Unique identifier for the shift */
  id: string;
  /** Display title (typically "Doctor Name - Specialty") */
  title: string;
  /** ISO 8601 timestamp for shift start */
  start: string;
  /** ISO 8601 timestamp for shift end */
  end: string;
  /** Name of the doctor assigned to the shift */
  doctor_name: string;
  /** UUID of the doctor */
  doctor_id: string;
  /** Name of the facility where the shift takes place */
  facility_name: string;
  /** UUID of the facility */
  facility_id: string;
  /** Physical address of the facility (optional) */
  facility_address: string | null;
  /** Medical specialty (e.g., "cardio", "neuro") */
  specialty: string;
  /** Shift status (e.g., "pending", "accepted", "completed") */
  status: string;
  /** Additional notes about the shift */
  notes: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Sector UUID (optional) */
  sector_id?: string | null;
  /** Fixed schedule UUID - null if manual shift */
  fixed_schedule_id?: string | null;
}

/**
 * API response structure for calendar shifts endpoint
 */
export interface CalendarShiftsResponse {
  ok: boolean;
  data: {
    shifts: CalendarShift[];
  };
  error?: string;
}

/**
 * Shift status values
 */
export type ShiftStatus = 'pending' | 'accepted' | 'declined' | 'swap_requested';

/**
 * Shift type (time of day)
 */
export type ShiftType = 'morning' | 'afternoon' | 'night';

/**
 * Assignment status for filtering
 */
export type AssignmentStatus = 'all' | 'assigned' | 'unassigned';

/**
 * Schedule type for filtering
 */
export type ScheduleType = 'all' | 'manual' | 'fixed';

/**
 * Filter parameters for calendar shifts query
 */
export interface CalendarFilters {
  /** Organization UUID (required) */
  organizationId: string;
  /** Start date for the calendar range (ISO 8601) */
  startDate: string;
  /** End date for the calendar range (ISO 8601) */
  endDate: string;
  /** Optional facility filter (UUID or 'todas' for all) */
  facilityId?: string;
  /** Optional specialty filter (lowercase string or 'todas' for all) */
  specialty?: string;
}

/**
 * Extended filter parameters with all possible filters
 */
export interface ExtendedCalendarFilters extends CalendarFilters {
  /** Sector filter (UUID or 'todos' for all) */
  sectorId?: string;
  /** Staff filter (UUID or 'todos' for all) */
  staffId?: string;
  /** Status filter (array of statuses, empty = all) */
  status?: ShiftStatus[];
  /** Shift type filter (morning/afternoon/night or 'todos' for all) */
  shiftType?: string;
  /** Assignment status filter */
  assignmentStatus?: AssignmentStatus;
  /** Schedule type filter (manual/fixed or 'all') */
  scheduleType?: ScheduleType;
}

/**
 * Transformed shift data optimized for calendar component consumption
 * Includes parsed Date objects for easier manipulation
 */
export interface CalendarEvent extends CalendarShift {
  /** Parsed start date */
  startDate: Date;
  /** Parsed end date */
  endDate: Date;
}

/**
 * Grouped calendar data by date for easier rendering
 */
export interface GroupedCalendarData {
  [date: string]: CalendarEvent[];
}

/**
 * Hook return type for useShiftsCalendar
 */
export interface UseShiftsCalendarResult {
  /** Array of calendar shifts */
  shifts: CalendarShift[];
  /** Transformed calendar events with parsed dates */
  events: CalendarEvent[];
  /** Shifts grouped by date (YYYY-MM-DD) */
  groupedByDate: GroupedCalendarData;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether the query is currently fetching */
  isFetching: boolean;
  /** Whether the data is stale and being refetched in background */
  isRefetching: boolean;
  /** Manual refetch function */
  refetch: () => void;
}
