'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

import { BaseSheet } from '@/components/molecules/BaseSheet';
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
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/ui/textarea';

import {
    facilitySchema,
    FacilityFormData,
    Facility,
    FACILITY_TYPES,
    FACILITY_TYPE_LABELS,
} from '@medsync/shared';

interface FacilitySheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    organizationId: string;
    facilityToEdit?: Facility | null;
}

const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatPhone = (value?: string | null) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length)}`;
    if (digits.length <= 10)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export function FacilitySheet({
    isOpen,
    onClose,
    onSuccess,
    organizationId,
    facilityToEdit
}: FacilitySheetProps) {
    const isEditing = !!facilityToEdit;

    const form = useForm<FacilityFormData>({
        resolver: zodResolver(facilitySchema),
        defaultValues: {
            name: '',
            type: 'clinic',
            cnpj: '',
            address: '',
            phone: '',
            active: true,
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (facilityToEdit) {
                form.reset({
                    name: facilityToEdit.name,
                    type: facilityToEdit.type,
                    cnpj: facilityToEdit.cnpj ? formatCnpj(facilityToEdit.cnpj) : '',
                    address: facilityToEdit.address || '',
                    phone: facilityToEdit.phone ? formatPhone(facilityToEdit.phone) : '',
                    active: facilityToEdit.active,
                });
            } else {
                form.reset({
                    name: '',
                    type: 'clinic',
                    cnpj: '',
                    address: '',
                    phone: '',
                    active: true,
                });
            }
        }
    }, [isOpen, facilityToEdit, form]);

    const onSubmit = async (data: FacilityFormData) => {
        try {
            const payload = {
                name: data.name.trim(),
                type: data.type,
                cnpj: data.cnpj?.replace(/\D/g, '') || null,
                address: data.address?.trim() || null,
                phone: data.phone?.replace(/\D/g, '') || null,
                active: data.active,
            };

            if (isEditing && facilityToEdit) {
                const { error } = await supabase
                    .from('facilities')
                    .update(payload)
                    .eq('id', facilityToEdit.id);

                if (error) throw error;
                toast.success('Unidade atualizada com sucesso!');
            } else {
                const { error } = await supabase
                    .from('facilities')
                    .insert({
                        organization_id: organizationId,
                        ...payload,
                    });

                if (error) throw error;
                toast.success('Unidade cadastrada com sucesso!');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving facility:', error);
            toast.error(error.message || 'Erro ao salvar unidade');
        }
    };

    const handleCnpjMask = (value: string) => {
        return formatCnpj(value);
    };

    const handlePhoneMask = (value: string) => {
        return formatPhone(value);
    };

    return (
        <BaseSheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            contentClassName="sm:max-w-[540px]"
            title={isEditing ? 'Editar Unidade' : 'Nova Unidade'}
            description={
                isEditing
                    ? 'Edite os dados da clínica ou hospital.'
                    : 'Preencha os dados para cadastrar uma nova clínica ou hospital.'
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Unidade</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex.: Hospital São Lucas" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Selecione o tipo"
                                        options={FACILITY_TYPES.map((type) => ({
                                            value: type,
                                            label: FACILITY_TYPE_LABELS[type],
                                        }))}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cnpj"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CNPJ (opcional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="XX.XXX.XXX/XXXX-XX"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(handleCnpjMask(e.target.value))
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="(11) 99999-9999"
                                        {...field}
                                        onChange={(e) =>
                                            field.onChange(handlePhoneMask(e.target.value))
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Endereço Completo</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        rows={3}
                                        placeholder="Rua, número, bairro, cidade - UF"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Ativa</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                        Unidades inativas não aparecem nas listagens principais.
                                    </div>
                                </div>
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar Unidade'}
                        </Button>
                    </div>
                </form>
            </Form>
        </BaseSheet>
    );
}

