'use client';

import { useEffect, useState } from 'react';
import { Funnel, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ReportFiltersState } from '@/lib/reports';

interface ReportFiltersProps {
    filters: ReportFiltersState;
    onFiltersChange: (partial: Partial<ReportFiltersState>) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    organizationId?: string | null;
}

interface FilterOption {
    value: string;
    label: string;
}

interface FacilityData {
    id: string;
    name: string;
}

const periodOptions: FilterOption[] = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: '180d', label: 'Últimos 6 meses' },
];

// Fallback options in case API fails
const defaultSpecialtyOptions: FilterOption[] = [
    { value: 'todas', label: 'Todas especialidades' },
    { value: 'clinica', label: 'Clínica geral' },
    { value: 'cardio', label: 'Cardiologia' },
    { value: 'pedia', label: 'Pediatria' },
];

const defaultUnitOptions: FilterOption[] = [
    { value: 'todas', label: 'Todas unidades' },
    { value: 'paulista', label: 'Unidade Paulista' },
    { value: 'moema', label: 'Unidade Moema' },
    { value: 'campinas', label: 'Unidade Campinas' },
];

export function ReportFilters({ filters, onFiltersChange, onRefresh, isRefreshing, organizationId }: ReportFiltersProps) {
    const [specialtyOptions, setSpecialtyOptions] = useState<FilterOption[]>(defaultSpecialtyOptions);
    const [unitOptions, setUnitOptions] = useState<FilterOption[]>(defaultUnitOptions);

    useEffect(() => {
        // Only fetch filter options if we have an organization_id
        if (!organizationId) {
            return;
        }

        // Fetch dynamic filter options from API
        async function fetchFilterOptions() {
            try {
                const response = await fetch(`/api/reports/filter-options?organization_id=${organizationId}`);
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

                    // Build facility/unit options
                    const dynamicUnits: FilterOption[] = [
                        { value: 'todas', label: 'Todas unidades' },
                        ...result.data.facilities.map((facility: FacilityData) => ({
                            value: facility.id,
                            label: facility.name,
                        })),
                    ];
                    setUnitOptions(dynamicUnits);
                }
            } catch (error) {
                console.error('Error fetching filter options:', error);
                // Keep using default/fallback options
            }
        }

        fetchFilterOptions();
    }, [organizationId]);

    return (
        <Card className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <div className="rounded-full bg-muted p-2">
                        <Funnel className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base font-semibold">Filtros inteligentes</CardTitle>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRefresh?.()}
                    disabled={!onRefresh || isRefreshing}
                    className="gap-2"
                >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Atualizar
                </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Período</p>
                    <Select
                        value={filters.period}
                        onValueChange={(value) => onFiltersChange({ period: value as ReportFiltersState['period'] })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                            {periodOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Especialidade</p>
                    <Select value={filters.specialty} onValueChange={(value) => onFiltersChange({ specialty: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por especialidade" />
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unidade</p>
                    <Select value={filters.unit} onValueChange={(value) => onFiltersChange({ unit: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todas as unidades" />
                        </SelectTrigger>
                        <SelectContent>
                            {unitOptions.map((option) => (
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

