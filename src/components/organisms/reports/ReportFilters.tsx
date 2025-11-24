'use client';

import { Funnel, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}

const periodOptions = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: '180d', label: 'Últimos 6 meses' },
];

const specialtyOptions = [
    { value: 'todas', label: 'Todas especialidades' },
    { value: 'clinica', label: 'Clínica geral' },
    { value: 'cardio', label: 'Cardiologia' },
    { value: 'pedia', label: 'Pediatria' },
];

const unitOptions = [
    { value: 'todas', label: 'Todas unidades' },
    { value: 'paulista', label: 'Unidade Paulista' },
    { value: 'moema', label: 'Unidade Moema' },
    { value: 'campinas', label: 'Unidade Campinas' },
];

export function ReportFilters({ filters, onFiltersChange, onRefresh, isRefreshing }: ReportFiltersProps) {
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


