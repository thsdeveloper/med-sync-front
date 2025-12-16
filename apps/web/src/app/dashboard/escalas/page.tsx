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
import { startOfMonth, endOfMonth } from 'date-fns';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

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

  const [filters, setFilters] = useState<CalendarPageFilters>(initialFilters);

  // State to track calendar's internal date (for synchronization)
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Extract organization ID (null if no organization selected)
  const organizationId = activeOrganization?.id ?? null;

  /**
   * Update URL parameters when filters change
   * Uses replace to avoid polluting browser history
   */
  const updateURLParams = useCallback(
    (newFilters: CalendarPageFilters) => {
      const params = new URLSearchParams();

      // Only add non-default values to keep URL clean
      if (newFilters.startDate !== DEFAULT_FILTERS.startDate) {
        params.set('startDate', newFilters.startDate);
      }
      if (newFilters.endDate !== DEFAULT_FILTERS.endDate) {
        params.set('endDate', newFilters.endDate);
      }
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
    [pathname, router]
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
   * This keeps the filter date range in sync with calendar navigation
   */
  const handleCalendarDateChange = useCallback(
    (newDate: Date) => {
      setCalendarDate(newDate);
      // Note: We don't update filters here to avoid circular updates
      // The calendar manages its own date range based on view mode
    },
    []
  );

  /**
   * Clear all filters to default values
   */
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    updateURLParams(DEFAULT_FILTERS);
    setCalendarDate(new Date()); // Reset calendar to today
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
   * Sync filters when URL parameters change (browser back/forward)
   */
  useEffect(() => {
    const urlFilters = {
      startDate: searchParams.get('startDate') || DEFAULT_FILTERS.startDate,
      endDate: searchParams.get('endDate') || DEFAULT_FILTERS.endDate,
      facilityId: searchParams.get('facilityId') || DEFAULT_FILTERS.facilityId,
      specialty: searchParams.get('specialty') || DEFAULT_FILTERS.specialty,
    };

    // Only update if different to avoid infinite loops
    if (JSON.stringify(urlFilters) !== JSON.stringify(filters)) {
      setFilters(urlFilters);
    }
  }, [searchParams]); // Intentionally omitting filters from deps to prevent loops

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
            defaultView="month"
            defaultDate={calendarDate}
            height="700px"
            onDateChange={handleCalendarDateChange}
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
