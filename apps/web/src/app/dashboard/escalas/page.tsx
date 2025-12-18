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
import { CalendarDays, Loader2, Plus, ChevronDown, Calendar, CalendarClock, List } from 'lucide-react';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { View } from 'react-big-calendar';

import { PageHeader } from '@/components/organisms/page';
import { ShiftsCalendar, SlotInfo } from '@/components/organisms/ShiftsCalendar';
import {
  CalendarFiltersSheet,
  CalendarFiltersSheetState,
  getDefaultFilters,
} from '@/components/organisms/CalendarFiltersSheet';
import { useOrganization } from '@/providers/OrganizationProvider';
import type { ShiftStatus, AssignmentStatus, ScheduleType } from '@/types/calendar';
import { useShiftFormData } from '@/hooks/useShiftFormData';
import { useShiftsCalendar } from '@/hooks/useShiftsCalendar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/atoms/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ShiftDialog } from '@/components/organisms/shifts/ShiftDialog';
import { FixedScheduleDialog } from '@/components/organisms/shifts/FixedScheduleDialog';
import { FixedScheduleList } from '@/components/organisms/shifts/FixedScheduleList';
import { ShiftsList } from '@/components/organisms/shifts/ShiftsList';

/**
 * Type alias for page filters (using the sheet state)
 */
type CalendarPageFilters = CalendarFiltersSheetState;

/**
 * Default filter values - current month, all facilities, all specialties
 */
const DEFAULT_FILTERS: CalendarPageFilters = getDefaultFilters();

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
  const initialFilters = useMemo((): CalendarPageFilters => {
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlFacilityId = searchParams.get('facilityId');
    const urlSpecialty = searchParams.get('specialty');
    const urlSectorId = searchParams.get('sectorId');
    const urlStaffId = searchParams.get('staffId');
    const urlStatus = searchParams.get('status');
    const urlShiftType = searchParams.get('shiftType');
    const urlAssignment = searchParams.get('assignment') as AssignmentStatus | null;
    const urlSchedule = searchParams.get('schedule') as ScheduleType | null;

    // Parse status array from comma-separated string
    const statusArray: ShiftStatus[] = urlStatus
      ? (urlStatus.split(',') as ShiftStatus[])
      : DEFAULT_FILTERS.status;

    return {
      startDate: urlStartDate || DEFAULT_FILTERS.startDate,
      endDate: urlEndDate || DEFAULT_FILTERS.endDate,
      facilityId: urlFacilityId || DEFAULT_FILTERS.facilityId,
      specialty: urlSpecialty || DEFAULT_FILTERS.specialty,
      sectorId: urlSectorId || DEFAULT_FILTERS.sectorId,
      staffId: urlStaffId || DEFAULT_FILTERS.staffId,
      status: statusArray,
      shiftType: urlShiftType || DEFAULT_FILTERS.shiftType,
      assignmentStatus: urlAssignment || DEFAULT_FILTERS.assignmentStatus,
      scheduleType: urlSchedule || DEFAULT_FILTERS.scheduleType,
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

  // Fetch form data for shift dialogs (facilities, staff, sectors)
  const {
    facilities,
    staff,
    sectors,
    isLoading: isLoadingFormData,
    refetch: refetchFormData,
  } = useShiftFormData(organizationId);

  // State for dialog management
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isFixedScheduleDialogOpen, setIsFixedScheduleDialogOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<any>(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState('calendario');

  // Fetch fixed schedules for the Fixed Schedules tab
  const {
    data: fixedSchedules = [],
    isLoading: fixedSchedulesLoading,
    refetch: refetchFixedSchedules,
  } = useQuery({
    queryKey: ['fixed-schedules', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('fixed_schedules')
        .select(`
          *,
          facilities (*),
          medical_staff (
            id,
            name,
            color,
            profissao:profissoes (
              id,
              nome
            )
          ),
          sectors (*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Calculate date range for calendar refetch
  const dateRange = useMemo(() => {
    return {
      startDate: startOfMonth(calendarDate).toISOString(),
      endDate: endOfMonth(calendarDate).toISOString(),
    };
  }, [calendarDate]);

  // Use shifts calendar hook for fetching shifts data (used by calendar and list)
  const {
    shifts: shiftsData,
    isLoading: isLoadingShifts,
    refetch: refetchCalendar,
  } = useShiftsCalendar(
    {
      organizationId: organizationId || '',
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      facilityId: filters.facilityId,
      specialty: filters.specialty,
      sectorId: filters.sectorId,
      staffId: filters.staffId,
      status: filters.status,
      shiftType: filters.shiftType,
      assignmentStatus: filters.assignmentStatus,
      scheduleType: filters.scheduleType,
    },
    { enabled: !!organizationId }
  );

  /**
   * Handle slot selection from calendar (for creating new shifts)
   */
  const handleSlotSelect = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlotDate(slotInfo.start);
    setIsShiftDialogOpen(true);
  }, []);

  /**
   * Handle successful shift/schedule creation
   */
  const handleShiftSuccess = useCallback(() => {
    refetchCalendar();
  }, [refetchCalendar]);

  /**
   * Handle successful fixed schedule creation/update
   */
  const handleFixedScheduleSuccess = useCallback(() => {
    refetchCalendar();
    refetchFormData();
    refetchFixedSchedules();
    setScheduleToEdit(null);
  }, [refetchCalendar, refetchFormData, refetchFixedSchedules]);

  /**
   * Handle fixed schedule edit
   */
  const handleEditFixedSchedule = useCallback((schedule: any) => {
    setScheduleToEdit(schedule);
    setIsFixedScheduleDialogOpen(true);
  }, []);

  /**
   * Handle fixed schedule delete
   */
  const handleDeleteFixedSchedule = useCallback(() => {
    refetchFixedSchedules();
    refetchCalendar();
  }, [refetchFixedSchedules, refetchCalendar]);

  /**
   * Handle view shift details from list
   */
  const handleViewShiftDetails = useCallback((shift: any) => {
    // For now, open the edit dialog in view mode
    // TODO: implement dedicated view modal if needed
    console.log('View shift details:', shift.id);
  }, []);

  /**
   * Handle edit shift from list
   */
  const handleEditShift = useCallback((shift: any) => {
    // TODO: implement shift editing - for now just log
    console.log('Edit shift:', shift.id);
  }, []);

  /**
   * Handle delete shift from list
   */
  const handleDeleteShift = useCallback(async (shiftId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta escala?')) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      refetchCalendar();
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('Erro ao excluir escala. Tente novamente.');
    }
  }, [refetchCalendar]);

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
      if (newFilters.sectorId !== DEFAULT_FILTERS.sectorId) {
        params.set('sectorId', newFilters.sectorId);
      }
      if (newFilters.staffId !== DEFAULT_FILTERS.staffId) {
        params.set('staffId', newFilters.staffId);
      }
      if (newFilters.status.length > 0) {
        params.set('status', newFilters.status.join(','));
      }
      if (newFilters.shiftType !== DEFAULT_FILTERS.shiftType) {
        params.set('shiftType', newFilters.shiftType);
      }
      if (newFilters.assignmentStatus !== DEFAULT_FILTERS.assignmentStatus) {
        params.set('assignment', newFilters.assignmentStatus);
      }
      if (newFilters.scheduleType !== DEFAULT_FILTERS.scheduleType) {
        params.set('schedule', newFilters.scheduleType);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, calendarDate, calendarView]
  );

  /**
   * Handle filter changes from CalendarFiltersSheet component
   * Updates both local state and URL parameters
   */
  const handleFiltersChange = useCallback(
    (newFilters: CalendarPageFilters) => {
      setFilters(newFilters);
      updateURLParams(newFilters);
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
    const urlStatus = searchParams.get('status');
    const statusArray: ShiftStatus[] = urlStatus
      ? (urlStatus.split(',') as ShiftStatus[])
      : DEFAULT_FILTERS.status;

    const urlFilters: CalendarPageFilters = {
      startDate: searchParams.get('startDate') || DEFAULT_FILTERS.startDate,
      endDate: searchParams.get('endDate') || DEFAULT_FILTERS.endDate,
      facilityId: searchParams.get('facilityId') || DEFAULT_FILTERS.facilityId,
      specialty: searchParams.get('specialty') || DEFAULT_FILTERS.specialty,
      sectorId: searchParams.get('sectorId') || DEFAULT_FILTERS.sectorId,
      staffId: searchParams.get('staffId') || DEFAULT_FILTERS.staffId,
      status: statusArray,
      shiftType: searchParams.get('shiftType') || DEFAULT_FILTERS.shiftType,
      assignmentStatus: (searchParams.get('assignment') as AssignmentStatus) || DEFAULT_FILTERS.assignmentStatus,
      scheduleType: (searchParams.get('schedule') as ScheduleType) || DEFAULT_FILTERS.scheduleType,
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
      {/* Page Header with Action Button */}
      <PageHeader
        icon={<CalendarDays className="h-6 w-6" />}
        title="Calendário de Escalas"
        description="Visualize e gerencie os plantões da sua equipe médica em um calendário intuitivo."
        actions={
          organizationId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Escala
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setSelectedSlotDate(null);
                  setIsShiftDialogOpen(true);
                }}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Escala Pontual
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsFixedScheduleDialogOpen(true)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Escala Fixa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      {/* Tabs for Calendar and Fixed Schedules */}
      {organizationId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="calendario">
              <Calendar className="mr-2 h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="lista">
              <List className="mr-2 h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="escalas-fixas">
              <CalendarClock className="mr-2 h-4 w-4" />
              Escalas Fixas
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendario" className="mt-6">
            {/* Calendar Display with integrated filters */}
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
                allowCreation={true}
                onSlotSelect={handleSlotSelect}
                filterSlot={
                  <CalendarFiltersSheet
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    organizationId={organizationId}
                    facilities={facilities}
                    sectors={sectors}
                    staff={staff}
                    isLoadingFormData={isLoadingFormData}
                  />
                }
              />
            </div>
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="lista" className="mt-6">
            <ShiftsList
              shifts={shiftsData}
              sectors={sectors}
              isLoading={isLoadingShifts || isLoadingFormData}
              onEdit={handleEditShift}
              onDelete={handleDeleteShift}
              onViewDetails={handleViewShiftDetails}
              filterSlot={
                <CalendarFiltersSheet
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  organizationId={organizationId}
                  facilities={facilities}
                  sectors={sectors}
                  staff={staff}
                  isLoadingFormData={isLoadingFormData}
                />
              }
            />
          </TabsContent>

          {/* Fixed Schedules Tab */}
          <TabsContent value="escalas-fixas" className="mt-6">
            <FixedScheduleList
              schedules={fixedSchedules}
              facilities={facilities}
              isLoading={fixedSchedulesLoading}
              onEdit={handleEditFixedSchedule}
              onDelete={handleDeleteFixedSchedule}
            />
          </TabsContent>
        </Tabs>
      ) : (
        !orgLoading && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg min-h-[400px]">
            <p className="text-muted-foreground">
              Selecione ou crie uma organização para visualizar as escalas.
            </p>
          </div>
        )
      )}

      {/* Shift Dialog (Pontual) */}
      {organizationId && (
        <ShiftDialog
          isOpen={isShiftDialogOpen}
          onClose={() => {
            setIsShiftDialogOpen(false);
            setSelectedSlotDate(null);
          }}
          onSuccess={handleShiftSuccess}
          organizationId={organizationId}
          sectors={sectors}
          facilities={facilities}
          staff={staff}
          initialDate={selectedSlotDate}
        />
      )}

      {/* Fixed Schedule Dialog */}
      {organizationId && (
        <FixedScheduleDialog
          isOpen={isFixedScheduleDialogOpen}
          onClose={() => {
            setIsFixedScheduleDialogOpen(false);
            setScheduleToEdit(null);
          }}
          onSuccess={handleFixedScheduleSuccess}
          organizationId={organizationId}
          facilities={facilities}
          staff={staff}
          sectors={sectors}
          scheduleToEdit={scheduleToEdit}
          onStaffRefresh={refetchFormData}
        />
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
