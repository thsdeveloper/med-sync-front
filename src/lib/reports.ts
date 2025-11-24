import { format } from 'date-fns';

export type ReportPeriod = '7d' | '30d' | '90d' | '180d';

export interface ReportFiltersState {
    period: ReportPeriod;
    specialty: string;
    unit: string;
}

export interface SpecialtyTrendPoint {
    label: string;
    geral: number;
    cardiologia: number;
    pediatria: number;
}

export interface EfficiencyPoint {
    label: string;
    ocupacao: number;
    sla: number;
}

export interface FinancialPoint {
    label: string;
    receita: number;
    glosas: number;
}

export interface SummaryMetric {
    id: string;
    label: string;
    value: string;
    helper: string;
    delta: number;
}

export interface HighlightRow {
    id: string;
    name: string;
    specialty: string;
    unit: string;
    volume: number;
    variation: number;
}

export interface ReportMetricsBundle {
    summary: SummaryMetric[];
    specialtyTrend: SpecialtyTrendPoint[];
    efficiencyTrend: EfficiencyPoint[];
    financialTrend: FinancialPoint[];
    highlights: HighlightRow[];
}

const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
});

const percentage = (value: number) => `${value.toFixed(1)}%`;
const compactNumber = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

const BASE_SPECIALTY_DATA: SpecialtyTrendPoint[] = [
    { label: 'Jan', geral: 420, cardiologia: 180, pediatria: 240 },
    { label: 'Fev', geral: 460, cardiologia: 190, pediatria: 220 },
    { label: 'Mar', geral: 510, cardiologia: 210, pediatria: 260 },
    { label: 'Abr', geral: 540, cardiologia: 230, pediatria: 250 },
    { label: 'Mai', geral: 590, cardiologia: 260, pediatria: 280 },
    { label: 'Jun', geral: 620, cardiologia: 275, pediatria: 300 },
];

const BASE_EFFICIENCY_DATA: EfficiencyPoint[] = [
    { label: 'Jan', ocupacao: 72, sla: 28 },
    { label: 'Fev', ocupacao: 75, sla: 26 },
    { label: 'Mar', ocupacao: 78, sla: 24 },
    { label: 'Abr', ocupacao: 81, sla: 22 },
    { label: 'Mai', ocupacao: 80, sla: 23 },
    { label: 'Jun', ocupacao: 84, sla: 20 },
];

const BASE_FINANCIAL_DATA: FinancialPoint[] = [
    { label: 'Jan', receita: 820000, glosas: 42000 },
    { label: 'Fev', receita: 860000, glosas: 39000 },
    { label: 'Mar', receita: 910000, glosas: 36000 },
    { label: 'Abr', receita: 945000, glosas: 33000 },
    { label: 'Mai', receita: 980000, glosas: 35000 },
    { label: 'Jun', receita: 1020000, glosas: 31000 },
];

const BASE_HIGHLIGHTS: HighlightRow[] = [
    { id: '1', name: 'Dra. Helena Souza', specialty: 'Cardiologia', unit: 'Unidade Paulista', volume: 134, variation: 8.4 },
    { id: '2', name: 'Dr. Marcos Lima', specialty: 'Clínica Geral', unit: 'Unidade Moema', volume: 120, variation: 5.1 },
    { id: '3', name: 'Equipe Pediatria', specialty: 'Pediatria', unit: 'Unidade Campinas', volume: 112, variation: 4.6 },
];

export const DEFAULT_REPORT_FILTERS: ReportFiltersState = {
    period: '30d',
    specialty: 'todas',
    unit: 'todas',
};

const periodSliceMap: Record<ReportPeriod, number> = {
    '7d': 2,
    '30d': 3,
    '90d': 4,
    '180d': 6,
};

export const currencyFormatter = (value: number) => currency.format(value);
export const percentageFormatter = percentage;
export const compactFormatter = (value: number) => compactNumber.format(value);

const sliceData = <T,>(data: T[], period: ReportPeriod) => {
    const size = periodSliceMap[period];
    return data.slice(Math.max(data.length - size, 0));
};

export function generateReportMetrics(filters: ReportFiltersState): ReportMetricsBundle {
    const specialtyTrend = sliceData(BASE_SPECIALTY_DATA, filters.period);
    const efficiencyTrend = sliceData(BASE_EFFICIENCY_DATA, filters.period);
    const financialTrend = sliceData(BASE_FINANCIAL_DATA, filters.period);

    const lastFinancial = financialTrend.at(-1);
    const previousFinancial = financialTrend.at(-2);

    const lastSpecialty = specialtyTrend.at(-1);

    const totalAttendances = lastSpecialty
        ? lastSpecialty.geral + lastSpecialty.cardiologia + lastSpecialty.pediatria
        : 0;

    const revenueDelta =
        lastFinancial && previousFinancial
            ? ((lastFinancial.receita - previousFinancial.receita) / previousFinancial.receita) * 100
            : 0;

    const occupancyDelta =
        efficiencyTrend.at(-1) && efficiencyTrend.at(-2)
            ? efficiencyTrend.at(-1)!.ocupacao - efficiencyTrend.at(-2)!.ocupacao
            : 0;

    const summary: SummaryMetric[] = [
        {
            id: 'assistance',
            label: 'Atendimentos no período',
            value: compactFormatter(totalAttendances),
            helper: `Período: ${format(new Date(), 'MMM yyyy')}`,
            delta: filters.specialty === 'todas' ? 5.2 : 3.1,
        },
        {
            id: 'occupancy',
            label: 'Taxa média de ocupação',
            value: percentageFormatter(efficiencyTrend.at(-1)?.ocupacao ?? 0),
            helper: 'Meta: 82%',
            delta: occupancyDelta,
        },
        {
            id: 'revenue',
            label: 'Receita assistencial',
            value: currencyFormatter(lastFinancial?.receita ?? 0),
            helper: 'Considera convênios + particular',
            delta: revenueDelta,
        },
        {
            id: 'denials',
            label: 'Índice de glosas',
            value: percentageFormatter(((lastFinancial?.glosas ?? 0) / (lastFinancial?.receita ?? 1)) * 100),
            helper: currencyFormatter(lastFinancial?.glosas ?? 0),
            delta: -3.4,
        },
    ];

    const highlights = BASE_HIGHLIGHTS.map((highlight) =>
        highlight.unit === filters.unit || filters.unit === 'todas' ? highlight : { ...highlight, variation: 2.1 },
    );

    return {
        summary,
        specialtyTrend,
        efficiencyTrend,
        financialTrend,
        highlights,
    };
}

export function normalizeSupabaseMetrics(
    supabasePayload: Partial<ReportMetricsBundle> | null | undefined,
    filters: ReportFiltersState,
): ReportMetricsBundle {
    if (!supabasePayload) {
        return generateReportMetrics(filters);
    }

    const fallback = generateReportMetrics(filters);

    return {
        summary: supabasePayload.summary ?? fallback.summary,
        specialtyTrend: supabasePayload.specialtyTrend ?? fallback.specialtyTrend,
        efficiencyTrend: supabasePayload.efficiencyTrend ?? fallback.efficiencyTrend,
        financialTrend: supabasePayload.financialTrend ?? fallback.financialTrend,
        highlights: supabasePayload.highlights ?? fallback.highlights,
    };
}



