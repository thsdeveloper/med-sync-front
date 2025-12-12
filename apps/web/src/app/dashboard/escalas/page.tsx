/**
 * Escalas (Shifts) Calendar Page
 *
 * Main calendar page for viewing and managing shifts.
 * Integrates ShiftsCalendar, CalendarFilters, and ShiftDetailModal components.
 * Implements organization-based access control and responsive layout.
 */

'use client';

import { useState, useMemo } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

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
 * Escalas Page Component
 *
 * Displays the main shifts calendar with filtering capabilities.
 * Users can filter by date range, facility, and specialty.
 * Organization-based access control ensures users only see their organization's shifts.
 */
export default function EscalasPage() {
  const { activeOrganization, loading: orgLoading } = useOrganization();
  const [filters, setFilters] = useState<CalendarPageFilters>(DEFAULT_FILTERS);

  // Extract organization ID (null if no organization selected)
  const organizationId = activeOrganization?.id ?? null;

  /**
   * Handle filter changes from CalendarFilters component
   */
  const handleFiltersChange = (partial: Partial<CalendarPageFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

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
          onClear={() => setFilters(DEFAULT_FILTERS)}
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
            defaultDate={new Date()}
            height="700px"
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
