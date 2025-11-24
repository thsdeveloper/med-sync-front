'use client';

import { TrendingUp } from 'lucide-react';
import { HighlightRow } from '@/lib/reports';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface ReportHighlightsProps {
    highlights: HighlightRow[];
}

export function ReportHighlights({ highlights }: ReportHighlightsProps) {
    return (
        <Card className="col-span-1">
            <CardHeader className="flex items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-base font-semibold">Destaques do período</CardTitle>
                    <CardDescription>Profissionais e unidades com melhor desempenho.</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-4">
                {highlights.map((highlight) => (
                    <div key={highlight.id} className="rounded-2xl border p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold">{highlight.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {highlight.specialty} • {highlight.unit}
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                +{highlight.variation.toFixed(1)}%
                            </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                            <span>Volume atendido</span>
                            <span className="font-semibold text-foreground">{highlight.volume} casos</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}


