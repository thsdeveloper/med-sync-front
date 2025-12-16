/**
 * ShiftsCalendar Organism Component
 *
 * Main calendar component that integrates shift data fetching, display, and interaction.
 * Renders shifts in a calendar with month, week, and day views.
 * Includes color coding by specialty, loading states, empty states, and detail modal.
 *
 * Usage:
 * ```tsx
 * import { ShiftsCalendar } from '@/components/organisms/ShiftsCalendar';
 *
 * function MyPage() {
 *   const { activeOrganization } = useOrganization();
 *
 *   return (
 *     <ShiftsCalendar
 *       organizationId={activeOrganization.id}
 *       facilityId="todas"
 *       specialty="todas"
 *     />
 *   );
 * }
 * ```
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { View } from 'react-big-calendar';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { CalendarWrapper, CalendarWrapperEvent } from './CalendarWrapper';
import { CalendarLoadingSkeleton } from './CalendarLoadingSkeleton';
import { CalendarEmptyState } from '../molecules/CalendarEmptyState';
import { CalendarToolbar } from '../molecules/CalendarToolbar';
import { ShiftDetailModal } from './ShiftDetailModal';
import { useShiftsCalendar } from '@/hooks/useShiftsCalendar';
import type { CalendarEvent } from '@/types/calendar';

/**
 * Props for the ShiftsCalendar component
 */
export interface ShiftsCalendarProps {
  /** Organization UUID (required) */
  organizationId: string;
  /** Optional facility filter (UUID or 'todas' for all) */
  facilityId?: string;
  /** Optional specialty filter (lowercase string or 'todas' for all) */
  specialty?: string;
  /** Default view to display (default: 'month') */
  defaultView?: View;
  /** Default date to show (default: today) */
  defaultDate?: Date;
  /** Height of the calendar (default: '700px') */
  height?: string | number;
  /** Custom CSS class name */
  className?: string;
}

/**
 * Transforms CalendarEvent to CalendarWrapperEvent format
 */
function transformToWrapperEvents(
  events: CalendarEvent[]
): CalendarWrapperEvent[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    resource: {
      doctorId: event.doctor_id,
      doctorName: event.doctor_name,
      facilityId: event.facility_id,
      facilityName: event.facility_name,
      specialty: event.specialty,
      status: event.status,
      notes: event.notes,
    },
  }));
}

/**
 * ShiftsCalendar - Main calendar display component for shifts
 *
 * This organism component provides a complete calendar interface for viewing
 * and interacting with shifts. It integrates data fetching, multiple views,
 * color coding, loading states, empty states, and a detail modal.
 *
 * Features:
 * - Month, week, day, and agenda views
 * - Color coding by specialty
 * - Click to view shift details
 * - Loading skeleton during data fetch
 * - Empty state when no shifts found
 * - Organization-based filtering
 * - Facility and specialty filters
 * - Date navigation controls (Hoje/Anterior/Próximo)
 * - Interactive month/year selectors
 * - Proper date range calculation for each view mode
 * - Date validation for month/year changes
 *
 * Navigation Controls:
 * - Hoje (Today): Navigates to current date
 * - Anterior (Previous): Moves to previous period (month/week/day based on current view)
 * - Próximo (Next): Moves to next period (month/week/day based on current view)
 * - Month selector: Dropdown to select specific month (Janeiro - Dezembro)
 * - Year selector: Dropdown to select specific year (current year ± 5 years)
 *
 * View Modes:
 * - Mês (Month): Full month view with all dates in a grid layout
 * - Semana (Week): 7-day week view with hourly time slots
 * - Dia (Day): Single day view with detailed hourly breakdown
 * - Agenda (Agenda): List view showing upcoming events chronologically
 *
 * @param props - Calendar configuration props
 * @returns Complete calendar component
 */
export function ShiftsCalendar({
  organizationId,
  facilityId = 'todas',
  specialty = 'todas',
  defaultView = 'month',
  defaultDate = new Date(),
  height = '700px',
  className = '',
}: ShiftsCalendarProps) {
  // State for calendar view and date
  const [currentView, setCurrentView] = useState<View>(defaultView);
  const [currentDate, setCurrentDate] = useState<Date>(defaultDate);

  // State for selected shift (for detail modal)
  const [selectedShift, setSelectedShift] = useState<CalendarEvent | null>(
    null
  );

  // Calculate date range based on current view and date
  const { startDate, endDate } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (currentView === 'month') {
      // For month view, get entire month
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (currentView === 'week') {
      // For week view, get the week range (Sunday to Saturday)
      start = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0 = Sunday
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else if (currentView === 'day') {
      // For day view, get just that day (00:00:00 to 23:59:59)
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    } else {
      // For agenda view, get entire month to have data available
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [currentDate, currentView]);

  // Fetch shifts data using the custom hook
  const { events, isLoading, error } = useShiftsCalendar({
    organizationId,
    startDate,
    endDate,
    facilityId,
    specialty,
  });

  // Transform events for CalendarWrapper
  const calendarEvents = useMemo(
    () => transformToWrapperEvents(events),
    [events]
  );

  // Handle event click - open detail modal
  const handleSelectEvent = useCallback(
    (event: CalendarWrapperEvent) => {
      // Find the full event data from events array
      const fullEvent = events.find((e) => e.id === event.id);
      if (fullEvent) {
        setSelectedShift(fullEvent);
      }
    },
    [events]
  );

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  // Handle date navigation
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback((open: boolean) => {
    if (!open) {
      setSelectedShift(null);
    }
  }, []);

  // Show loading skeleton while fetching
  if (isLoading) {
    return <CalendarLoadingSkeleton height={height} className={className} />;
  }

  // Show error state (could be enhanced with proper error component)
  if (error) {
    return (
      <CalendarEmptyState
        title="Erro ao carregar plantões"
        description={
          error.message ||
          'Ocorreu um erro ao carregar os plantões. Por favor, tente novamente.'
        }
        height={height}
        className={className}
      />
    );
  }

  // Show empty state when no shifts found
  if (calendarEvents.length === 0) {
    return <CalendarEmptyState height={height} className={className} />;
  }

  return (
    <>
      {/* Calendar Component - Using controlled mode with custom toolbar */}
      <CalendarWrapper
        events={calendarEvents}
        onSelectEvent={handleSelectEvent}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        view={currentView}
        date={currentDate}
        defaultView={defaultView}
        defaultDate={defaultDate}
        views={['month', 'week', 'day', 'agenda']} // Enable all 4 view modes
        height={height}
        className={className}
        selectable={false} // Disable slot selection for read-only view
        components={{
          toolbar: CalendarToolbar, // Use custom toolbar with month/year selectors
        }}
      />

      {/* Shift Detail Modal */}
      <ShiftDetailModal
        shift={selectedShift}
        open={!!selectedShift}
        onOpenChange={handleModalClose}
      />
    </>
  );
}

/**
 * Export component as default
 */
export default ShiftsCalendar;
