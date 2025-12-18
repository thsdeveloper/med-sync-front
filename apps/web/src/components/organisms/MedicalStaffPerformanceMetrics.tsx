'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Calendar,
  Clock,
  Building2,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Time range options for filtering performance data
 */
export type TimeRange = 30 | 90 | 365;

/**
 * Shift data structure for performance metrics
 */
export interface ShiftData {
  id: string;
  date: string | Date;
  facility: string;
  hours: number;
  status: 'completed' | 'scheduled' | 'cancelled' | 'in_progress';
}

/**
 * Aggregated performance metrics
 */
export interface PerformanceMetrics {
  totalShifts: number;
  totalHours: number;
  facilitiesWorked: number;
  attendanceRate: number;
}

/**
 * Chart data point for visualization
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  hours?: number;
}

/**
 * Props for MedicalStaffPerformanceMetrics component
 */
export interface MedicalStaffPerformanceMetricsProps {
  /** Array of shift data for the medical staff member */
  shifts: ShiftData[];
  /** Loading state for data fetching */
  loading?: boolean;
  /** Default time range in days */
  defaultTimeRange?: TimeRange;
  /** Additional CSS classes */
  className?: string;
  /** Optional title for the metrics section */
  title?: string;
}

/**
 * MedicalStaffPerformanceMetrics Component
 *
 * Displays performance statistics and charts for medical staff members.
 * Shows total shifts, hours worked, facilities worked, and attendance rate.
 * Includes interactive charts with time range filtering (30/90/365 days).
 *
 * @example
 * ```tsx
 * const shifts = [
 *   { id: '1', date: '2024-01-15', facility: 'Hospital A', hours: 8, status: 'completed' },
 *   { id: '2', date: '2024-01-20', facility: 'Clinic B', hours: 6, status: 'completed' },
 * ];
 *
 * <MedicalStaffPerformanceMetrics
 *   shifts={shifts}
 *   defaultTimeRange={30}
 * />
 * ```
 *
 * @example With loading state
 * ```tsx
 * <MedicalStaffPerformanceMetrics
 *   shifts={[]}
 *   loading={true}
 * />
 * ```
 */
export const MedicalStaffPerformanceMetrics = React.memo<MedicalStaffPerformanceMetricsProps>(
  ({ shifts, loading = false, defaultTimeRange = 30, className, title = 'Métricas de Desempenho' }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

    /**
     * Filter shifts based on selected time range
     */
    const filteredShifts = useMemo(() => {
      const now = new Date();
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      return shifts.filter((shift) => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= cutoffDate && shiftDate <= now;
      });
    }, [shifts, timeRange]);

    /**
     * Calculate performance metrics from filtered shifts
     */
    const metrics = useMemo<PerformanceMetrics>(() => {
      const totalShifts = filteredShifts.length;
      const totalHours = filteredShifts.reduce((sum, shift) => sum + shift.hours, 0);

      // Get unique facilities
      const uniqueFacilities = new Set(filteredShifts.map((shift) => shift.facility));
      const facilitiesWorked = uniqueFacilities.size;

      // Calculate attendance rate (completed / scheduled or completed)
      const scheduledOrCompleted = filteredShifts.filter(
        (shift) => shift.status === 'scheduled' || shift.status === 'completed'
      );
      const completed = filteredShifts.filter((shift) => shift.status === 'completed');
      const attendanceRate = scheduledOrCompleted.length > 0
        ? Math.round((completed.length / scheduledOrCompleted.length) * 100)
        : 0;

      return {
        totalShifts,
        totalHours,
        facilitiesWorked,
        attendanceRate,
      };
    }, [filteredShifts]);

    /**
     * Generate chart data for shifts per month
     */
    const shiftsChartData = useMemo<ChartDataPoint[]>(() => {
      const monthsMap = new Map<string, { shifts: number; hours: number }>();

      filteredShifts.forEach((shift) => {
        const date = new Date(shift.date);
        const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
          .format(date);

        const existing = monthsMap.get(monthYear) || { shifts: 0, hours: 0 };
        monthsMap.set(monthYear, {
          shifts: existing.shifts + 1,
          hours: existing.hours + shift.hours,
        });
      });

      // Convert map to array and sort by date
      return Array.from(monthsMap.entries())
        .map(([name, data]) => ({
          name,
          value: data.shifts,
          hours: data.hours,
        }))
        .sort((a, b) => {
          // Parse month names back to dates for proper sorting
          const dateA = new Date(a.name);
          const dateB = new Date(b.name);
          return dateA.getTime() - dateB.getTime();
        });
    }, [filteredShifts]);

    /**
     * Generate chart data for hours trend
     */
    const hoursChartData = useMemo<ChartDataPoint[]>(() => {
      return shiftsChartData.map((point) => ({
        name: point.name,
        value: point.hours || 0,
      }));
    }, [shiftsChartData]);

    if (loading) {
      return (
        <div className={cn('space-y-6', className)} data-testid="performance-metrics">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Metric Cards Skeleton */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className={cn('space-y-6', className)} data-testid="performance-metrics">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">
            Visualize estatísticas e tendências de desempenho profissional
          </p>
        </div>

        {/* Time Range Selector */}
        <Tabs
          value={timeRange.toString()}
          onValueChange={(value) => setTimeRange(Number(value) as TimeRange)}
          data-testid="time-range-selector"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="30">30 dias</TabsTrigger>
            <TabsTrigger value="90">90 dias</TabsTrigger>
            <TabsTrigger value="365">365 dias</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Metric Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Plantões</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalShifts}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalShifts === 1 ? 'plantão realizado' : 'plantões realizados'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalHours}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalHours === 1 ? 'hora trabalhada' : 'horas trabalhadas'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clínicas Atendidas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.facilitiesWorked}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.facilitiesWorked === 1 ? 'clínica única' : 'clínicas diferentes'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                dos plantões agendados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {filteredShifts.length > 0 ? (
          <Card data-testid="performance-chart">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Visualização de Dados</CardTitle>
                <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'bar' | 'line')}>
                  <TabsList>
                    <TabsTrigger value="bar" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Barras</span>
                    </TabsTrigger>
                    <TabsTrigger value="line" className="flex items-center gap-2">
                      <LineChartIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Linha</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="shifts" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="shifts">Plantões por Mês</TabsTrigger>
                  <TabsTrigger value="hours">Horas por Mês</TabsTrigger>
                </TabsList>

                <TabsContent value="shifts" className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    {chartType === 'bar' ? (
                      <BarChart data={shiftsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Plantões" fill="hsl(var(--primary))" />
                      </BarChart>
                    ) : (
                      <LineChart data={shiftsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="Plantões"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="hours" className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    {chartType === 'bar' ? (
                      <BarChart data={hoursChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Horas" fill="hsl(var(--primary))" />
                      </BarChart>
                    ) : (
                      <LineChart data={hoursChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="Horas"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="performance-chart">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum Dado Disponível</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Não há dados de plantões para o período selecionado. Tente selecionar um intervalo de tempo diferente.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

MedicalStaffPerformanceMetrics.displayName = 'MedicalStaffPerformanceMetrics';
