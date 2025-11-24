'use client';

import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryMetric } from '@/lib/reports';

interface ReportSummaryCardsProps {
    metrics: SummaryMetric[];
}

export function ReportSummaryCards({ metrics }: ReportSummaryCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
                const isPositive = metric.delta >= 0;
                return (
                    <Card key={metric.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{metric.helper}</span>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                                >
                                    {isPositive ? (
                                        <ArrowUpRight className="h-3 w-3" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3" />
                                    )}
                                    {metric.delta.toFixed(1)}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}



