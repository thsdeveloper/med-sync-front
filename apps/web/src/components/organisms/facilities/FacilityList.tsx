'use client';

import { useState } from 'react';
import { Edit, Trash2, Search, MoreHorizontal, Phone, Building2, Hospital } from 'lucide-react';
import { Facility, FACILITY_TYPE_LABELS } from '@medsync/shared';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface FacilityListProps {
    facilities: Facility[];
    isLoading: boolean;
    onEdit: (facility: Facility) => void;
    onDelete: (id: string) => void;
}

export function FacilityList({
    facilities,
    isLoading,
    onEdit,
    onDelete
}: FacilityListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFacilities = facilities.filter(facility =>
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        FACILITY_TYPE_LABELS[facility.type].toLowerCase().includes(searchTerm.toLowerCase())
    );

    const FacilityIcon = ({ type }: { type: 'clinic' | 'hospital' }) => {
        const Icon = type === 'hospital' ? Hospital : Building2;
        return <Icon className="h-5 w-5" />;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (facilities.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-slate-50">
                <div className="mx-auto h-12 w-12 text-slate-400 mb-3">
                    <Building2 className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Nenhuma unidade cadastrada</h3>
                <p className="mt-1 text-slate-500">Comece cadastrando suas clínicas e hospitais.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                    placeholder="Buscar por nome ou tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                        <tr>
                            <th className="px-4 py-3">Unidade</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Contato</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredFacilities.map((facility) => (
                            <tr key={facility.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-lg ${
                                            facility.type === 'hospital' 
                                                ? 'bg-rose-50 text-rose-600' 
                                                : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            <FacilityIcon type={facility.type} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{facility.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                    facility.type === 'hospital'
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {FACILITY_TYPE_LABELS[facility.type]}
                                                </span>
                                                {facility.cnpj && <span className="ml-1">• {facility.cnpj}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    {facility.phone ? (
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <Phone className="w-3 h-3" />
                                            {facility.phone}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        facility.active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {facility.active ? 'Ativa' : 'Inativa'}
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
                                            <DropdownMenuItem onClick={() => onEdit(facility)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600"
                                                onClick={() => onDelete(facility.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                        {filteredFacilities.length === 0 && searchTerm && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                    Nenhuma unidade encontrada para "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

