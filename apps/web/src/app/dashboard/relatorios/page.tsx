'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Mail, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/atoms/Button';
import { PageHeader } from '@/components/organisms/page';
import { ReportFilters } from '@/components/organisms/reports/ReportFilters';
import { ReportSummaryCards } from '@/components/organisms/reports/ReportSummaryCards';
import { ReportAreaChart } from '@/components/organisms/reports/ReportAreaChart';
import { ReportHighlights } from '@/components/organisms/reports/ReportHighlights';
import { ReportEmailSheet } from '@/components/organisms/reports/ReportEmailSheet';
import { useReportExport } from '@/hooks/useReportExport';
import { useOrganization } from '@/providers/OrganizationProvider';
import {
    DEFAULT_REPORT_FILTERS,
    ReportFiltersState,
    ReportMetricsBundle,
    currencyFormatter,
    generateReportMetrics,
    normalizeSupabaseMetrics,
} from '@/lib/reports';
import { supabase } from '@/lib/supabase';

const periodLabels: Record<ReportFiltersState['period'], string> = {
    '7d': 'últimos 7 dias',
    '30d': 'últimos 30 dias',
    '90d': 'últimos 90 dias',
    '180d': 'últimos 6 meses',
};

export default function ReportsPage() {
    const { activeOrganization } = useOrganization();
    const [filters, setFilters] = useState<ReportFiltersState>(DEFAULT_REPORT_FILTERS);
    const [metrics, setMetrics] = useState<ReportMetricsBundle>(() => generateReportMetrics(DEFAULT_REPORT_FILTERS));
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSheetOpen, setIsEmailSheetOpen] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const hasShownFallbackToastRef = useRef(false);

    const reportRef = useRef<HTMLDivElement>(null);

    const { exportToPDF, generatePdfBase64, isExporting } = useReportExport({
        filename: `relatorio-medsync-${filters.period}`,
    });

    const handleFiltersChange = (partial: Partial<ReportFiltersState>) => {
        setFilters((prev) => ({ ...prev, ...partial }));
    };

    const loadMetrics = useCallback(async () => {
        if (!activeOrganization?.id) {
            console.warn('No active organization selected');
            setMetrics(generateReportMetrics(filters));
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('reports_dashboard_metrics', {
                p_period: filters.period,
                p_specialty: filters.specialty,
                p_unit: filters.unit,
                p_organization_id: activeOrganization.id,
            });

            if (error) {
                throw error;
            }

            setMetrics(normalizeSupabaseMetrics(data as Partial<ReportMetricsBundle>, filters));
        } catch (error) {
            console.warn('Fallback metrics in use', error);
            setMetrics(generateReportMetrics(filters));
            if (!hasShownFallbackToastRef.current) {
                toast.info('Exibindo dados simulados enquanto conectamos ao Supabase.');
                hasShownFallbackToastRef.current = true;
            }
        } finally {
            setIsLoading(false);
        }
    }, [filters, activeOrganization?.id]);

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);

    const handleExport = () => exportToPDF(reportRef.current);

    const handleSendEmail = useCallback(
        async ({ to, subject, message }: { to: string; subject: string; message: string }) => {
            if (!reportRef.current) {
                toast.error('Não encontramos o conteúdo do relatório.');
                return;
            }

            setIsSendingEmail(true);
            try {
                const pdfBase64 = await generatePdfBase64(reportRef.current);
                if (!pdfBase64) {
                    throw new Error('Falha ao gerar PDF');
                }

                const response = await fetch('/api/reports/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to,
                        subject,
                        message,
                        pdfBase64,
                        periodLabel: periodLabels[filters.period],
                    }),
                });

                if (!response.ok) {
                    throw new Error('Erro ao enviar e-mail');
                }

                toast.success('Relatório enviado com sucesso.');
                setIsEmailSheetOpen(false);
            } catch (error) {
                console.error(error);
                toast.error('Não foi possível enviar o relatório.');
            } finally {
                setIsSendingEmail(false);
            }
        },
        [filters.period, generatePdfBase64],
    );

    const clinicalSeries = useMemo(
        () => [
            { name: 'Clínica geral', dataKey: 'geral', stroke: '#2563eb', stackId: 'specialty' },
            { name: 'Cardiologia', dataKey: 'cardiologia', stroke: '#0ea5e9', stackId: 'specialty' },
            { name: 'Pediatria', dataKey: 'pediatria', stroke: '#22c55e', stackId: 'specialty' },
        ],
        [],
    );

    const financialSeries = useMemo(
        () => [
            { name: 'Receita', dataKey: 'receita', stroke: '#22c55e' },
            { name: 'Glosas', dataKey: 'glosas', stroke: '#f97316' },
        ],
        [],
    );

    const efficiencySeries = useMemo(
        () => [
            { name: 'Ocupação', dataKey: 'ocupacao', stroke: '#6366f1' },
            { name: 'SLA (min)', dataKey: 'sla', stroke: '#fb7185' },
        ],
        [],
    );

    return (
        <>
            <div className="flex flex-1 flex-col gap-6" ref={reportRef}>
                <PageHeader
                    className="rounded-3xl border border-dashed bg-gradient-to-r from-slate-50 to-white"
                    eyebrow="Painel assistencial"
                    icon={<FileText className="h-6 w-6" />}
                    title="Relatórios unificados"
                    description="Combine métricas assistenciais e financeiras para tomar decisões em tempo real."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={loadMetrics} disabled={isLoading}>
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Atualizar dados
                            </Button>
                            <Button onClick={handleExport} disabled={isExporting}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar PDF
                            </Button>
                            <Button variant="outline" onClick={() => setIsEmailSheetOpen(true)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar por e-mail
                            </Button>
                        </div>
                    }
                />

                <ReportFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onRefresh={loadMetrics}
                    isRefreshing={isLoading}
                    organizationId={activeOrganization?.id}
                />

                <section aria-busy={isLoading ? 'true' : 'false'}>
                    <ReportSummaryCards metrics={metrics.summary} />
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <ReportAreaChart
                            title="Atendimentos por especialidade"
                            description={`Comparativo das linhas de cuidado (${periodLabels[filters.period]}).`}
                            data={metrics.specialtyTrend}
                            series={clinicalSeries}
                        />
                        <ReportAreaChart
                            title="Receita x Glosas"
                            description="Fluxo financeiro assistencial consolidado."
                            data={metrics.financialTrend}
                            series={financialSeries}
                            yAxisFormatter={(value) => currencyFormatter(value)}
                            insight={
                                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                    Receita média {currencyFormatter(metrics.financialTrend.at(-1)?.receita ?? 0)}
                                </div>
                            }
                        />
                    </div>
                    <div className="space-y-4">
                        <ReportAreaChart
                            title="Eficiência operacional"
                            description="Taxa de ocupação e tempo médio de espera."
                            data={metrics.efficiencyTrend}
                            series={efficiencySeries}
                            yAxisFormatter={(value) =>
                                value >= 60 ? `${value.toFixed(0)}%` : `${value.toFixed(0)} min`
                            }
                        />
                        <ReportHighlights highlights={metrics.highlights} />
                    </div>
                </section>
            </div>

            <ReportEmailSheet
                open={isEmailSheetOpen}
                onOpenChange={setIsEmailSheetOpen}
                onSubmit={handleSendEmail}
                isSubmitting={isSendingEmail}
            />
        </>
    );
}

