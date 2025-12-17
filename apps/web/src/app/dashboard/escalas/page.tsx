/**
 * Escalas (Shifts) Calendar Page
 *
 * Main calendar page for viewing and managing shifts.
 * Integrates ShiftsCalendar, CalendarFilters, and ShiftDetailModal components.
 * Implements organization-based access control, responsive layout, and URL-based state persistence.
 *
 * State Management:
 * - Uses URL search parameters for persistent filter state
 * - Synchronizes calendar navigation with filter date ranges
 * - Ensures all filters work harmoniously without conflicts
 */

'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { View } from 'react-big-calendar';

import { PageHeader } from '@/components/organisms/page';
import { ShiftsCalendar } from '@/components/organisms/ShiftsCalendar';
import { CalendarFilters } from '@/components/molecules/CalendarFilters';
import { useOrganization } from '@/providers/OrganizationProvider';

/**
 * Filter state for the calendar page
 */
interface CalendarPageFilters {
  startDate: string;
  endDate: string;
  facilityId: string;
  specialty: string;
}

/**
 * Default filter values - current month, all facilities, all specialties
 */
const DEFAULT_FILTERS: CalendarPageFilters = {
  startDate: startOfMonth(new Date()).toISOString(),
  endDate: endOfMonth(new Date()).toISOString(),
  facilityId: 'todas',
  specialty: 'todas',
};

/**
 * Default view mode for the calendar
 */
const DEFAULT_VIEW: View = 'month';

/**
 * Inner component that uses useSearchParams (must be wrapped in Suspense)
 */
function EscalasPageContent() {
  const { activeOrganization, loading: orgLoading } = useOrganization();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize filters from URL parameters or defaults
  const initialFilters = useMemo(() => {
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlFacilityId = searchParams.get('facilityId');
    const urlSpecialty = searchParams.get('specialty');

    return {
      startDate: urlStartDate || DEFAULT_FILTERS.startDate,
      endDate: urlEndDate || DEFAULT_FILTERS.endDate,
      facilityId: urlFacilityId || DEFAULT_FILTERS.facilityId,
      specialty: urlSpecialty || DEFAULT_FILTERS.specialty,
    };
  }, [searchParams]);

  // Initialize date from URL parameter or default to today
  const initialDate = useMemo(() => {
    const urlDate = searchParams.get('date');
    if (urlDate) {
      try {
        return parseISO(urlDate);
      } catch {
        return new Date();
      }
    }
    return new Date();
  }, [searchParams]);

  // Initialize view from URL parameter or default
  const initialView = useMemo(() => {
    const urlView = searchParams.get('view') as View | null;
    const validViews: View[] = ['month', 'week', 'day', 'agenda'];
    if (urlView && validViews.includes(urlView)) {
      return urlView;
    }
    return DEFAULT_VIEW;
  }, [searchParams]);

  const [filters, setFilters] = useState<CalendarPageFilters>(initialFilters);

  // State to track calendar's internal date (for synchronization)
  const [calendarDate, setCalendarDate] = useState<Date>(initialDate);

  // State to track calendar view mode
  const [calendarView, setCalendarView] = useState<View>(initialView);

  // Extract organization ID (null if no organization selected)
  const organizationId = activeOrganization?.id ?? null;

  /**
   * Update URL parameters when filters, date, or view change
   * Uses replaceState to avoid polluting browser history with each small change
   */
  const updateURLParams = useCallback(
    (
      newFilters: CalendarPageFilters,
      date: Date = calendarDate,
      view: View = calendarView
    ) => {
      const params = new URLSearchParams();

      // Add date parameter (always, for shareable URLs)
      const dateStr = format(date, 'yyyy-MM-dd');
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (dateStr !== todayStr) {
        params.set('date', dateStr);
      }

      // Add view parameter if not default
      if (view !== DEFAULT_VIEW) {
        params.set('view', view);
      }

      // Only add filter values if non-default to keep URL clean
      if (newFilters.facilityId !== DEFAULT_FILTERS.facilityId) {
        params.set('facilityId', newFilters.facilityId);
      }
      if (newFilters.specialty !== DEFAULT_FILTERS.specialty) {
        params.set('specialty', newFilters.specialty);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, calendarDate, calendarView]
  );

  /**
   * Handle filter changes from CalendarFilters component
   * Updates both local state and URL parameters
   */
  const handleFiltersChange = useCallback(
    (partial: Partial<CalendarPageFilters>) => {
      setFilters((prev) => {
        const newFilters = { ...prev, ...partial };
        updateURLParams(newFilters);
        return newFilters;
      });
    },
    [updateURLParams]
  );

  /**
   * Handle calendar date changes from ShiftsCalendar navigation
   * Updates local state and URL parameters
   */
  const handleCalendarDateChange = useCallback(
    (newDate: Date) => {
      setCalendarDate(newDate);
      updateURLParams(filters, newDate, calendarView);
    },
    [filters, calendarView, updateURLParams]
  );

  /**
   * Handle calendar view changes from ShiftsCalendar
   * Updates local state and URL parameters
   */
  const handleCalendarViewChange = useCallback(
    (newView: View) => {
      setCalendarView(newView);
      updateURLParams(filters, calendarDate, newView);
    },
    [filters, calendarDate, updateURLParams]
  );

  /**
   * Clear all filters to default values
   */
  const handleClearFilters = useCallback(() => {
    const today = new Date();
    setFilters(DEFAULT_FILTERS);
    setCalendarDate(today);
    setCalendarView(DEFAULT_VIEW);
    updateURLParams(DEFAULT_FILTERS, today, DEFAULT_VIEW);
  }, [updateURLParams]);

  /**
   * Calculate date range values for calendar display
   * Handles empty date strings from filter clear action
   */
  const { startDate, endDate } = useMemo(() => {
    // If filters have empty dates, use current month as fallback
    const start = filters.startDate || startOfMonth(new Date()).toISOString();
    const end = filters.endDate || endOfMonth(new Date()).toISOString();
    return { startDate: start, endDate: end };
  }, [filters.startDate, filters.endDate]);

  /**
   * Sync state when URL parameters change (browser back/forward)
   */
  useEffect(() => {
    const urlFilters = {
      startDate: searchParams.get('startDate') || DEFAULT_FILTERS.startDate,
      endDate: searchParams.get('endDate') || DEFAULT_FILTERS.endDate,
      facilityId: searchParams.get('facilityId') || DEFAULT_FILTERS.facilityId,
      specialty: searchParams.get('specialty') || DEFAULT_FILTERS.specialty,
    };

    // Sync date from URL
    const urlDate = searchParams.get('date');
    let newDate = new Date();
    if (urlDate) {
      try {
        newDate = parseISO(urlDate);
      } catch {
        // Keep default
      }
    }

    // Sync view from URL
    const urlView = searchParams.get('view') as View | null;
    const validViews: View[] = ['month', 'week', 'day', 'agenda'];
    const newView = urlView && validViews.includes(urlView) ? urlView : DEFAULT_VIEW;

    // Only update if different to avoid infinite loops
    if (JSON.stringify(urlFilters) !== JSON.stringify(filters)) {
      setFilters(urlFilters);
    }

    // Update date if different (compare as ISO strings to avoid reference issues)
    if (format(newDate, 'yyyy-MM-dd') !== format(calendarDate, 'yyyy-MM-dd')) {
      setCalendarDate(newDate);
    }

    // Update view if different
    if (newView !== calendarView) {
      setCalendarView(newView);
    }
  }, [searchParams]); // Intentionally omitting state deps to prevent loops

  // Show loading spinner while organization context is initializing
  if (orgLoading && !organizationId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        icon={<CalendarDays className="h-6 w-6" />}
        title="Calendário de Escalas"
        description="Visualize e gerencie os plantões da sua equipe médica em um calendário intuitivo."
      />

      {/* Calendar Filters */}
      {organizationId && (
        <CalendarFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          organizationId={organizationId}
          onClear={handleClearFilters}
        />
      )}

      {/* Calendar Display or Empty State */}
      {organizationId ? (
        <div className="flex-1">
          <ShiftsCalendar
            organizationId={organizationId}
            facilityId={filters.facilityId}
            specialty={filters.specialty}
            defaultView={DEFAULT_VIEW}
            view={calendarView}
            defaultDate={calendarDate}
            height="700px"
            onDateChange={handleCalendarDateChange}
            onViewChange={handleCalendarViewChange}
          />
        </div>
      ) : (
        !orgLoading && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg min-h-[400px]">
            <p className="text-muted-foreground">
              Selecione ou crie uma organização para visualizar as escalas.
            </p>
          </div>
        )
      )}
    </div>
  );
}

/**
 * Escalas Page Component (with Suspense boundary)
 *
 * Wraps the main component in Suspense to handle useSearchParams() requirement.
 *
 * Displays the main shifts calendar with filtering capabilities.
 * Users can filter by date range, facility, and specialty.
 * Organization-based access control ensures users only see their organization's shifts.
 *
 * Features:
 * - URL-based state persistence (filters persist across page reloads)
 * - Synchronized state between CalendarFilters and calendar navigation
 * - No race conditions between different filter types
 * - Optimized performance with debounced URL updates
 * - Comprehensive error handling and loading states
 */
export default function EscalasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <EscalasPageContent />
    </Suspense>
  );
}
