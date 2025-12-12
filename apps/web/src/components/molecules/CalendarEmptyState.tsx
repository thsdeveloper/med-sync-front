/**
 * CalendarEmptyState Molecule Component
 *
 * Displays an empty state message when no shifts are found in the calendar.
 * Provides a helpful message and icon to guide the user.
 *
 * Usage:
 * ```tsx
 * import { CalendarEmptyState } from '@/components/molecules/CalendarEmptyState';
 *
 * function MyCalendar() {
 *   const { shifts, isLoading } = useShiftsCalendar({ ... });
 *
 *   if (!isLoading && shifts.length === 0) {
 *     return <CalendarEmptyState />;
 *   }
 *
 *   return <CalendarWrapper ... />;
 * }
 * ```
 */

'use client';

import React from 'react';
import { CalendarX } from 'lucide-react';

/**
 * Props for the CalendarEmptyState component
 */
export interface CalendarEmptyStateProps {
  /** Custom title message (default: "Nenhum plantão encontrado") */
  title?: string;
  /** Custom description message */
  description?: string;
  /** Custom CSS class name */
  className?: string;
  /** Height of the empty state container (default: '700px') */
  height?: string | number;
}

/**
 * CalendarEmptyState - Empty state display for calendar
 *
 * This molecule component shows a friendly empty state when no shifts are found,
 * helping users understand that there's no data to display.
 *
 * @param props - Empty state configuration props
 * @returns Empty state component
 */
export function CalendarEmptyState({
  title = 'Nenhum plantão encontrado',
  description = 'Não há plantões cadastrados para o período selecionado. Ajuste os filtros ou selecione outro período.',
  className = '',
  height = '700px',
}: CalendarEmptyStateProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-border p-4 flex items-center justify-center ${className}`}
      style={{ height }}
    >
      <div className="flex flex-col items-center justify-center max-w-md text-center space-y-4">
        {/* Icon */}
        <div className="rounded-full bg-muted p-6">
          <CalendarX className="h-12 w-12 text-muted-foreground" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Export component as default
 */
export default CalendarEmptyState;
