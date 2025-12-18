'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { BaseSheet } from '@/components/molecules/BaseSheet';
import { SectorSelect } from '@/components/molecules/SectorSelect';
import { FacilitySelect } from '@/components/molecules/FacilitySelect';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/atoms/Select';

import { shiftSchema, type ShiftFormData, type Shift, type Sector, type MedicalStaff, type Facility } from '@medsync/shared';

interface ShiftDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    organizationId: string;
    sectors: Sector[];
    facilities: Facility[];
    staff: MedicalStaff[];
    shiftToEdit?: Shift | null;
    initialDate?: Date | null;
}

export function ShiftDialog({
    isOpen,
    onClose,
    onSuccess,
    organizationId,
    sectors,
    facilities,
    staff,
    shiftToEdit,
    initialDate
}: ShiftDialogProps) {
    const isEditing = !!shiftToEdit;

    const form = useForm<ShiftFormData>({
        resolver: zodResolver(shiftSchema),
        defaultValues: {
            sectorId: '',
            facilityId: '',
            staffId: 'open', // 'open' = plantao em aberto
            date: new Date(),
            startTime: '07:00',
            endTime: '19:00',
            notes: '',
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (shiftToEdit) {
                const startTime = new Date(shiftToEdit.start_time);
                const endTime = new Date(shiftToEdit.end_time);

                form.reset({
                    sectorId: shiftToEdit.sector_id || '',
                    facilityId: shiftToEdit.facility_id || '',
                    staffId: shiftToEdit.staff_id || 'open',
                    date: startTime,
                    startTime: format(startTime, 'HH:mm'),
                    endTime: format(endTime, 'HH:mm'),
                    notes: shiftToEdit.notes || '',
                });
            } else {
                form.reset({
                    sectorId: sectors.length > 0 ? sectors[0].id : '',
                    facilityId: facilities.length > 0 ? facilities[0].id : '',
                    staffId: 'open',
                    date: initialDate || new Date(),
                    startTime: '07:00',
                    endTime: '19:00',
                    notes: '',
                });
            }
        }
    }, [isOpen, shiftToEdit, initialDate, sectors, facilities, form]);

    const onSubmit = async (data: ShiftFormData) => {
        try {
            // Combine date + time
            const startDateTime = new Date(data.date);
            const [startHour, startMinute] = data.startTime.split(':').map(Number);
            startDateTime.setHours(startHour, startMinute, 0, 0);

            const endDateTime = new Date(data.date);
            const [endHour, endMinute] = data.endTime.split(':').map(Number);
            endDateTime.setHours(endHour, endMinute, 0, 0);

            // Handle overnight shifts (end time < start time)
            if (endDateTime <= startDateTime) {
                endDateTime.setDate(endDateTime.getDate() + 1);
            }

            const payload = {
                organization_id: organizationId,
                sector_id: data.sectorId,
                facility_id: data.facilityId,
                staff_id: data.staffId === 'open' ? null : data.staffId,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                notes: data.notes,
            };

            if (isEditing && shiftToEdit) {
                const { error } = await supabase
                    .from('shifts')
                    .update(payload)
                    .eq('id', shiftToEdit.id);
                if (error) throw error;
                toast.success('Plantão atualizado!');
            } else {
                const { error } = await supabase
                    .from('shifts')
                    .insert(payload);
                if (error) throw error;
                toast.success('Plantão criado!');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving shift:', error);
            toast.error(error.message || 'Erro ao salvar plantão');
        }
    };

    const handleDelete = async () => {
        if (!shiftToEdit || !confirm('Tem certeza que deseja excluir este plantão?')) return;
        try {
            const { error } = await supabase
                .from('shifts')
                .delete()
                .eq('id', shiftToEdit.id);

            if (error) throw error;
            toast.success('Plantão excluído.');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir.');
        }
    }

    return (
        <BaseSheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            contentClassName="sm:max-w-[500px]"
            title={isEditing ? 'Editar Plantão' : 'Novo Plantão'}
            description={
                isEditing
                    ? 'Altere os detalhes do plantão existente.'
                    : 'Agende um novo plantão para sua equipe.'
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    <FormField
                        control={form.control}
                        name="facilityId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unidade</FormLabel>
                                <FormControl>
                                    <FacilitySelect
                                        facilities={facilities}
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={facilities.length === 0}
                                        placeholder="Selecione a unidade"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value + 'T12:00:00') : new Date())} // Simple fix to avoid timezone issues on date pickers
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sectorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Setor</FormLabel>
                                    <FormControl>
                                        <SectorSelect
                                            sectors={sectors}
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={sectors.length === 0}
                                            placeholder="Selecione o setor"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Início</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fim</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

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
                                        placeholder="Selecione o profissional"
                                        options={[
                                            { value: 'open', label: '-- Em Aberto --' },
                                            ...staff.map((s) => ({
                                                value: s.id,
                                                label: `${s.name} (${s.profissao?.nome || 'Profissional'})`,
                                            })),
                                        ]}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Observações</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Ex: Plantão cobertura..."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Salvar
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </BaseSheet>
    );
}
