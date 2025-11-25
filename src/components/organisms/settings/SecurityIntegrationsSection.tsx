'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Fingerprint, KeyRound, Network, ScrollText } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

interface ApiToken {
    id: string;
    name: string;
    scope: string;
    lastUsed: string;
    token: string;
    active: boolean;
}

interface Webhook {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'paused';
}

interface AuditEntry {
    id: string;
    actor: string;
    action: string;
    context: string;
    createdAt: string;
}

const randomToken = () => crypto.randomUUID().replace(/-/g, '').slice(0, 24);

export function SecurityIntegrationsSection() {
    const [mfaEnabled, setMfaEnabled] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [passwordRotation, setPasswordRotation] = useState(90);
    const [apiTokens, setApiTokens] = useState<ApiToken[]>([
        {
            id: 'api-1',
            name: 'Integração ERP',
            scope: 'leitura escopos financeiros',
            lastUsed: 'há 2h',
            token: 'erp_9fd81b10a2c14583a8106451',
            active: true,
        },
        {
            id: 'api-2',
            name: 'Prontuário externo',
            scope: 'sincronização de pacientes',
            lastUsed: 'há 3 dias',
            token: 'ehr_7c81d213ecf546dea010743a',
            active: true,
        },
    ]);

    const [webhooks, setWebhooks] = useState<Webhook[]>([
        {
            id: 'wh-1',
            url: 'https://exemplo.com/webhooks/escalas',
            events: ['shift.created', 'shift.approved'],
            status: 'active',
        },
        {
            id: 'wh-2',
            url: 'https://exemplo.com/webhooks/faturamento',
            events: ['invoice.generated'],
            status: 'paused',
        },
    ]);

    const [auditLog] = useState<AuditEntry[]>([
        {
            id: 'log-1',
            actor: 'maria.goncalves',
            action: 'Atualizou política de senha',
            context: 'Expiração em 60 dias',
            createdAt: '24/11/2025 09:12',
        },
        {
            id: 'log-2',
            actor: 'juliana.freitas',
            action: 'Gerou token API',
            context: 'Prontuário externo',
            createdAt: '23/11/2025 16:40',
        },
        {
            id: 'log-3',
            actor: 'caio.ramos',
            action: 'Desativou webhook',
            context: 'invoice.generated',
            createdAt: '22/11/2025 21:05',
        },
    ]);

    const saveSecuritySettings = () => {
        toast.success('Políticas de segurança atualizadas.');
    };

    const generateToken = () => {
        const token = randomToken();
        setApiTokens((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: `Novo token ${prev.length + 1}`,
                scope: 'personalizado',
                lastUsed: 'agora',
                token,
                active: true,
            },
        ]);
        toast.success('Novo token gerado.');
    };

    const toggleToken = (tokenId: string) => {
        setApiTokens((prev) =>
            prev.map((token) =>
                token.id === tokenId
                    ? {
                          ...token,
                          active: !token.active,
                      }
                    : token
            )
        );
    };

    const copyToken = async (token: string) => {
        try {
            await navigator.clipboard.writeText(token);
            toast.success('Token copiado.');
        } catch (error) {
            console.error(error);
            toast.error('Não foi possível copiar o token.');
        }
    };

    const toggleWebhookStatus = (webhookId: string) => {
        setWebhooks((prev) =>
            prev.map((webhook) =>
                webhook.id === webhookId
                    ? {
                          ...webhook,
                          status: webhook.status === 'active' ? 'paused' : 'active',
                      }
                    : webhook
            )
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                    <Fingerprint className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Segurança, integrações & auditoria</CardTitle>
                    <CardDescription>
                        Garanta conformidade com a LGPD controlando MFA, tokens, webhooks e trilhas de auditoria.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <section className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold">MFA obrigatório</p>
                            <p className="text-sm text-muted-foreground">
                                Profissionais devem cadastrar um segundo fator no primeiro login.
                            </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                className="h-5 w-5 accent-blue-600"
                                checked={mfaEnabled}
                                onChange={() => setMfaEnabled((previous) => !previous)}
                            />
                            {mfaEnabled ? 'Ativo' : 'Inativo'}
                        </label>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Tempo de sessão (min)</label>
                            <Input
                                type="number"
                                min={5}
                                max={240}
                                value={sessionTimeout}
                                onChange={(event) => setSessionTimeout(Number(event.target.value))}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Rotação de senha (dias)
                            </label>
                            <Input
                                type="number"
                                min={30}
                                max={365}
                                value={passwordRotation}
                                onChange={(event) => setPasswordRotation(Number(event.target.value))}
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <Button type="button" className="mt-6" onClick={saveSecuritySettings}>
                        Salvar políticas
                    </Button>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <KeyRound className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-semibold">Tokens de API</p>
                            <p className="text-sm text-muted-foreground">Controle o acesso externo e audite usos.</p>
                        </div>
                    </div>
                    <div className="space-y-3 rounded-2xl border p-4">
                        {apiTokens.map((token) => (
                            <div
                                key={token.id}
                                className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div>
                                    <p className="text-sm font-semibold">{token.name}</p>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{token.scope}</p>
                                    <p className="text-xs text-muted-foreground">Último uso {token.lastUsed}</p>
                                </div>
                                <div className="flex flex-col gap-2 md:items-end">
                                    <code className="rounded bg-slate-100 px-2 py-1 text-xs">
                                        {token.token.replace(/.(?=.{4})/g, '•')}
                                    </code>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToken(token.token)}
                                        >
                                            Copiar
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={token.active ? 'destructive' : 'outline'}
                                            onClick={() => toggleToken(token.id)}
                                        >
                                            {token.active ? 'Revogar' : 'Reativar'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="secondary" onClick={generateToken}>
                            Gerar novo token
                        </Button>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Network className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-semibold">Webhooks & integrações</p>
                            <p className="text-sm text-muted-foreground">
                                Controle disparos para ERPs, prontuários e agendas externas.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {webhooks.map((webhook) => (
                            <div key={webhook.id} className="rounded-2xl border p-4">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Endpoint</p>
                                <p className="break-all font-mono text-sm">{webhook.url}</p>
                                <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Eventos</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {webhook.events.map((event) => (
                                        <span
                                            key={event}
                                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium"
                                        >
                                            {event}
                                        </span>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant={webhook.status === 'active' ? 'default' : 'outline'}
                                    className="mt-4 w-full"
                                    onClick={() => toggleWebhookStatus(webhook.id)}
                                >
                                    {webhook.status === 'active' ? 'Ativo' : 'Pausado'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <ScrollText className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-semibold">Trilha de auditoria</p>
                            <p className="text-sm text-muted-foreground">
                                Exportável em CSV e disponível por 24 meses para a LGPD.
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Usuário</th>
                                    <th className="px-4 py-3">Ação</th>
                                    <th className="px-4 py-3">Contexto</th>
                                    <th className="px-4 py-3">Data</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {auditLog.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-4 py-3 font-medium">{entry.actor}</td>
                                        <td className="px-4 py-3">{entry.action}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{entry.context}</td>
                                        <td className="px-4 py-3">{entry.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Button type="button" variant="outline">
                        Exportar CSV
                    </Button>
                </section>
            </CardContent>
            <CardFooter>
                <p className="text-sm text-muted-foreground">
                    Recomendado ativar MFA e revisar acessos trimestralmente para auditorias e certificações.
                </p>
            </CardFooter>
        </Card>
    );
}


