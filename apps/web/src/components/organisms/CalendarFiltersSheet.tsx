'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';

import { BaseSheet } from '@/components/molecules/BaseSheet';
import { SectorSelect } from '@/components/molecules/SectorSelect';
import { StaffCombobox } from '@/components/molecules/StaffCombobox';
import { StatusMultiSelect } from '@/components/molecules/StatusMultiSelect';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import type {
    ShiftStatus,
    AssignmentStatus,
    ScheduleType,
} from '@/types/calendar';
import type { Facility, Sector, MedicalStaff } from '@medsync/shared';

/**
 * Extended filter state for the sheet
 */
export interface CalendarFiltersSheetState {
    startDate: string;
    endDate: string;
    facilityId: string;
    sectorId: string;
    specialty: string;
    staffId: string;
    status: ShiftStatus[];
    shiftType: string;
    assignmentStatus: AssignmentStatus;
    scheduleType: ScheduleType;
}

interface CalendarFiltersSheetProps {
    /** Current filter state */
    filters: CalendarFiltersSheetState;
    /** Callback when filters are applied */
    onFiltersChange: (filters: CalendarFiltersSheetState) => void;
    /** Organization ID for fetching data */
    organizationId: string;
    /** Facilities data from useShiftFormData */
    facilities: Facility[];
    /** Sectors data from useShiftFormData */
    sectors: Sector[];
    /** Staff data from useShiftFormData */
    staff: MedicalStaff[];
    /** Whether form data is loading */
    isLoadingFormData?: boolean;
}

interface FilterOption {
    value: string;
    label: string;
}

const SHIFT_TYPE_OPTIONS: FilterOption[] = [
    { value: 'todos', label: 'Todos os turnos' },
    { value: 'morning', label: 'Manha' },
    { value: 'afternoon', label: 'Tarde' },
    { value: 'night', label: 'Noite' },
];

/**
 * Get default filter values
 */
export function getDefaultFilters(): CalendarFiltersSheetState {
    const today = new Date();
    return {
        startDate: startOfMonth(today).toISOString(),
        endDate: endOfMonth(today).toISOString(),
        facilityId: 'todas',
        sectorId: 'todos',
        specialty: 'todas',
        staffId: 'todos',
        status: [],
        shiftType: 'todos',
        assignmentStatus: 'all',
        scheduleType: 'all',
    };
}

/**
 * Count active filters (non-default values)
 */
export function countActiveFilters(filters: CalendarFiltersSheetState): number {
    const defaults = getDefaultFilters();
    let count = 0;

    // Date: count if different from current month
    const currentMonthStart = startOfMonth(new Date()).toISOString();
    const currentMonthEnd = endOfMonth(new Date()).toISOString();
    if (filters.startDate !== currentMonthStart || filters.endDate !== currentMonthEnd) {
        count++;
    }

    // Selects: count if not default
    if (filters.facilityId !== defaults.facilityId) count++;
    if (filters.sectorId !== defaults.sectorId) count++;
    if (filters.specialty !== defaults.specialty) count++;
    if (filters.staffId !== defaults.staffId) count++;

    // Status: count if any selected (and not all 4)
    if (filters.status.length > 0 && filters.status.length < 4) count++;

    // Types: count if not default
    if (filters.shiftType !== defaults.shiftType) count++;
    if (filters.assignmentStatus !== defaults.assignmentStatus) count++;
    if (filters.scheduleType !== defaults.scheduleType) count++;

    return count;
}

/**
 * CalendarFiltersSheet - Sheet component with comprehensive filter options
 *
 * Provides all possible filters for calendar shifts:
 * - Date range
 * - Facility, Sector
 * - Specialty, Staff
 * - Status (multi-select)
 * - Shift type, Assignment status, Schedule type
 */
export function CalendarFiltersSheet({
    filters,
    onFiltersChange,
    organizationId,
    facilities,
    sectors,
    staff,
    isLoadingFormData = false,
}: CalendarFiltersSheetProps) {
    const [open, setOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<CalendarFiltersSheetState>(filters);
    const [specialtyOptions, setSpecialtyOptions] = useState<FilterOption[]>([
        { value: 'todas', label: 'Todas especialidades' },
    ]);

    // Sync local filters when props change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // Fetch specialty options from API
    useEffect(() => {
        if (!organizationId) return;

        async function fetchSpecialties() {
            try {
                const response = await fetch(
                    `/api/reports/filter-options?organization_id=${organizationId}`
                );
                if (!response.ok) return;

                const result = await response.json();
                if (result.ok && result.data?.specialties) {
                    const options: FilterOption[] = [
                        { value: 'todas', label: 'Todas especialidades' },
                        ...result.data.specialties.map((s: string) => ({
                            value: s,
                            label: capitalize(s),
                        })),
                    ];
                    setSpecialtyOptions(options);
                }
            } catch (error) {
                console.error('Error fetching specialties:', error);
            }
        }

        fetchSpecialties();
    }, [organizationId]);

    // Build facility options
    const facilityOptions = useMemo((): FilterOption[] => {
        return [
            { value: 'todas', label: 'Todas unidades' },
            ...facilities.map((f) => ({ value: f.id, label: f.name })),
        ];
    }, [facilities]);

    // Build staff options for combobox
    const staffOptions = useMemo(() => {
        return staff.map((s) => ({
            id: s.id,
            name: s.name,
            specialty: (s as { especialidade?: { nome?: string } }).especialidade?.nome,
            color: s.color ?? undefined,
        }));
    }, [staff]);

    // Date range state
    const dateRange = useMemo((): DateRange | undefined => {
        const from = localFilters.startDate ? new Date(localFilters.startDate) : undefined;
        const to = localFilters.endDate ? new Date(localFilters.endDate) : undefined;
        return from && to ? { from, to } : undefined;
    }, [localFilters.startDate, localFilters.endDate]);

    const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            setLocalFilters((prev) => ({
                ...prev,
                startDate: range.from!.toISOString(),
                endDate: range.to!.toISOString(),
            }));
        }
    }, []);

    const handleApply = useCallback(() => {
        onFiltersChange(localFilters);
        setOpen(false);
    }, [localFilters, onFiltersChange]);

    const handleClear = useCallback(() => {
        const defaults = getDefaultFilters();
        setLocalFilters(defaults);
    }, []);

    const activeCount = countActiveFilters(filters);

    return (
        <>
            {/* Trigger Button */}
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="gap-2"
            >
                <Filter className="h-4 w-4" />
                Filtros
                {activeCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {activeCount}
                    </Badge>
                )}
            </Button>

            {/* Sheet */}
            <BaseSheet
                open={open}
                onOpenChange={setOpen}
                title="Filtros de Calendario"
                description="Configure os filtros para visualizar as escalas desejadas"
                footer={
                    <div className="flex w-full gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClear}
                            className="flex-1"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Limpar
                        </Button>
                        <Button onClick={handleApply} className="flex-1">
                            Aplicar filtros
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Secao: Periodo */}
                    <section className="space-y-3">
                        <Label className="text-sm font-semibold text-foreground">
                            Periodo
                        </Label>
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
                                        <span>Selecione o periodo</span>
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
                    </section>

                    <Separator />

                    {/* Secao: Localizacao */}
                    <section className="space-y-4">
                        <Label className="text-sm font-semibold text-foreground">
                            Localizacao
                        </Label>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Unidade
                                </Label>
                                <Select
                                    value={localFilters.facilityId}
                                    onValueChange={(value) =>
                                        setLocalFilters((prev) => ({ ...prev, facilityId: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas unidades" />
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

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Setor
                                </Label>
                                <SectorSelect
                                    sectors={sectors}
                                    value={localFilters.sectorId === 'todos' ? '' : localFilters.sectorId}
                                    onChange={(value) =>
                                        setLocalFilters((prev) => ({
                                            ...prev,
                                            sectorId: value || 'todos',
                                        }))
                                    }
                                    placeholder="Todos os setores"
                                    isLoading={isLoadingFormData}
                                />
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Secao: Profissional */}
                    <section className="space-y-4">
                        <Label className="text-sm font-semibold text-foreground">
                            Profissional
                        </Label>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Especialidade
                                </Label>
                                <Select
                                    value={localFilters.specialty}
                                    onValueChange={(value) =>
                                        setLocalFilters((prev) => ({ ...prev, specialty: value }))
                                    }
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

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Profissional
                                </Label>
                                <StaffCombobox
                                    staff={staffOptions}
                                    value={localFilters.staffId === 'todos' ? '' : localFilters.staffId}
                                    onChange={(value) =>
                                        setLocalFilters((prev) => ({
                                            ...prev,
                                            staffId: value || 'todos',
                                        }))
                                    }
                                    placeholder="Todos os profissionais"
                                    isLoading={isLoadingFormData}
                                />
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Secao: Status */}
                    <section className="space-y-3">
                        <Label className="text-sm font-semibold text-foreground">
                            Status da Escala
                        </Label>
                        <StatusMultiSelect
                            value={localFilters.status}
                            onChange={(value) =>
                                setLocalFilters((prev) => ({ ...prev, status: value }))
                            }
                        />
                    </section>

                    <Separator />

                    {/* Secao: Tipo */}
                    <section className="space-y-4">
                        <Label className="text-sm font-semibold text-foreground">
                            Tipo de Escala
                        </Label>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Turno
                                </Label>
                                <Select
                                    value={localFilters.shiftType}
                                    onValueChange={(value) =>
                                        setLocalFilters((prev) => ({ ...prev, shiftType: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos os turnos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SHIFT_TYPE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    Atribuicao
                                </Label>
                                <RadioGroup
                                    value={localFilters.assignmentStatus}
                                    onValueChange={(value: AssignmentStatus) =>
                                        setLocalFilters((prev) => ({
                                            ...prev,
                                            assignmentStatus: value,
                                        }))
                                    }
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all" id="assignment-all" />
                                        <Label htmlFor="assignment-all" className="text-sm font-normal">
                                            Todas
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="assigned" id="assignment-assigned" />
                                        <Label htmlFor="assignment-assigned" className="text-sm font-normal">
                                            Com profissional
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="unassigned" id="assignment-unassigned" />
                                        <Label htmlFor="assignment-unassigned" className="text-sm font-normal">
                                            Sem profissional
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    Origem
                                </Label>
                                <RadioGroup
                                    value={localFilters.scheduleType}
                                    onValueChange={(value: ScheduleType) =>
                                        setLocalFilters((prev) => ({
                                            ...prev,
                                            scheduleType: value,
                                        }))
                                    }
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all" id="schedule-all" />
                                        <Label htmlFor="schedule-all" className="text-sm font-normal">
                                            Todas
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="manual" id="schedule-manual" />
                                        <Label htmlFor="schedule-manual" className="text-sm font-normal">
                                            Manual
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="fixed" id="schedule-fixed" />
                                        <Label htmlFor="schedule-fixed" className="text-sm font-normal">
                                            Escala fixa
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </section>
                </div>
            </BaseSheet>
        </>
    );
}

// Helper function to capitalize
function capitalize(str: string): string {
    return str
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
