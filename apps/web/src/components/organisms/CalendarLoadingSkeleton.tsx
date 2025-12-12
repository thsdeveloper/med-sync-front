/**
 * CalendarLoadingSkeleton Organism Component
 *
 * Loading skeleton that mimics the calendar layout structure.
 * Shows placeholder elements for the toolbar and calendar grid.
 *
 * Usage:
 * ```tsx
 * import { CalendarLoadingSkeleton } from '@/components/organisms/CalendarLoadingSkeleton';
 *
 * function MyCalendar() {
 *   const { isLoading } = useShiftsCalendar({ ... });
 *
 *   if (isLoading) {
 *     return <CalendarLoadingSkeleton />;
 *   }
 *
 *   return <CalendarWrapper ... />;
 * }
 * ```
 */

'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Props for the CalendarLoadingSkeleton component
 */
export interface CalendarLoadingSkeletonProps {
  /** Height of the skeleton (default: '700px') */
  height?: string | number;
  /** Custom CSS class name */
  className?: string;
}

/**
 * CalendarLoadingSkeleton - Loading state placeholder for calendar
 *
 * This organism component displays a skeleton loader that mimics the calendar
 * layout structure with toolbar and grid cells.
 *
 * @param props - Skeleton configuration props
 * @returns Loading skeleton component
 */
export function CalendarLoadingSkeleton({
  height = '700px',
  className = '',
}: CalendarLoadingSkeletonProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-border p-4 ${className}`}
      style={{ height }}
    >
      {/* Toolbar Skeleton */}
      <div className="mb-4 flex items-center justify-between">
        {/* Left: View buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>

        {/* Center: Month/Date label */}
        <Skeleton className="h-9 w-48" />

        {/* Right: Navigation buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="space-y-2">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-8 w-full" />
          ))}
        </div>

        {/* Calendar rows (5 weeks) */}
        {Array.from({ length: 5 }).map((_, weekIndex) => (
          <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <div key={`day-${weekIndex}-${dayIndex}`} className="space-y-1">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Loading indicator text */}
      <div className="mt-4 flex items-center justify-center">
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

/**
 * Export component as default
 */
export default CalendarLoadingSkeleton;
