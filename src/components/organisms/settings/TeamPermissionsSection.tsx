'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Shield, Users2 } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Button } from '@/components/ui/button';

type PermissionLevel = 'none' | 'read' | 'write';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: Record<string, PermissionLevel>;
}

const ROLE_OPTIONS = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Coordenação', value: 'coord' },
    { label: 'Profissional de saúde', value: 'clinico' },
];

const MODULES = [
    { id: 'equipe', label: 'Equipe', description: 'Gerenciar corpo clínico, convites e desligamentos.' },
    { id: 'escalas', label: 'Escalas', description: 'Criar plantões, aprovar trocas e coberturas.' },
    { id: 'financeiro', label: 'Faturamento', description: 'Exportar planilhas e enviar pagamentos.' },
];

export function TeamPermissionsSection() {
    const [members, setMembers] = useState<TeamMember[]>([
        {
            id: '1',
            name: 'Maria Gonçalves',
            email: 'maria@medsync.com',
            role: 'admin',
            permissions: {
                equipe: 'write',
                escalas: 'write',
                financeiro: 'read',
            },
        },
        {
            id: '2',
            name: 'Dr. Caio Ramos',
            email: 'caio@medsync.com',
            role: 'clinico',
            permissions: {
                equipe: 'read',
                escalas: 'write',
                financeiro: 'none',
            },
        },
        {
            id: '3',
            name: 'Juliana Freitas',
            email: 'juliana@medsync.com',
            role: 'coord',
            permissions: {
                equipe: 'write',
                escalas: 'write',
                financeiro: 'write',
            },
        },
    ]);

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('coord');

    const pendingApprovals = useMemo(
        () => members.filter((member) => member.permissions.escalas === 'write').length,
        [members]
    );

    const handleInvite = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!inviteEmail) {
            toast.error('Informe um email para convidar.');
            return;
        }

        setMembers((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: inviteEmail.split('@')[0],
                email: inviteEmail,
                role: inviteRole,
                permissions: MODULES.reduce(
                    (acc, module) => ({ ...acc, [module.id]: inviteRole === 'clinico' ? 'read' : 'write' }),
                    {} as Record<string, PermissionLevel>
                ),
            },
        ]);

        toast.success('Convite enviado.');
        setInviteEmail('');
    };

    const updateRole = (memberId: string, role: string) => {
        setMembers((prev) =>
            prev.map((member) =>
                member.id === memberId
                    ? {
                          ...member,
                          role,
                      }
                    : member
            )
        );
    };

    const updatePermission = (memberId: string, moduleId: string, level: PermissionLevel) => {
        setMembers((prev) =>
            prev.map((member) =>
                member.id === memberId
                    ? {
                          ...member,
                          permissions: {
                              ...member.permissions,
                              [moduleId]: level,
                          },
                      }
                    : member
            )
        );
    };

    const permissionButtonVariant = (active: boolean) => (active ? 'default' : 'outline');

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <Users2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Equipe & Permissões</CardTitle>
                    <CardDescription>
                        Controle convites, papéis e níveis de acesso a cada módulo do sistema.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <form onSubmit={handleInvite} className="grid gap-4 rounded-xl border p-4 md:grid-cols-[2fr_1fr_auto]">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Email para convite</label>
                        <Input
                            type="email"
                            value={inviteEmail}
                            onChange={(event) => setInviteEmail(event.target.value)}
                            placeholder="profissional@empresa.com"
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Papel</label>
                        <Select
                            value={inviteRole}
                            onValueChange={setInviteRole}
                            options={ROLE_OPTIONS}
                            placeholder="Selecione o papel"
                            triggerClassName="mt-2"
                        />
                    </div>
                    <Button type="submit" className="self-end">
                        Enviar convite
                    </Button>
                </form>

                <div className="rounded-xl border bg-slate-50/60 p-4 text-sm text-muted-foreground">
                    <p>
                        {pendingApprovals} membros podem aprovar plantões. Ajuste permissões para obedecer à governança
                        da instituição.
                    </p>
                </div>

                <div className="space-y-6">
                    {members.map((member) => (
                        <div key={member.id} className="rounded-2xl border p-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-base font-semibold">{member.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <Select
                                        value={member.role}
                                        onValueChange={(value) => updateRole(member.id, value)}
                                        options={ROLE_OPTIONS}
                                        triggerClassName="w-48"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                {MODULES.map((module) => (
                                    <div key={module.id} className="rounded-xl border p-3">
                                        <p className="text-sm font-semibold">{module.label}</p>
                                        <p className="text-xs text-muted-foreground">{module.description}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant={permissionButtonVariant(member.permissions[module.id] === 'none')}
                                                className="text-xs"
                                                onClick={() => updatePermission(member.id, module.id, 'none')}
                                            >
                                                Sem acesso
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={permissionButtonVariant(member.permissions[module.id] === 'read')}
                                                className="text-xs"
                                                onClick={() => updatePermission(member.id, module.id, 'read')}
                                            >
                                                Leitura
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={permissionButtonVariant(member.permissions[module.id] === 'write')}
                                                className="text-xs"
                                                onClick={() => updatePermission(member.id, module.id, 'write')}
                                            >
                                                Escrita
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <p className="text-sm text-muted-foreground">
                    Todas as alterações ficam registradas na trilha de auditoria por 24 meses.
                </p>
            </CardFooter>
        </Card>
    );
}


