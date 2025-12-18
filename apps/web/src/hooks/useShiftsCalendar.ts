'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  CalendarFilters,
  ExtendedCalendarFilters,
  CalendarShiftsResponse,
  CalendarShift,
  CalendarEvent,
  GroupedCalendarData,
  UseShiftsCalendarResult,
  ShiftStatus,
} from '@/types/calendar';

/**
 * Fetches calendar shifts data from the API
 *
 * @param filters - Filter parameters for the calendar query
 * @returns Promise resolving to calendar shifts data
 */
async function fetchCalendarShifts(
  filters: ExtendedCalendarFilters
): Promise<CalendarShift[]> {
  const params = new URLSearchParams({
    organization_id: filters.organizationId,
    start_date: filters.startDate,
    end_date: filters.endDate,
  });

  // Add optional parameters
  if (filters.facilityId && filters.facilityId !== 'todas') {
    params.append('facility_id', filters.facilityId);
  } else {
    params.append('facility_id', 'todas');
  }

  if (filters.specialty && filters.specialty !== 'todas') {
    params.append('specialty', filters.specialty);
  } else {
    params.append('specialty', 'todas');
  }

  // Add new filter parameters
  if (filters.sectorId && filters.sectorId !== 'todos') {
    params.append('sector_id', filters.sectorId);
  }

  if (filters.staffId && filters.staffId !== 'todos') {
    params.append('staff_id', filters.staffId);
  }

  if (filters.status && filters.status.length > 0) {
    params.append('status', filters.status.join(','));
  }

  if (filters.shiftType && filters.shiftType !== 'todos') {
    params.append('shift_type', filters.shiftType);
  }

  if (filters.assignmentStatus && filters.assignmentStatus !== 'all') {
    params.append('assignment_status', filters.assignmentStatus);
  }

  if (filters.scheduleType && filters.scheduleType !== 'all') {
    params.append('schedule_type', filters.scheduleType);
  }

  const response = await fetch(`/api/calendar/shifts?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch calendar shifts: ${response.statusText}`
    );
  }

  const data: CalendarShiftsResponse = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch calendar shifts');
  }

  return data.data.shifts;
}

/**
 * Transforms raw calendar shift data into calendar events with parsed dates
 *
 * @param shifts - Array of raw calendar shifts
 * @returns Array of calendar events with Date objects
 */
function transformShiftsToEvents(shifts: CalendarShift[]): CalendarEvent[] {
  return shifts.map((shift) => ({
    ...shift,
    startDate: new Date(shift.start),
    endDate: new Date(shift.end),
  }));
}

/**
 * Groups calendar events by date (YYYY-MM-DD format)
 *
 * @param events - Array of calendar events
 * @returns Object with dates as keys and arrays of events as values
 */
function groupEventsByDate(events: CalendarEvent[]): GroupedCalendarData {
  return events.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as GroupedCalendarData);
}

/**
 * Custom React hook to fetch and manage calendar shifts data
 *
 * This hook uses React Query for data fetching, caching, and state management.
 * It provides loading states, error handling, and automatic refetching capabilities.
 *
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Background refetching on window focus
 * - Data transformation (raw shifts → events with Date objects)
 * - Grouping by date for easier calendar rendering
 * - Comprehensive error handling
 *
 * @param filters - Calendar filter parameters (organizationId, dateRange, facilityId, specialty, etc.)
 * @param options - Optional configuration for the query
 * @returns Hook result with shifts data, loading states, and refetch function
 *
 * @example
 * ```tsx
 * const { shifts, events, groupedByDate, isLoading, error, refetch } = useShiftsCalendar({
 *   organizationId: 'org-uuid',
 *   startDate: '2024-01-01T00:00:00Z',
 *   endDate: '2024-01-31T23:59:59Z',
 *   facilityId: 'facility-uuid', // optional
 *   specialty: 'cardio', // optional
 *   sectorId: 'sector-uuid', // optional
 *   staffId: 'staff-uuid', // optional
 *   status: ['pending', 'accepted'], // optional
 *   shiftType: 'morning', // optional
 *   assignmentStatus: 'assigned', // optional
 *   scheduleType: 'fixed', // optional
 * });
 * ```
 */
export function useShiftsCalendar(
  filters: CalendarFilters | ExtendedCalendarFilters,
  options?: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    staleTime?: number;
  }
): UseShiftsCalendarResult {
  // Cast to extended filters (backward compatible)
  const extendedFilters = filters as ExtendedCalendarFilters;

  // Build query key for React Query caching (includes all filter dimensions)
  const queryKey = [
    'calendar-shifts',
    extendedFilters.organizationId,
    extendedFilters.startDate,
    extendedFilters.endDate,
    extendedFilters.facilityId || 'todas',
    extendedFilters.specialty || 'todas',
    extendedFilters.sectorId || 'todos',
    extendedFilters.staffId || 'todos',
    extendedFilters.status?.join(',') || '',
    extendedFilters.shiftType || 'todos',
    extendedFilters.assignmentStatus || 'all',
    extendedFilters.scheduleType || 'all',
  ];

  // Use React Query to fetch and cache data
  const {
    data: shifts = [],
    isLoading,
    error,
    isFetching,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchCalendarShifts(extendedFilters),
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Transform shifts into events with parsed dates (memoized)
  const events = useMemo(() => transformShiftsToEvents(shifts), [shifts]);

  // Group events by date for easier calendar rendering (memoized)
  const groupedByDate = useMemo(() => groupEventsByDate(events), [events]);

  return {
    shifts,
    events,
    groupedByDate,
    isLoading,
    error: error as Error | null,
    isFetching,
    isRefetching,
    refetch: () => {
      refetch();
    },
  };
}
