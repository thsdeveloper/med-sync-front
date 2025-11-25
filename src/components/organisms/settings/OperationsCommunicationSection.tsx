'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BellRing, MessageSquareMore, Workflow } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/atoms/Button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/atoms/Input';

type NotificationChannel = 'email' | 'sms' | 'push';

interface NotificationPreference {
    id: string;
    title: string;
    description: string;
    channels: Record<NotificationChannel, boolean>;
}

interface TemplateConfig {
    id: string;
    label: string;
    subject: string;
    body: string;
}

interface AutomationRule {
    id: string;
    title: string;
    description: string;
    active: boolean;
}

export function OperationsCommunicationSection() {
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([
        {
            id: 'appointments',
            title: 'Confirmação de consulta',
            description: 'Confirme agendamentos e permita reagendamentos com um clique.',
            channels: { email: true, sms: true, push: false },
        },
        {
            id: 'shifts',
            title: 'Plantões e trocas',
            description: 'Notifique aprovações e alertas de cobertura.',
            channels: { email: true, sms: false, push: true },
        },
        {
            id: 'inventory',
            title: 'Alertas de estoque',
            description: 'Receba alertas quando um insumo atingir limite crítico.',
            channels: { email: false, sms: true, push: true },
        },
    ]);

    const [templates, setTemplates] = useState<TemplateConfig[]>([
        {
            id: 'appointment',
            label: 'Confirmação de consulta',
            subject: 'Confirmação da sua consulta em {{data_consulta}}',
            body: 'Olá {{nome}},\n\nSua consulta está confirmada para {{data_consulta}} às {{hora_consulta}}.\nCaso precise reagendar, responda esta mensagem.',
        },
        {
            id: 'shift',
            label: 'Alerta de plantão',
            subject: 'Plantão cadastrado para {{data_platao}}',
            body: 'Olá {{nome}},\n\nVocê foi escalado para o plantão em {{unidade}} no dia {{data_platao}} às {{hora_platao}}.',
        },
    ]);

    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
        {
            id: 'shift_approval',
            title: 'Aprovar plantões automaticamente',
            description: 'Auto-aprova plantões se houver substituto confirmado.',
            active: true,
        },
        {
            id: 'stock_alert',
            title: 'Escalonar alerta de estoque',
            description: 'Envia alerta para compras quando estoque crítico não é resolvido em 6h.',
            active: false,
        },
        {
            id: 'no_show',
            title: 'Lembrete pós-no-show',
            description: 'Aciona SMS e email após ausência para incentivar reagendamento.',
            active: true,
        },
    ]);

    const toggleChannel = (preferenceId: string, channel: NotificationChannel) => {
        setNotificationPreferences((prev) =>
            prev.map((preference) =>
                preference.id === preferenceId
                    ? {
                          ...preference,
                          channels: {
                              ...preference.channels,
                              [channel]: !preference.channels[channel],
                          },
                      }
                    : preference
            )
        );
    };

    const updateTemplate = (templateId: string, field: keyof TemplateConfig, value: string) => {
        setTemplates((prev) =>
            prev.map((template) =>
                template.id === templateId
                    ? {
                          ...template,
                          [field]: value,
                      }
                    : template
            )
        );
    };

    const toggleAutomation = (ruleId: string) => {
        setAutomationRules((prev) =>
            prev.map((rule) =>
                rule.id === ruleId
                    ? {
                          ...rule,
                          active: !rule.active,
                      }
                    : rule
            )
        );
    };

    const savePreferences = () => {
        toast.success('Preferências de notificação atualizadas.');
    };

    const publishTemplates = () => {
        toast.success('Templates publicados com sucesso.');
    };

    const saveAutomations = () => {
        toast.success('Automações salvas.');
    };

    const channelLabel: Record<NotificationChannel, string> = {
        email: 'Email',
        sms: 'SMS',
        push: 'Push',
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                    <BellRing className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Operação & Comunicação</CardTitle>
                    <CardDescription>
                        Defina canais ativos, personalize mensagens e crie automações para o fluxo assistencial.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <MessageSquareMore className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-semibold">Canais por evento</p>
                            <p className="text-sm text-muted-foreground">
                                Desative canais que não fazem sentido para cada cenário.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {notificationPreferences.map((preference) => (
                            <div key={preference.id} className="rounded-2xl border p-4">
                                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="text-base font-semibold">{preference.title}</p>
                                        <p className="text-sm text-muted-foreground">{preference.description}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {(Object.keys(preference.channels) as NotificationChannel[]).map((channel) => (
                                            <label
                                                key={channel}
                                                className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 accent-blue-600"
                                                    checked={preference.channels[channel]}
                                                    onChange={() => toggleChannel(preference.id, channel)}
                                                />
                                                {channelLabel[channel]}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button type="button" onClick={savePreferences}>
                        Salvar preferências
                    </Button>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <MessageSquareMore className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-semibold">Templates inteligentes</p>
                            <p className="text-sm text-muted-foreground">
                                Utilize variáveis entre chaves para personalizar as mensagens automaticamente.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {templates.map((template) => (
                            <div key={template.id} className="rounded-2xl border p-4">
                                <p className="text-sm font-semibold">{template.label}</p>
                                <label className="mt-3 block text-xs font-medium uppercase text-muted-foreground">
                                    Assunto
                                </label>
                                <Input
                                    className="mt-1"
                                    value={template.subject}
                                    onChange={(event) => updateTemplate(template.id, 'subject', event.target.value)}
                                />
                                <label className="mt-4 block text-xs font-medium uppercase text-muted-foreground">
                                    Corpo
                                </label>
                                <Textarea
                                    rows={6}
                                    value={template.body}
                                    onChange={(event) => updateTemplate(template.id, 'body', event.target.value)}
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Variáveis disponíveis: {'{{nome}}'}, {'{{data_consulta}}'}, {'{{unidade}}'}, etc.
                                </p>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="secondary" onClick={publishTemplates}>
                        Publicar templates
                    </Button>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Workflow className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-semibold">Automações de workflow</p>
                            <p className="text-sm text-muted-foreground">Padronize aprovações e escalonamentos.</p>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {automationRules.map((rule) => (
                            <div key={rule.id} className="rounded-2xl border p-4">
                                <p className="text-sm font-semibold">{rule.title}</p>
                                <p className="text-sm text-muted-foreground">{rule.description}</p>
                                <Button
                                    type="button"
                                    variant={rule.active ? 'primary' : 'outline'}
                                    className="mt-4 w-full"
                                    onClick={() => toggleAutomation(rule.id)}
                                >
                                    {rule.active ? 'Ativa' : 'Inativa'}
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" onClick={saveAutomations}>
                        Salvar automações
                    </Button>
                </section>
            </CardContent>
            <CardFooter>
                <p className="text-sm text-muted-foreground">
                    As mensagens respeitam a LGPD. Configure o opt-out dentro de cada template para cumprir a regulação.
                </p>
            </CardFooter>
        </Card>
    );
}


