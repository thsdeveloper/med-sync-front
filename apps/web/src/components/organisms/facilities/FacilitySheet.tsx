'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

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
import { PaymentConfigSection } from '@/components/organisms/payments/PaymentConfigSection';

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

// Extended schema combining facility + payment config
const shiftDurationRateFormSchema = z.object({
    duration_hours: z.number(),
    fixed_rate: z.number(),
});

const paymentConfigWithRatesSchema = z.object({
    payment_type: z.enum(['hourly', 'fixed_per_shift'] as const),
    hourly_rate: z.number().optional(),
    night_shift_bonus_percent: z.number(),
    weekend_bonus_percent: z.number(),
    holiday_bonus_percent: z.number(),
    night_shift_start_hour: z.number(),
    night_shift_end_hour: z.number(),
    active: z.boolean(),
    duration_rates: z.array(shiftDurationRateFormSchema),
});

const facilityWithPaymentSchema = facilitySchema.extend({
    payment_config: paymentConfigWithRatesSchema.optional(),
});

type FacilityWithPaymentFormData = z.infer<typeof facilityWithPaymentSchema>;

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
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FacilityWithPaymentFormData>({
        resolver: zodResolver(facilityWithPaymentSchema),
        defaultValues: {
            name: '',
            type: 'clinic',
            cnpj: '',
            address: '',
            phone: '',
            active: true,
            payment_config: {
                payment_type: 'hourly',
                hourly_rate: undefined,
                night_shift_bonus_percent: 0,
                weekend_bonus_percent: 0,
                holiday_bonus_percent: 0,
                night_shift_start_hour: 22,
                night_shift_end_hour: 6,
                active: true,
                duration_rates: [],
            },
        },
    });

    useEffect(() => {
        const loadPaymentConfig = async () => {
            if (!facilityToEdit) return;

            try {
                // Fetch payment config
                const { data: paymentConfig, error: configError } = await supabase
                    .from('facility_payment_config')
                    .select('*')
                    .eq('facility_id', facilityToEdit.id)
                    .single();

                if (configError && configError.code !== 'PGRST116') {
                    // PGRST116 = no rows returned
                    console.error('Error loading payment config:', configError);
                    return;
                }

                if (paymentConfig) {
                    // Fetch duration rates if payment type is fixed_per_shift
                    let durationRates: any[] = [];
                    if (paymentConfig.payment_type === 'fixed_per_shift') {
                        const { data: rates, error: ratesError } = await supabase
                            .from('shift_duration_rates')
                            .select('*')
                            .eq('facility_payment_config_id', paymentConfig.id);

                        if (ratesError) {
                            console.error('Error loading duration rates:', ratesError);
                        } else {
                            durationRates = rates || [];
                        }
                    }

                    form.setValue('payment_config', {
                        payment_type: paymentConfig.payment_type as 'hourly' | 'fixed_per_shift',
                        hourly_rate: paymentConfig.hourly_rate || undefined,
                        night_shift_bonus_percent: paymentConfig.night_shift_bonus_percent || 0,
                        weekend_bonus_percent: paymentConfig.weekend_bonus_percent || 0,
                        holiday_bonus_percent: paymentConfig.holiday_bonus_percent || 0,
                        night_shift_start_hour: paymentConfig.night_shift_start_hour || 22,
                        night_shift_end_hour: paymentConfig.night_shift_end_hour || 6,
                        active: paymentConfig.active,
                        duration_rates: durationRates.map((rate) => ({
                            duration_hours: rate.duration_hours,
                            fixed_rate: rate.fixed_rate,
                        })),
                    });
                }
            } catch (error) {
                console.error('Error loading payment config:', error);
            }
        };

        if (isOpen) {
            if (facilityToEdit) {
                form.reset({
                    name: facilityToEdit.name,
                    type: facilityToEdit.type,
                    cnpj: facilityToEdit.cnpj ? formatCnpj(facilityToEdit.cnpj) : '',
                    address: facilityToEdit.address || '',
                    phone: facilityToEdit.phone ? formatPhone(facilityToEdit.phone) : '',
                    active: facilityToEdit.active,
                    payment_config: {
                        payment_type: 'hourly',
                        hourly_rate: undefined,
                        night_shift_bonus_percent: 0,
                        weekend_bonus_percent: 0,
                        holiday_bonus_percent: 0,
                        night_shift_start_hour: 22,
                        night_shift_end_hour: 6,
                        active: true,
                        duration_rates: [],
                    },
                });
                loadPaymentConfig();
            } else {
                form.reset({
                    name: '',
                    type: 'clinic',
                    cnpj: '',
                    address: '',
                    phone: '',
                    active: true,
                    payment_config: {
                        payment_type: 'hourly',
                        hourly_rate: undefined,
                        night_shift_bonus_percent: 0,
                        weekend_bonus_percent: 0,
                        holiday_bonus_percent: 0,
                        night_shift_start_hour: 22,
                        night_shift_end_hour: 6,
                        active: true,
                        duration_rates: [],
                    },
                });
            }
        }
    }, [isOpen, facilityToEdit, form]);

    const onSubmit = async (data: FacilityWithPaymentFormData) => {
        setIsLoading(true);
        try {
            const facilityPayload = {
                name: data.name.trim(),
                type: data.type,
                cnpj: data.cnpj?.replace(/\D/g, '') || null,
                address: data.address?.trim() || null,
                phone: data.phone?.replace(/\D/g, '') || null,
                active: data.active,
            };

            let facilityId: string;

            // Step 1: Save/update facility
            if (isEditing && facilityToEdit) {
                const { error } = await supabase
                    .from('facilities')
                    .update(facilityPayload)
                    .eq('id', facilityToEdit.id);

                if (error) throw error;
                facilityId = facilityToEdit.id;
            } else {
                const { data: newFacility, error } = await supabase
                    .from('facilities')
                    .insert({
                        organization_id: organizationId,
                        ...facilityPayload,
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (!newFacility) throw new Error('Failed to create facility');
                facilityId = newFacility.id;
            }

            // Step 2: Save/update payment config if provided
            if (data.payment_config) {
                const paymentConfigPayload = {
                    facility_id: facilityId,
                    payment_type: data.payment_config.payment_type,
                    hourly_rate: data.payment_config.payment_type === 'hourly'
                        ? data.payment_config.hourly_rate
                        : null,
                    night_shift_bonus_percent: data.payment_config.night_shift_bonus_percent,
                    weekend_bonus_percent: data.payment_config.weekend_bonus_percent,
                    holiday_bonus_percent: data.payment_config.holiday_bonus_percent,
                    night_shift_start_hour: data.payment_config.night_shift_start_hour,
                    night_shift_end_hour: data.payment_config.night_shift_end_hour,
                    active: data.payment_config.active,
                };

                // Check if payment config already exists
                const { data: existingConfig } = await supabase
                    .from('facility_payment_config')
                    .select('id')
                    .eq('facility_id', facilityId)
                    .single();

                let paymentConfigId: string;

                if (existingConfig) {
                    // Update existing config
                    const { error } = await supabase
                        .from('facility_payment_config')
                        .update(paymentConfigPayload)
                        .eq('id', existingConfig.id);

                    if (error) throw error;
                    paymentConfigId = existingConfig.id;

                    // Delete existing duration rates
                    await supabase
                        .from('shift_duration_rates')
                        .delete()
                        .eq('facility_payment_config_id', existingConfig.id);
                } else {
                    // Insert new config
                    const { data: newConfig, error } = await supabase
                        .from('facility_payment_config')
                        .insert(paymentConfigPayload)
                        .select()
                        .single();

                    if (error) throw error;
                    if (!newConfig) throw new Error('Failed to create payment config');
                    paymentConfigId = newConfig.id;
                }

                // Step 3: Insert duration rates if payment type is fixed_per_shift
                if (data.payment_config.payment_type === 'fixed_per_shift' &&
                    data.payment_config.duration_rates &&
                    data.payment_config.duration_rates.length > 0) {
                    const durationRatesPayload = data.payment_config.duration_rates.map((rate) => ({
                        facility_payment_config_id: paymentConfigId,
                        duration_hours: rate.duration_hours,
                        fixed_rate: rate.fixed_rate,
                    }));

                    const { error } = await supabase
                        .from('shift_duration_rates')
                        .insert(durationRatesPayload);

                    if (error) throw error;
                }
            }

            toast.success(isEditing ? 'Unidade atualizada com sucesso!' : 'Unidade cadastrada com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving facility:', error);
            toast.error(error.message || 'Erro ao salvar unidade');
        } finally {
            setIsLoading(false);
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
            contentClassName="sm:max-w-[700px]"
            title={isEditing ? 'Editar Unidade' : 'Nova Unidade'}
            description={
                isEditing
                    ? 'Edite os dados da clínica ou hospital e configure o pagamento dos médicos.'
                    : 'Preencha os dados para cadastrar uma nova clínica ou hospital e configure o pagamento dos médicos.'
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

                    {/* Payment Configuration Section */}
                    <PaymentConfigSection control={form.control} />

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
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && (
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
