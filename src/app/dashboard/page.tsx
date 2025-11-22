'use client';

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    BellRing,
    BookOpen,
    CalendarCheck2 as CalendarCheck,
    MessageSquare,
    Stethoscope,
    Wand2,
} from "lucide-react";

import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stats = [
    {
        label: "Plantões confirmados",
        value: "18",
        subLabel: "+3 nesta semana",
        trend: "up",
    },
    {
        label: "Trocas pendentes",
        value: "4",
        subLabel: "2 aguardando aprovação",
        trend: "neutral",
    },
    {
        label: "Horas abertas",
        value: "12h",
        subLabel: "Distribua até sexta",
        trend: "alert",
    },
];

const upcomingShifts = [
    {
        title: "Plantão UTI Geral",
        date: "Hoje, 19:00 - 07:00",
        status: "Confirmado",
        location: "Hospital Santa Clara • Bloco C",
    },
    {
        title: "Pronto Atendimento",
        date: "25 Nov, 07:00 - 19:00",
        status: "Troca Solicitada",
        location: "CardioLife • Unidade Centro",
    },
];

const aiInsights = [
    {
        title: "HandOver inteligente",
        description:
            "Resuma o plantão em segundos com o auxílio da IA e compartilhe com o time.",
        icon: Wand2,
        cta: "Gerar relatório",
    },
    {
        title: "Monitor de riscos",
        description:
            "IA detectou 2 escalas com risco de furo nas próximas 48h.",
        icon: BellRing,
        cta: "Verificar escalas",
    },
];

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading } = useSupabaseAuth();

    const displayName = useMemo(() => {
        if (!user) return "Profissional";
        return (
            (user.user_metadata?.full_name as string | undefined) ||
            user.email?.split("@")[0] ||
            "Profissional"
        );
    }, [user]);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login?redirect=/dashboard");
        }
    }, [loading, router, user]);

    if (loading || !user) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <p className="text-sm text-slate-500">Carregando dados...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                {stats.map((item) => (
                    <Card key={item.label} className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">
                                {item.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-slate-900">
                                {item.value}
                            </p>
                            <p
                                className={`mt-2 text-sm ${item.trend === "alert"
                                    ? "text-amber-600"
                                    : item.trend === "up"
                                        ? "text-emerald-600"
                                        : "text-slate-500"
                                    }`}
                            >
                                {item.subLabel}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Próximos plantões</CardTitle>
                            <p className="text-sm text-slate-500">
                                Ajuste trocas e confira detalhes da equipe.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                            <CalendarCheck className="size-4" />
                            Ver agenda
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {upcomingShifts.map((shift) => (
                            <div
                                key={shift.title}
                                className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition hover:bg-slate-50"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">{shift.title}</p>
                                        <p className="text-xs text-slate-500">{shift.location}</p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${shift.status === "Confirmado"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                            }`}
                                    >
                                        {shift.status}
                                    </span>
                                </div>
                                <p className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                                    <Stethoscope className="size-3.5 text-blue-500" />
                                    {shift.date}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-white text-base">
                                <BookOpen className="size-4" />
                                Smart Handover
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-white/90">
                                Gere relatórios SBAR com um clique usando IA.
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-white/90 text-blue-700 hover:bg-white"
                            >
                                Iniciar passagem
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {aiInsights.map((insight) => (
                                <div
                                    key={insight.title}
                                    className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
                                >
                                    <div className="mt-0.5 rounded-full bg-blue-50 p-1.5 text-blue-600">
                                        <insight.icon className="size-3.5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">
                                            {insight.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mb-2">
                                            {insight.description}
                                        </p>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-blue-600"
                                        >
                                            {insight.cta}
                                            <ArrowRight className="ml-1 size-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
