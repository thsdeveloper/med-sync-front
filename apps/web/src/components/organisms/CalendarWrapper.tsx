/**
 * CalendarWrapper Organism Component
 *
 * A reusable calendar component configured with Portuguese locale and project design system.
 * This component wraps react-big-calendar with custom styling and configuration.
 *
 * Usage:
 * ```tsx
 * import { CalendarWrapper } from '@/components/organisms/CalendarWrapper';
 *
 * function MyCalendar() {
 *   const events = [
 *     {
 *       id: '1',
 *       title: 'Dr. Silva - Cardiologia',
 *       start: new Date(2024, 0, 15, 9, 0),
 *       end: new Date(2024, 0, 15, 17, 0),
 *       resource: { doctorId: 'uuid', facilityId: 'uuid', specialty: 'cardio' }
 *     }
 *   ];
 *
 *   return (
 *     <CalendarWrapper
 *       events={events}
 *       onSelectEvent={(event) => console.log('Selected:', event)}
 *       onSelectSlot={(slotInfo) => console.log('Slot:', slotInfo)}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import {
  Calendar,
  View,
  SlotInfo,
} from 'react-big-calendar';
import { calendarLocalizer, calendarMessages, dateFormats } from '@/lib/calendar-config';
import 'react-big-calendar/lib/css/react-big-calendar.css';

/**
 * Calendar event interface compatible with CalendarEvent from types/calendar.ts
 */
export interface CalendarWrapperEvent {
  /** Unique event identifier */
  id: string;
  /** Event title to display */
  title: string;
  /** Event start date and time */
  start: Date;
  /** Event end date and time */
  end: Date;
  /** Optional additional resource data */
  resource?: {
    doctorId?: string;
    doctorName?: string;
    facilityId?: string;
    facilityName?: string;
    specialty?: string;
    status?: string;
    notes?: string;
    [key: string]: any;
  };
  /** Optional flag to mark all-day events */
  allDay?: boolean;
}

/**
 * Props for the CalendarWrapper component
 */
export interface CalendarWrapperProps {
  /** Array of events to display on the calendar */
  events: CalendarWrapperEvent[];
  /** Callback when an event is selected/clicked */
  onSelectEvent?: (event: CalendarWrapperEvent) => void;
  /** Callback when a time slot is selected */
  onSelectSlot?: (slotInfo: SlotInfo) => void;
  /** Callback when the view changes (month, week, day, agenda) */
  onView?: (view: View) => void;
  /** Callback when navigating to a different date range */
  onNavigate?: (date: Date) => void;
  /** Current view to display (controlled mode) */
  view?: View;
  /** Current date to show (controlled mode) */
  date?: Date;
  /** Default view to display (uncontrolled mode, default: 'month') */
  defaultView?: View;
  /** Default date to show (uncontrolled mode, default: today) */
  defaultDate?: Date;
  /** Whether to allow selecting time slots (default: true) */
  selectable?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Height of the calendar (default: '700px') */
  height?: string | number;
  /** Optional event style getter for custom event colors */
  eventStyleGetter?: (event: CalendarWrapperEvent) => {
    style?: React.CSSProperties;
    className?: string;
  };
}

/**
 * CalendarWrapper - Base calendar component with Portuguese locale and Tailwind styling
 *
 * This organism component provides a fully-configured calendar for displaying and
 * managing shifts/events. It uses react-big-calendar with date-fns adapter and
 * Portuguese locale configuration.
 *
 * Supports both controlled and uncontrolled modes:
 * - Controlled: Pass `view` and `date` props with `onView` and `onNavigate` callbacks
 * - Uncontrolled: Pass `defaultView` and `defaultDate` for initial values only
 *
 * @param props - Calendar configuration props
 * @returns Configured calendar component
 */
export function CalendarWrapper({
  events,
  onSelectEvent,
  onSelectSlot,
  onView,
  onNavigate,
  view,
  date,
  defaultView = 'month',
  defaultDate = new Date(),
  selectable = true,
  className = '',
  style,
  height = '700px',
  eventStyleGetter,
}: CalendarWrapperProps) {
  /**
   * Default event style getter with project design system colors
   */
  const defaultEventStyleGetter = useCallback(
    (event: CalendarWrapperEvent) => {
      // Default styling based on specialty or status
      const specialty = event.resource?.specialty?.toLowerCase();
      const status = event.resource?.status?.toLowerCase();

      let backgroundColor = '#2563EB'; // Primary blue
      let borderColor = '#1d4ed8';

      // Color by specialty
      if (specialty === 'cardio' || specialty === 'cardiologia' || specialty === 'cardiologista') {
        backgroundColor = '#DC2626'; // Red
        borderColor = '#b91c1c';
      } else if (specialty === 'neuro' || specialty === 'neurologia') {
        backgroundColor = '#7C3AED'; // Purple
        borderColor = '#6d28d9';
      } else if (specialty === 'anestesia' || specialty === 'anestesiologia') {
        backgroundColor = '#059669'; // Green
        borderColor = '#047857';
      } else if (specialty === 'pediatria') {
        backgroundColor = '#F59E0B'; // Amber
        borderColor = '#d97706';
      }

      // Override with status colors if needed
      if (status === 'cancelled' || status === 'cancelado') {
        backgroundColor = '#6B7280'; // Gray
        borderColor = '#4b5563';
      } else if (status === 'completed' || status === 'concluído') {
        backgroundColor = '#10B981'; // Success green
        borderColor = '#059669';
      }

      return {
        style: {
          backgroundColor,
          borderColor,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '4px',
          color: '#ffffff',
          fontSize: '0.875rem',
          padding: '2px 4px',
        },
      };
    },
    []
  );

  /**
   * Memoized style getter (use custom if provided, otherwise default)
   */
  const styleGetter = useMemo(
    () => eventStyleGetter || defaultEventStyleGetter,
    [eventStyleGetter, defaultEventStyleGetter]
  );

  return (
    <div
      className={`calendar-wrapper bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-border p-4 ${className}`}
      style={{ height, ...style }}
    >
      <Calendar
        localizer={calendarLocalizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        allDayAccessor="allDay"
        resourceAccessor="resource"
        messages={calendarMessages}
        formats={dateFormats}
        culture="pt-BR"
        // Use controlled props if provided, otherwise fall back to uncontrolled
        view={view}
        date={date}
        defaultView={defaultView}
        defaultDate={defaultDate}
        selectable={selectable}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        onView={onView}
        onNavigate={onNavigate}
        eventPropGetter={styleGetter}
        style={{ height: '100%' }}
        popup
        showMultiDayTimes
      />
    </div>
  );
}

/**
 * Export component as default
 */
export default CalendarWrapper;
