'use client';

import { ReactNode } from 'react';
import {
    Area,
    AreaChart as RechartsAreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartSeries {
    name: string;
    dataKey: string;
    stroke: string;
    fillOpacity?: number;
    stackId?: string;
}

interface ReportAreaChartProps<T extends object> {
    title: string;
    description?: string;
    insight?: ReactNode;
    data: T[];
    series: ChartSeries[];
    yAxisFormatter?: (value: number) => string;
}

export function ReportAreaChart<T extends { label?: string }>({
    title,
    description,
    insight,
    data,
    series,
    yAxisFormatter,
}: ReportAreaChartProps<T>) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-semibold">{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    {insight}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsAreaChart data={data}>
                            <defs>
                                {series.map((serie) => (
                                    <linearGradient key={serie.dataKey} id={`gradient-${serie.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={serie.stroke} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={serie.stroke} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={yAxisFormatter}
                                width={60}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '0.75rem',
                                    borderColor: 'hsl(var(--border))',
                                }}
                                formatter={(value: number) => (yAxisFormatter ? yAxisFormatter(value) : value)}
                            />
                            {series.map((serie) => (
                                <Area
                                    key={serie.dataKey}
                                    type="monotone"
                                    dataKey={serie.dataKey}
                                    name={serie.name}
                                    stroke={serie.stroke}
                                    fillOpacity={serie.fillOpacity ?? 0.2}
                                    fill={`url(#gradient-${serie.dataKey})`}
                                    strokeWidth={2}
                                    stackId={serie.stackId}
                                />
                            ))}
                        </RechartsAreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}


