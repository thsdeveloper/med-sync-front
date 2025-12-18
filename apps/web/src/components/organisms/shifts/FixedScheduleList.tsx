'use client';

import { useState, useMemo } from 'react';
import { 
    Building2, 
    Hospital, 
    Edit, 
    Trash2, 
    Search, 
    MoreHorizontal,
    Calendar,
    Clock,
    User,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import {
    type FixedSchedule,
    type Facility,
    SHIFT_TYPE_LABELS,
    SHIFT_TYPE_TIMES,
    FACILITY_TYPE_LABELS,
    formatWeekdays,
    formatDuration,
} from '@medsync/shared';

interface FixedScheduleListProps {
    schedules: FixedSchedule[];
    facilities: Facility[];
    isLoading: boolean;
    onEdit: (schedule: FixedSchedule) => void;
    onDelete: (id: string) => void;
}

export function FixedScheduleList({
    schedules,
    facilities,
    isLoading,
    onEdit,
    onDelete,
}: FixedScheduleListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set());

    // Agrupar escalas por facility
    const groupedSchedules = useMemo(() => {
        const filtered = schedules.filter(schedule => {
            const staffName = schedule.medical_staff?.name?.toLowerCase() || '';
            const facilityName = schedule.facilities?.name?.toLowerCase() || '';
            const search = searchTerm.toLowerCase();
            return staffName.includes(search) || facilityName.includes(search);
        });

        const groups: Map<string, { facility: Facility; schedules: FixedSchedule[] }> = new Map();

        filtered.forEach(schedule => {
            const facilityId = schedule.facility_id;
            if (!groups.has(facilityId)) {
                const facility = facilities.find(f => f.id === facilityId);
                if (facility) {
                    groups.set(facilityId, { facility, schedules: [] });
                }
            }
            groups.get(facilityId)?.schedules.push(schedule);
        });

        return Array.from(groups.values()).sort((a, b) => 
            a.facility.name.localeCompare(b.facility.name)
        );
    }, [schedules, facilities, searchTerm]);

    const toggleFacility = (facilityId: string) => {
        const newExpanded = new Set(expandedFacilities);
        if (newExpanded.has(facilityId)) {
            newExpanded.delete(facilityId);
        } else {
            newExpanded.add(facilityId);
        }
        setExpandedFacilities(newExpanded);
    };

    const expandAll = () => {
        setExpandedFacilities(new Set(facilities.map(f => f.id)));
    };

    const collapseAll = () => {
        setExpandedFacilities(new Set());
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta escala fixa?')) return;
        
        try {
            const { error } = await supabase
                .from('fixed_schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Escala fixa excluída.');
            onDelete(id);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir.');
        }
    };

    const FacilityIcon = ({ type }: { type: 'clinic' | 'hospital' }) => {
        const Icon = type === 'hospital' ? Hospital : Building2;
        return <Icon className="h-5 w-5" />;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-5 w-48" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (schedules.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-slate-50/50">
                <div className="mx-auto h-12 w-12 text-slate-400 mb-3">
                    <Calendar className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Nenhuma escala fixa cadastrada</h3>
                <p className="mt-1 text-slate-500 max-w-sm mx-auto">
                    Crie escalas fixas para definir horários recorrentes de profissionais em clínicas e hospitais.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Barra de pesquisa e ações */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Buscar por profissional ou unidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={expandAll}>
                        Expandir
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll}>
                        Recolher
                    </Button>
                </div>
            </div>

            {/* Lista agrupada */}
            {groupedSchedules.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    Nenhum resultado encontrado para "{searchTerm}"
                </div>
            ) : (
                <div className="space-y-3">
                    {groupedSchedules.map(({ facility, schedules: facilitySchedules }) => (
                        <Collapsible
                            key={facility.id}
                            open={expandedFacilities.has(facility.id)}
                            onOpenChange={() => toggleFacility(facility.id)}
                        >
                            <div className="border rounded-lg bg-white overflow-hidden">
                                {/* Header da Facility */}
                                <CollapsibleTrigger asChild>
                                    <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left">
                                        <div className={`p-2.5 rounded-lg ${
                                            facility.type === 'hospital' 
                                                ? 'bg-rose-50 text-rose-600' 
                                                : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            <FacilityIcon type={facility.type} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{facility.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                    facility.type === 'hospital'
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {FACILITY_TYPE_LABELS[facility.type]}
                                                </span>
                                                <span>{facilitySchedules.length} escala(s)</span>
                                            </div>
                                        </div>
                                        {expandedFacilities.has(facility.id) ? (
                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-slate-400" />
                                        )}
                                    </button>
                                </CollapsibleTrigger>

                                {/* Escalas da Facility */}
                                <CollapsibleContent>
                                    <div className="border-t divide-y">
                                        {facilitySchedules.map((schedule) => (
                                            <div 
                                                key={schedule.id} 
                                                className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
                                            >
                                                {/* Avatar/Color do profissional */}
                                                <div 
                                                    className="w-2 h-10 rounded-full"
                                                    style={{ backgroundColor: schedule.medical_staff?.color || '#64748b' }}
                                                />

                                                {/* Info do profissional */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-slate-400" />
                                                        <span className="font-medium text-slate-900 truncate">
                                                            {schedule.medical_staff?.name || 'Profissional não encontrado'}
                                                        </span>
                                                        {schedule.medical_staff?.profissao?.nome && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                                {schedule.medical_staff.profissao.nome}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {SHIFT_TYPE_LABELS[schedule.shift_type]}
                                                            <span className="text-xs opacity-70">
                                                                ({SHIFT_TYPE_TIMES[schedule.shift_type].start} - {SHIFT_TYPE_TIMES[schedule.shift_type].end})
                                                            </span>
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {formatWeekdays(schedule.weekdays)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Duração */}
                                                <div className="hidden sm:block text-right">
                                                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        schedule.duration_type === 'permanent'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {formatDuration(schedule.duration_type, schedule.end_date)}
                                                    </div>
                                                    {!schedule.active && (
                                                        <div className="text-xs text-red-500 mt-1">Inativo</div>
                                                    )}
                                                </div>

                                                {/* Ações */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onEdit(schedule)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDelete(schedule.id)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    ))}
                </div>
            )}
        </div>
    );
}

