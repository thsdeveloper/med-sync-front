'use client';

import { useState } from 'react';
import { Edit, Unlink, Search, MoreHorizontal, Mail, Phone, Building2 } from 'lucide-react';
import { MedicalStaffWithOrganization } from '@medsync/shared';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface MedicalStaffListProps {
    staff: MedicalStaffWithOrganization[];
    isLoading: boolean;
    onEdit: (staff: MedicalStaffWithOrganization) => void;
    onUnlink: (staffId: string, staffOrgId: string, organizationCount: number) => void;
}

export function MedicalStaffList({
    staff,
    isLoading,
    onEdit,
    onUnlink
}: MedicalStaffListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStaff = staff.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.profissao?.nome && member.profissao.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.especialidade?.nome && member.especialidade.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.crm && member.crm.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Obter status ativo do vínculo (staff_organization) ou do cadastro global
    const isActiveInOrg = (member: MedicalStaffWithOrganization) => {
        return member.staff_organization?.active ?? member.active;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (staff.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-slate-50">
                <div className="mx-auto h-12 w-12 text-slate-400 mb-3">
                    <Search className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Nenhum profissional vinculado</h3>
                <p className="mt-1 text-slate-500">Cadastre ou vincule profissionais à sua organização.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar por nome, profissão, especialidade ou CRM..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Profissional</th>
                                <th className="px-4 py-3 hidden md:table-cell">Contato</th>
                                <th className="px-4 py-3 hidden sm:table-cell">Especialidade</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredStaff.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar>
                                                    <AvatarFallback style={{ backgroundColor: member.color + '20', color: member.color }}>
                                                        {getInitials(member.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {/* Indicador de multi-organização */}
                                                {(member.organization_count ?? 1) > 1 && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full border-2 border-white">
                                                                <Building2 className="w-3 h-3 text-white" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Vinculado a {member.organization_count} organizações</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 flex items-center gap-2">
                                                    {member.name}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: member.color }}></span>
                                                    {member.profissao?.nome || 'Profissional'}
                                                    {member.crm && ` • ${member.crm}`}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div className="flex flex-col gap-1 text-slate-600">
                                            {member.email && (
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="w-3 h-3" />
                                                    {member.email}
                                                </div>
                                            )}
                                            {member.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3" />
                                                    {member.phone}
                                                </div>
                                            )}
                                            {!member.email && !member.phone && <span className="text-slate-400">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                                        {member.especialidade?.nome || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            isActiveInOrg(member)
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {isActiveInOrg(member) ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(member)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => {
                                                        if (member.staff_organization) {
                                                            onUnlink(
                                                                member.id,
                                                                member.staff_organization.id,
                                                                member.organization_count ?? 1
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Unlink className="mr-2 h-4 w-4" />
                                                    {(member.organization_count ?? 1) > 1 ? 'Desvincular' : 'Remover'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {filteredStaff.length === 0 && searchTerm && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        Nenhum profissional encontrado para "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TooltipProvider>
    );
}
