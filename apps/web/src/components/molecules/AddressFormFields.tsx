'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Loader2 } from 'lucide-react';
import {
    BRAZILIAN_STATES,
    BRAZILIAN_STATE_LABELS,
    type FacilityAddressFormData,
} from '@/schemas/facility-address.schema';

interface AddressFormFieldsProps {
    /**
     * Field name prefix for nested form structures
     * Example: if prefix is 'address', fields will be 'address.street', 'address.number', etc.
     */
    namePrefix?: string;
}

interface ViaCEPResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
}

/**
 * Format CEP with mask XXXXX-XXX
 */
const formatCEP = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
};

/**
 * Fetch address data from ViaCEP API
 */
const fetchAddressFromCEP = async (cep: string): Promise<ViaCEPResponse | null> => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        if (!response.ok) return null;

        const data: ViaCEPResponse = await response.json();
        if (data.erro) return null;

        return data;
    } catch (error) {
        console.error('Error fetching CEP:', error);
        return null;
    }
};

/**
 * AddressFormFields - Molecule component for comprehensive address input
 *
 * This component provides all necessary fields for Brazilian address input:
 * - CEP (postal code) with automatic formatting and ViaCEP integration
 * - Street, number, complement, neighborhood
 * - City and state (dropdown with all 27 Brazilian states)
 * - Country (defaults to Brasil)
 *
 * @example
 * ```tsx
 * <Form {...form}>
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <AddressFormFields />
 *   </form>
 * </Form>
 * ```
 *
 * @example With prefix for nested forms
 * ```tsx
 * <AddressFormFields namePrefix="facility_address" />
 * ```
 */
export const AddressFormFields: React.FC<AddressFormFieldsProps> = ({
    namePrefix = '',
}) => {
    const form = useFormContext<FacilityAddressFormData>();
    const [isLoadingCEP, setIsLoadingCEP] = useState(false);

    // Helper to construct field names
    const getFieldName = (fieldName: keyof FacilityAddressFormData): any => {
        return namePrefix ? `${namePrefix}.${fieldName}` : fieldName;
    };

    // Watch CEP field for auto-complete
    const cepValue = form.watch(getFieldName('postal_code'));

    useEffect(() => {
        // Debounce CEP lookup
        const handler = setTimeout(async () => {
            if (!cepValue) return;

            const cleanCEP = cepValue.replace(/\D/g, '');
            if (cleanCEP.length !== 8) return;

            setIsLoadingCEP(true);
            const addressData = await fetchAddressFromCEP(cleanCEP);
            setIsLoadingCEP(false);

            if (addressData) {
                // Auto-fill fields with data from ViaCEP
                if (addressData.logradouro) {
                    form.setValue(getFieldName('street'), addressData.logradouro, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                }
                if (addressData.bairro) {
                    form.setValue(getFieldName('neighborhood'), addressData.bairro, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                }
                if (addressData.localidade) {
                    form.setValue(getFieldName('city'), addressData.localidade, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                }
                if (addressData.uf && BRAZILIAN_STATES.includes(addressData.uf as any)) {
                    form.setValue(getFieldName('state'), addressData.uf as any, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                }
                if (addressData.complemento) {
                    form.setValue(getFieldName('complement'), addressData.complemento, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                }
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(handler);
    }, [cepValue, form, namePrefix]);

    return (
        <div className="space-y-4">
            {/* CEP Field with auto-complete */}
            <FormField
                control={form.control}
                name={getFieldName('postal_code')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    placeholder="00000-000"
                                    {...field}
                                    onChange={(e) => {
                                        const formatted = formatCEP(e.target.value);
                                        field.onChange(formatted);
                                    }}
                                    maxLength={9}
                                />
                                {isLoadingCEP && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Street and Number - Side by side */}
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <FormField
                    control={form.control}
                    name={getFieldName('street')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                                <Input placeholder="Rua, Avenida, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={getFieldName('number')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                                <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Complement (optional) */}
            <FormField
                control={form.control}
                name={getFieldName('complement')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Complemento (opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Apto 101, Bloco B, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Neighborhood */}
            <FormField
                control={form.control}
                name={getFieldName('neighborhood')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                            <Input placeholder="Centro, Jardins, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* City and State - Side by side */}
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name={getFieldName('city')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                                <Input placeholder="São Paulo" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name={getFieldName('state')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Selecione o estado"
                                options={BRAZILIAN_STATES.map((state) => ({
                                    value: state,
                                    label: BRAZILIAN_STATE_LABELS[state],
                                }))}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Country */}
            <FormField
                control={form.control}
                name={getFieldName('country')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                            <Input placeholder="Brasil" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

AddressFormFields.displayName = 'AddressFormFields';
