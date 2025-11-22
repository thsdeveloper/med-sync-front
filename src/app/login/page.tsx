'use client';

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { LoginCard } from "@/components/organisms/auth/LoginCard";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";

const LoginPageContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = useMemo(
        () => searchParams?.get("redirect") ?? "/",
        [searchParams]
    );
    const { user, loading } = useSupabaseAuth();

    useEffect(() => {
        if (!loading && user) {
            router.replace(redirectTo);
        }
    }, [loading, redirectTo, router, user]);

    if (!loading && user) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6">
                <p className="text-sm text-slate-600">
                    Redirecionando para sua área...
                </p>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-slate-50">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-white to-cyan-100 opacity-80" />
            <div className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-12">
                <div className="text-center space-y-2 max-w-2xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-blue-600">
                        Portal das Empresas
                    </p>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Faça login para continuar
                    </h1>
                    <p className="text-base text-slate-600">
                        Centralize a gestão de escalas, plantões e comunicação com sua
                        equipe médica. Entre com as credenciais fornecidas pela MedSync.
                    </p>
                </div>

                <LoginCard redirectTo={redirectTo} />

                <p className="text-sm text-slate-600">
                    Ainda não tem acesso?{" "}
                    <Link
                        href="/empresas/cadastro"
                        className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Solicite um cadastro para sua empresa.
                    </Link>
                </p>
            </div>
        </main>
    );
};

const LoginPageFallback = () => (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <p className="text-sm text-slate-600">Carregando o portal de login...</p>
    </main>
);

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginPageFallback />}>
            <LoginPageContent />
        </Suspense>
    );
}

