'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Calendar, Clock, Building2, Award, CalendarX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Status of a shift
 */
export type ShiftStatus = 'completed' | 'scheduled' | 'cancelled' | 'in_progress';

/**
 * Shift history item data structure
 */
export interface ShiftHistoryItem {
  /** Unique identifier for the shift */
  id: string;
  /** Shift date (ISO string or Date object) */
  date: Date | string;
  /** Facility name where shift took place */
  facility: string;
  /** Specialty for the shift (optional) */
  specialty: string | null;
  /** Number of hours worked */
  hours: number;
  /** Current status of the shift */
  status: ShiftStatus;
}

/**
 * Props for MedicalStaffShiftHistory component
 */
export interface MedicalStaffShiftHistoryProps {
  /** Array of shift history items to display */
  shifts: ShiftHistoryItem[];
  /** Loading state for skeleton display */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Maximum height for the scrollable area (default: '600px') */
  maxHeight?: string;
  /** Show card wrapper (default: true) */
  showCard?: boolean;
}

/**
 * Configuration for shift status badges
 */
const STATUS_CONFIG: Record<ShiftStatus, { label: string; className: string }> = {
  completed: {
    label: 'Concluído',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  scheduled: {
    label: 'Agendado',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  in_progress: {
    label: 'Em Andamento',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
};

/**
 * Format date to Portuguese locale
 */
function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Format hours with proper plural handling
 */
function formatHours(hours: number): string {
  return hours === 1 ? '1 hora' : `${hours} horas`;
}

/**
 * Sort shifts by date (most recent first)
 */
function sortShiftsByDate(shifts: ShiftHistoryItem[]): ShiftHistoryItem[] {
  return [...shifts].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
    const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="shift-empty-state"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <CalendarX className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Nenhum plantão encontrado
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Não há histórico de plantões para exibir no momento.
      </p>
    </div>
  );
}

/**
 * Skeleton loader for shift history
 */
function SkeletonLoader() {
  return (
    <div className="space-y-4" data-testid="shift-history-skeleton">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-4 rounded-lg border p-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Individual shift item component
 */
const ShiftItem = React.memo<{ shift: ShiftHistoryItem; style: React.CSSProperties }>(
  ({ shift, style }) => {
    const statusConfig = STATUS_CONFIG[shift.status];

    return (
      <div
        style={style}
        className="absolute left-0 top-0 w-full px-2"
        data-testid="shift-item"
        data-shift-id={shift.id}
      >
        <div className="flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
          {/* Date Badge */}
          <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>

          {/* Shift Details */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(shift.date)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{shift.facility}</span>
                  </div>
                  {shift.specialty && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>{shift.specialty}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn('flex-shrink-0', statusConfig.className)}
                data-testid="shift-status-badge"
              >
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{formatHours(shift.hours)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShiftItem.displayName = 'ShiftItem';

/**
 * MedicalStaffShiftHistory Component
 *
 * Displays recent shift history in a timeline/list format with virtual scrolling
 * for performance optimization with large datasets.
 *
 * @example
 * ```tsx
 * const shifts: ShiftHistoryItem[] = [
 *   {
 *     id: '1',
 *     date: new Date('2024-01-15'),
 *     facility: 'Hospital São Paulo',
 *     specialty: 'Cardiologia',
 *     hours: 12,
 *     status: 'completed',
 *   },
 * ];
 *
 * <MedicalStaffShiftHistory shifts={shifts} />
 * ```
 *
 * @example With loading state
 * ```tsx
 * <MedicalStaffShiftHistory shifts={[]} loading={true} />
 * ```
 *
 * @example Custom max height
 * ```tsx
 * <MedicalStaffShiftHistory shifts={shifts} maxHeight="400px" />
 * ```
 */
export const MedicalStaffShiftHistory = React.memo<MedicalStaffShiftHistoryProps>(
  ({ shifts, loading = false, className, maxHeight = '600px', showCard = true }) => {
    const parentRef = React.useRef<HTMLDivElement>(null);

    // Sort shifts by date (most recent first)
    const sortedShifts = React.useMemo(() => sortShiftsByDate(shifts), [shifts]);

    // Virtual scrolling configuration
    const rowVirtualizer = useVirtualizer({
      count: sortedShifts.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 96, // Estimated height of each shift item (80px content + 16px gap)
      overscan: 5, // Number of items to render outside of the visible area
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    // Content to display
    const content = loading ? (
      <SkeletonLoader />
    ) : sortedShifts.length === 0 ? (
      <EmptyState />
    ) : (
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.length > 0 ? (
            // Virtual scrolling rendering
            virtualItems.map((virtualItem) => {
              const shift = sortedShifts[virtualItem.index];
              return (
                <ShiftItem
                  key={shift.id}
                  shift={shift}
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                />
              );
            })
          ) : (
            // Fallback rendering for test environment or when virtualizer isn't ready
            sortedShifts.map((shift, index) => (
              <ShiftItem
                key={shift.id}
                shift={shift}
                style={{
                  height: '96px',
                  transform: `translateY(${index * 96}px)`,
                }}
              />
            ))
          )}
        </div>
      </div>
    );

    if (!showCard) {
      return <div className={cn('w-full', className)}>{content}</div>;
    }

    return (
      <Card className={cn('w-full', className)} data-testid="shift-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Plantões
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }
);

MedicalStaffShiftHistory.displayName = 'MedicalStaffShiftHistory';
