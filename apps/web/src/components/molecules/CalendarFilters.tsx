'use client';

import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Funnel, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * Filter state interface for calendar filters
 */
export interface CalendarFiltersState {
  /** Start date in ISO 8601 format */
  startDate: string;
  /** End date in ISO 8601 format */
  endDate: string;
  /** Facility ID or 'todas' for all facilities */
  facilityId: string;
  /** Specialty or 'todas' for all specialties */
  specialty: string;
}

interface CalendarFiltersProps {
  /** Current filter state */
  filters: CalendarFiltersState;
  /** Callback when filters change */
  onFiltersChange: (partial: Partial<CalendarFiltersState>) => void;
  /** Organization ID for fetching filter options */
  organizationId: string;
  /** Optional callback when clear filters is clicked */
  onClear?: () => void;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FacilityData {
  id: string;
  name: string;
}

// Fallback options in case API fails
const defaultSpecialtyOptions: FilterOption[] = [
  { value: 'todas', label: 'Todas especialidades' },
  { value: 'clinica', label: 'Clínica geral' },
  { value: 'cardio', label: 'Cardiologia' },
  { value: 'neuro', label: 'Neurologia' },
];

const defaultFacilityOptions: FilterOption[] = [
  { value: 'todas', label: 'Todas unidades' },
];

/**
 * CalendarFilters component provides filtering controls for the calendar view.
 *
 * Features:
 * - Date range picker with Portuguese locale
 * - Facility dropdown populated from API
 * - Specialty dropdown populated from API
 * - Clear filters button
 *
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<CalendarFiltersState>({
 *   startDate: startOfMonth(new Date()).toISOString(),
 *   endDate: endOfMonth(new Date()).toISOString(),
 *   facilityId: 'todas',
 *   specialty: 'todas',
 * });
 *
 * <CalendarFilters
 *   filters={filters}
 *   onFiltersChange={(partial) => setFilters({ ...filters, ...partial })}
 *   organizationId={organizationId}
 * />
 * ```
 */
export function CalendarFilters({
  filters,
  onFiltersChange,
  organizationId,
  onClear,
}: CalendarFiltersProps) {
  const [specialtyOptions, setSpecialtyOptions] = useState<FilterOption[]>(
    defaultSpecialtyOptions
  );
  const [facilityOptions, setFacilityOptions] = useState<FilterOption[]>(
    defaultFacilityOptions
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // Initialize date range from filters
    const from = filters.startDate ? new Date(filters.startDate) : undefined;
    const to = filters.endDate ? new Date(filters.endDate) : undefined;
    return from && to ? { from, to } : undefined;
  });

  // Fetch filter options from API
  useEffect(() => {
    if (!organizationId) {
      return;
    }

    async function fetchFilterOptions() {
      try {
        const response = await fetch(
          `/api/reports/filter-options?organization_id=${organizationId}`
        );
        if (!response.ok) {
          console.error('Failed to fetch filter options');
          return;
        }

        const result = await response.json();
        if (result.ok && result.data) {
          // Build specialty options
          const dynamicSpecialties: FilterOption[] = [
            { value: 'todas', label: 'Todas especialidades' },
            ...result.data.specialties.map((specialty: string) => ({
              value: specialty,
              label: capitalize(specialty),
            })),
          ];
          setSpecialtyOptions(dynamicSpecialties);

          // Build facility options
          const dynamicFacilities: FilterOption[] = [
            { value: 'todas', label: 'Todas unidades' },
            ...result.data.facilities.map((facility: FacilityData) => ({
              value: facility.id,
              label: facility.name,
            })),
          ];
          setFacilityOptions(dynamicFacilities);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Keep using default/fallback options
      }
    }

    fetchFilterOptions();
  }, [organizationId]);

  // Update filters when date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFiltersChange({
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
      });
    }
  };

  // Clear all filters to default
  const handleClearFilters = () => {
    setDateRange(undefined);
    onFiltersChange({
      startDate: '',
      endDate: '',
      facilityId: 'todas',
      specialty: 'todas',
    });
    onClear?.();
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-muted p-2">
            <Funnel className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-base font-semibold">
            Filtros de calendário
          </CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {/* Date Range Picker */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Período
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                      {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Facility Dropdown */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Unidade
          </p>
          <Select
            value={filters.facilityId}
            onValueChange={(value) => onFiltersChange({ facilityId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as unidades" />
            </SelectTrigger>
            <SelectContent>
              {facilityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Specialty Dropdown */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Especialidade
          </p>
          <Select
            value={filters.specialty}
            onValueChange={(value) => onFiltersChange({ specialty: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas especialidades" />
            </SelectTrigger>
            <SelectContent>
              {specialtyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to capitalize first letter of each word
function capitalize(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
