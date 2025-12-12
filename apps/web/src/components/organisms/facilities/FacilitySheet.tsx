'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import dynamic from 'next/dynamic';

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
import { AddressFormFields } from '@/components/molecules/AddressFormFields';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
    () => import('@/components/molecules/LocationPicker').then(mod => mod.LocationPicker),
    { ssr: false, loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-md" /> }
);

import {
    facilityWithAddressSchema,
    FacilityWithAddressFormData,
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

// Extended schema combining facility + address + payment config
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

const facilityWithAllDataSchema = facilityWithAddressSchema.extend({
    payment_config: paymentConfigWithRatesSchema.optional(),
});

type FacilityWithAllDataFormData = z.infer<typeof facilityWithAllDataSchema>;

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
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    const form = useForm<FacilityWithAllDataFormData>({
        resolver: zodResolver(facilityWithAllDataSchema),
        defaultValues: {
            name: '',
            type: 'clinic',
            cnpj: '',
            address: '',
            phone: '',
            active: true,
            address_fields: {
                street: '',
                number: '',
                complement: '',
                neighborhood: '',
                city: '',
                state: '' as any,
                postal_code: '',
                country: 'Brasil',
                latitude: null,
                longitude: null,
            },
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
        const loadFacilityData = async () => {
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
                }

                // Fetch address data
                const { data: addressData, error: addressError } = await supabase
                    .from('facility_addresses')
                    .select('*')
                    .eq('facility_id', facilityToEdit.id)
                    .single();

                if (addressError && addressError.code !== 'PGRST116') {
                    console.error('Error loading address:', addressError);
                }

                // Prepare address fields
                const addressFields = addressData ? {
                    street: addressData.street,
                    number: addressData.number,
                    complement: addressData.complement || '',
                    neighborhood: addressData.neighborhood,
                    city: addressData.city,
                    state: addressData.state,
                    postal_code: addressData.postal_code,
                    country: addressData.country || 'Brasil',
                    latitude: addressData.latitude,
                    longitude: addressData.longitude,
                } : {
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '' as any,
                    postal_code: '',
                    country: 'Brasil',
                    latitude: null,
                    longitude: null,
                };

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

                form.setValue('address_fields', addressFields);
            } catch (error) {
                console.error('Error loading facility data:', error);
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
                    address_fields: {
                        street: '',
                        number: '',
                        complement: '',
                        neighborhood: '',
                        city: '',
                        state: '' as any,
                        postal_code: '',
                        country: 'Brasil',
                        latitude: null,
                        longitude: null,
                    },
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
                loadFacilityData();
            } else {
                form.reset({
                    name: '',
                    type: 'clinic',
                    cnpj: '',
                    address: '',
                    phone: '',
                    active: true,
                    address_fields: {
                        street: '',
                        number: '',
                        complement: '',
                        neighborhood: '',
                        city: '',
                        state: '' as any,
                        postal_code: '',
                        country: 'Brasil',
                        latitude: null,
                        longitude: null,
                    },
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

    const onSubmit = async (data: FacilityWithAllDataFormData) => {
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

            // Step 2: Save/update address data if provided
            if (data.address_fields) {
                const addressFields = data.address_fields;

                // Check if any address field is filled
                const hasAddressData =
                    addressFields.street ||
                    addressFields.number ||
                    addressFields.neighborhood ||
                    addressFields.city ||
                    addressFields.state ||
                    addressFields.postal_code;

                if (hasAddressData) {
                    setIsSavingAddress(true);
                    try {
                        // Get auth token
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) {
                            throw new Error('Não autenticado');
                        }

                        // Prepare address payload
                        const addressPayload = {
                            facility_id: facilityId,
                            street: addressFields.street || '',
                            number: addressFields.number || '',
                            complement: addressFields.complement || '',
                            neighborhood: addressFields.neighborhood || '',
                            city: addressFields.city || '',
                            state: addressFields.state || '',
                            postal_code: addressFields.postal_code?.replace(/\D/g, '') || '',
                            country: addressFields.country || 'Brasil',
                            latitude: addressFields.latitude || null,
                            longitude: addressFields.longitude || null,
                        };

                        // Check if address already exists
                        const { data: existingAddress } = await supabase
                            .from('facility_addresses')
                            .select('id')
                            .eq('facility_id', facilityId)
                            .single();

                        if (existingAddress) {
                            // Update existing address via API
                            const response = await fetch(`/api/facilities/${facilityId}/address`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session.access_token}`,
                                },
                                body: JSON.stringify(addressPayload),
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Erro ao atualizar endereço');
                            }
                        } else {
                            // Create new address via API
                            const response = await fetch(`/api/facilities/${facilityId}/address`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session.access_token}`,
                                },
                                body: JSON.stringify(addressPayload),
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Erro ao salvar endereço');
                            }
                        }
                    } catch (addressError: any) {
                        console.error('Error saving address:', addressError);
                        toast.error(addressError.message || 'Erro ao salvar endereço da unidade');
                        // Don't throw - facility was saved successfully
                    } finally {
                        setIsSavingAddress(false);
                    }
                }
            }

            // Step 3: Save/update payment config if provided
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

                // Step 4: Insert duration rates if payment type is fixed_per_shift
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
                                <FormLabel>Endereço Completo (Legado - opcional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        rows={2}
                                        placeholder="Campo legado - use os campos de endereço abaixo"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Address Section */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold">Endereço Detalhado</h3>
                            <p className="text-sm text-muted-foreground">
                                Preencha o endereço completo da unidade (opcional)
                            </p>
                        </div>

                        <AddressFormFields namePrefix="address_fields" />

                        {/* Location Picker */}
                        <div className="space-y-2 pt-2">
                            <FormLabel>Localização no Mapa (opcional)</FormLabel>
                            <p className="text-sm text-muted-foreground mb-2">
                                Clique no mapa ou arraste o marcador para definir a localização exata
                            </p>
                            <LocationPicker
                                latitude={form.watch('address_fields.latitude') || undefined}
                                longitude={form.watch('address_fields.longitude') || undefined}
                                onChange={(location) => {
                                    form.setValue('address_fields.latitude', location.latitude || null);
                                    form.setValue('address_fields.longitude', location.longitude || null);
                                }}
                            />
                        </div>
                    </div>

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
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isSavingAddress}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || isSavingAddress}>
                            {(isLoading || isSavingAddress) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isSavingAddress ? 'Salvando endereço...' : (isEditing ? 'Salvar Alterações' : 'Cadastrar Unidade')}
                        </Button>
                    </div>
                </form>
            </Form>
        </BaseSheet>
    );
}
