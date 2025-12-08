'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, LogOut, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/organisms/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Separator } from '@/components/ui/separator';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading } = useSupabaseAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login?redirect=/dashboard/configuracoes');
        }
    }, [loading, router, user]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await supabase.auth.signOut();
            toast.success('Você foi desconectado.');
            router.replace('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            toast.error('Erro ao sair da conta.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60">
                <p className="text-sm text-slate-500">Carregando...</p>
            </div>
        );
    }

    const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';

    return (
        <div className="flex flex-1 flex-col gap-8">
            <PageHeader
                eyebrow="Configurações"
                icon={<Settings className="h-6 w-6" />}
                title="Configurações da Conta"
                description="Gerencie as informações da sua conta e preferências."
            />

            <div className="space-y-6 max-w-2xl">
                {/* Informações da Conta */}
                <Card>
                    <CardHeader className="flex flex-row items-start gap-4">
                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                            <User className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle>Informações da Conta</CardTitle>
                            <CardDescription>
                                Dados básicos da sua conta de acesso ao sistema.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Nome</label>
                                <Input
                                    value={userDisplayName}
                                    readOnly
                                    disabled
                                    className="mt-1 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <Input
                                    value={user.email || ''}
                                    readOnly
                                    disabled
                                    className="mt-1 bg-slate-50"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Para alterar suas informações, entre em contato com o suporte.
                        </p>
                    </CardContent>
                </Card>

                {/* Ações da Conta */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Ações da Conta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="font-medium text-slate-900">Sair da conta</p>
                                <p className="text-sm text-slate-500">
                                    Encerrar sua sessão atual no sistema.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <LogOut className="mr-2 h-4 w-4" />
                                )}
                                Sair
                            </Button>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 p-4">
                            <div>
                                <p className="font-medium text-red-900">Zona de perigo</p>
                                <p className="text-sm text-red-700">
                                    Ações irreversíveis para sua conta.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                disabled
                                title="Funcionalidade em desenvolvimento"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir conta
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
