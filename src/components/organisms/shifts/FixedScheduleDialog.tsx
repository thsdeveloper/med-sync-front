'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { generateShiftsFromFixedSchedule, deleteFutureShiftsFromFixedSchedule } from '@/lib/shift-generation';
import { MedicalStaffSheet } from '@/components/organisms/medical-staff/MedicalStaffSheet';

import { BaseSheet } from '@/components/molecules/BaseSheet';
import { WeekdaySelector } from '@/components/molecules/WeekdaySelector';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
    fixedScheduleSchema,
    FixedScheduleFormData,
    FixedSchedule,
    FixedScheduleConflict,
    SHIFT_TYPES,
    SHIFT_TYPE_LABELS,
    SHIFT_TYPE_TIMES,
    DURATION_TYPES,
    DURATION_TYPE_LABELS,
    formatWeekdays,
} from '@/schemas/fixed-schedule.schema';
import { Facility } from '@/schemas/facility.schema';
import { MedicalStaff } from '@/schemas/medical-staff.schema';
import { Sector } from '@/schemas/shifts.schema';

interface FixedScheduleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    organizationId: string;
    facilities: Facility[];
    staff: MedicalStaff[];
    sectors: Sector[];
    scheduleToEdit?: FixedSchedule | null;
    onStaffRefresh?: () => void;
}

export function FixedScheduleDialog({
    isOpen,
    onClose,
    onSuccess,
    organizationId,
    facilities,
    staff,
    sectors,
    scheduleToEdit,
    onStaffRefresh,
}: FixedScheduleDialogProps) {
    const isEditing = !!scheduleToEdit;
    const [conflicts, setConflicts] = useState<FixedScheduleConflict[]>([]);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
    const [isNewStaffSheetOpen, setIsNewStaffSheetOpen] = useState(false);

    const form = useForm<FixedScheduleFormData>({
        resolver: zodResolver(fixedScheduleSchema),
        defaultValues: {
            facilityId: '',
            staffId: '',
            sectorId: '',
            shiftType: 'morning',
            durationType: 'permanent',
            startDate: new Date(),
            endDate: null,
            weekdays: [1, 2, 3, 4, 5], // Seg-Sex por padrão
            active: true,
        },
    });

    const watchedStaffId = form.watch('staffId');
    const watchedShiftType = form.watch('shiftType');
    const watchedStartDate = form.watch('startDate');
    const watchedEndDate = form.watch('endDate');
    const watchedWeekdays = form.watch('weekdays');
    const watchedDurationType = form.watch('durationType');

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            if (scheduleToEdit) {
                form.reset({
                    facilityId: scheduleToEdit.facility_id,
                    staffId: scheduleToEdit.staff_id,
                    sectorId: scheduleToEdit.sector_id || '',
                    shiftType: scheduleToEdit.shift_type,
                    durationType: scheduleToEdit.duration_type,
                    startDate: new Date(scheduleToEdit.start_date + 'T12:00:00'),
                    endDate: scheduleToEdit.end_date 
                        ? new Date(scheduleToEdit.end_date + 'T12:00:00') 
                        : null,
                    weekdays: scheduleToEdit.weekdays,
                    active: scheduleToEdit.active,
                });
            } else {
                form.reset({
                    facilityId: facilities.length > 0 ? facilities[0].id : '',
                    staffId: '',
                    sectorId: '',
                    shiftType: 'morning',
                    durationType: 'permanent',
                    startDate: new Date(),
                    endDate: null,
                    weekdays: [1, 2, 3, 4, 5],
                    active: true,
                });
            }
            setConflicts([]);
        }
    }, [isOpen, scheduleToEdit, facilities, form]);

    // Check for conflicts when relevant fields change
    const checkConflicts = useCallback(async () => {
        if (!watchedStaffId || !watchedShiftType || watchedWeekdays.length === 0) {
            setConflicts([]);
            return;
        }

        setIsCheckingConflicts(true);
        try {
            const { data, error } = await supabase.rpc('check_fixed_schedule_conflict', {
                p_staff_id: watchedStaffId,
                p_shift_type: watchedShiftType,
                p_start_date: format(watchedStartDate, 'yyyy-MM-dd'),
                p_end_date: watchedDurationType === 'permanent' 
                    ? null 
                    : watchedEndDate 
                        ? format(watchedEndDate, 'yyyy-MM-dd') 
                        : null,
                p_weekdays: watchedWeekdays,
                p_exclude_id: scheduleToEdit?.id || null,
            });

            if (error) throw error;
            setConflicts(data || []);
        } catch (error) {
            console.error('Error checking conflicts:', error);
        } finally {
            setIsCheckingConflicts(false);
        }
    }, [
        watchedStaffId, 
        watchedShiftType, 
        watchedStartDate, 
        watchedEndDate, 
        watchedWeekdays,
        watchedDurationType,
        scheduleToEdit?.id
    ]);

    useEffect(() => {
        if (isOpen) {
            const timeoutId = setTimeout(checkConflicts, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, checkConflicts]);

    const onSubmit = async (data: FixedScheduleFormData) => {
        if (conflicts.length > 0) {
            toast.error('Resolva os conflitos antes de salvar.');
            return;
        }

        try {
            const payload = {
                organization_id: organizationId,
                facility_id: data.facilityId,
                staff_id: data.staffId,
                sector_id: data.sectorId || null,
                shift_type: data.shiftType,
                duration_type: data.durationType,
                start_date: format(data.startDate, 'yyyy-MM-dd'),
                end_date: data.durationType === 'permanent' 
                    ? null 
                    : data.endDate 
                        ? format(data.endDate, 'yyyy-MM-dd') 
                        : null,
                weekdays: data.weekdays,
                active: data.active,
                updated_at: new Date().toISOString(),
            };

            if (isEditing && scheduleToEdit) {
                // Deletar shifts futuros antes de atualizar
                await deleteFutureShiftsFromFixedSchedule(scheduleToEdit.id);
                
                const { error } = await supabase
                    .from('fixed_schedules')
                    .update(payload)
                    .eq('id', scheduleToEdit.id);
                if (error) throw error;
                
                // Regenerar shifts com a nova configuração
                const result = await generateShiftsFromFixedSchedule(scheduleToEdit.id);
                if (result.count > 0) {
                    toast.success(`Escala fixa atualizada! ${result.count} plantões gerados.`);
                } else {
                    toast.success('Escala fixa atualizada!');
                }
            } else {
                const { data: newSchedule, error } = await supabase
                    .from('fixed_schedules')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                
                // Gerar shifts para a nova escala fixa
                const result = await generateShiftsFromFixedSchedule(newSchedule.id);
                if (result.count > 0) {
                    toast.success(`Escala fixa criada! ${result.count} plantões gerados.`);
                } else {
                    toast.success('Escala fixa criada!');
                }
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving fixed schedule:', error);
            toast.error(error.message || 'Erro ao salvar escala fixa');
        }
    };

    const handleDelete = async () => {
        if (!scheduleToEdit || !confirm('Tem certeza que deseja excluir esta escala fixa? Os plantões futuros gerados serão removidos.')) return;
        
        try {
            // Deletar shifts futuros primeiro
            await deleteFutureShiftsFromFixedSchedule(scheduleToEdit.id);
            
            const { error } = await supabase
                .from('fixed_schedules')
                .delete()
                .eq('id', scheduleToEdit.id);

            if (error) throw error;
            toast.success('Escala fixa e plantões futuros excluídos.');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir.');
        }
    };

    const selectedStaff = staff.find(s => s.id === watchedStaffId);

    return (
        <BaseSheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            contentClassName="sm:max-w-[540px]"
            title={isEditing ? 'Editar Escala Fixa' : 'Nova Escala Fixa'}
            description={
                isEditing
                    ? 'Altere os detalhes da escala fixa.'
                    : 'Defina uma escala fixa para um profissional.'
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Conflitos */}
                    {conflicts.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <span className="font-medium">Conflito de escala detectado!</span>
                                <ul className="mt-2 text-sm space-y-1">
                                    {conflicts.map((c) => (
                                        <li key={c.conflicting_id}>
                                            {selectedStaff?.name} já está alocado(a) no turno {SHIFT_TYPE_LABELS[watchedShiftType]} 
                                            {' '}em <strong>{c.facility_name}</strong>
                                            {' '}({formatWeekdays(c.conflicting_weekdays)})
                                        </li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Unidade e Profissional */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="facilityId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unidade</FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={facilities.length === 0}
                                            placeholder="Selecione"
                                            options={facilities.map((f) => ({
                                                value: f.id,
                                                label: f.name,
                                            }))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="staffId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profissional</FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={staff.length === 0}
                                            placeholder="Selecione"
                                            options={staff.map((s) => ({
                                                value: s.id,
                                                label: `${s.name} (${s.role})`,
                                            }))}
                                        />
                                    </FormControl>
                                    <button
                                        type="button"
                                        onClick={() => setIsNewStaffSheetOpen(true)}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1"
                                    >
                                        <UserPlus className="h-3 w-3" />
                                        Cadastrar novo profissional
                                    </button>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Setor (opcional) */}
                    <FormField
                        control={form.control}
                        name="sectorId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Setor (opcional)</FormLabel>
                                <FormControl>
                                    <Select
                                        value={field.value || 'none'}
                                        onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                                        placeholder="Nenhum setor específico"
                                        options={[
                                            { value: 'none', label: 'Nenhum setor específico' },
                                            ...sectors.map((s) => ({
                                                value: s.id,
                                                label: s.name,
                                            })),
                                        ]}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Turno */}
                    <FormField
                        control={form.control}
                        name="shiftType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Turno</FormLabel>
                                <FormControl>
                                    <div className="grid grid-cols-3 gap-2">
                                        {SHIFT_TYPES.map((type) => {
                                            const isSelected = field.value === type;
                                            const times = SHIFT_TYPE_TIMES[type];
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => field.onChange(type)}
                                                    className={`
                                                        flex flex-col items-center py-3 px-2 rounded-lg border-2 transition-all
                                                        ${isSelected 
                                                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                                                            : 'border-slate-200 hover:border-blue-300 text-slate-600'
                                                        }
                                                    `}
                                                >
                                                    <span className="font-medium">{SHIFT_TYPE_LABELS[type]}</span>
                                                    <span className="text-xs opacity-70">
                                                        {times.start} - {times.end}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Dias da Semana */}
                    <FormField
                        control={form.control}
                        name="weekdays"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dias da Semana</FormLabel>
                                <FormControl>
                                    <WeekdaySelector
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Duração */}
                    <FormField
                        control={form.control}
                        name="durationType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duração</FormLabel>
                                <FormControl>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        options={DURATION_TYPES.map((type) => ({
                                            value: type,
                                            label: DURATION_TYPE_LABELS[type],
                                        }))}
                                    />
                                </FormControl>
                                <FormDescription>
                                    {field.value === 'permanent' 
                                        ? 'A escala não tem data de término definida.'
                                        : 'Defina o período de validade da escala.'}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Período */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data de Início</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => 
                                                field.onChange(
                                                    e.target.value 
                                                        ? new Date(e.target.value + 'T12:00:00') 
                                                        : new Date()
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {watchedDurationType !== 'permanent' && (
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Término</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                                onChange={(e) => 
                                                    field.onChange(
                                                        e.target.value 
                                                            ? new Date(e.target.value + 'T12:00:00') 
                                                            : null
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    {/* Ações */}
                    <div className="flex justify-between gap-4 pt-4">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={form.formState.isSubmitting}
                            >
                                Excluir
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={form.formState.isSubmitting || conflicts.length > 0 || isCheckingConflicts}
                            >
                                {(form.formState.isSubmitting || isCheckingConflicts) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Salvar
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>

            {/* Sheet para cadastrar novo profissional */}
            <MedicalStaffSheet
                isOpen={isNewStaffSheetOpen}
                onClose={() => setIsNewStaffSheetOpen(false)}
                onSuccess={() => {
                    setIsNewStaffSheetOpen(false);
                    // Atualiza a lista de profissionais
                    if (onStaffRefresh) {
                        onStaffRefresh();
                    }
                }}
                organizationId={organizationId}
            />
        </BaseSheet>
    );
}

