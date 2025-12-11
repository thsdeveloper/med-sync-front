'use client';

import { Control, useWatch } from 'react-hook-form';
import { DollarSign } from 'lucide-react';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ShiftDurationRateInput } from './ShiftDurationRateInput';
import {
    PAYMENT_TYPES,
    PAYMENT_TYPE_LABELS,
} from '@medsync/shared';

interface PaymentConfigSectionProps {
    control: Control<any>;
}

export function PaymentConfigSection({ control }: PaymentConfigSectionProps) {
    // Watch payment_type to conditionally render fields
    const paymentType = useWatch({
        control,
        name: 'payment_config.payment_type',
    });

    const formatCurrency = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        const amount = Number(numbers) / 100;
        return amount.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const parseCurrency = (value: string): number => {
        const numbers = value.replace(/\D/g, '');
        return Number(numbers) / 100;
    };

    return (
        <div className="space-y-6 rounded-lg border border-gray-200 bg-gray-50/50 p-6">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <DollarSign className="h-5 w-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">
                    Configuração de Pagamento
                </h3>
            </div>

            {/* Payment Type Selection */}
            <FormField
                control={control}
                name="payment_config.payment_type"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Tipo de Pagamento</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid gap-3 sm:grid-cols-2"
                            >
                                {PAYMENT_TYPES.map((type) => (
                                    <div key={type} className="flex items-center space-x-2 rounded-lg border border-gray-300 p-4 hover:bg-white transition-colors">
                                        <RadioGroupItem value={type} id={`payment-type-${type}`} />
                                        <Label htmlFor={`payment-type-${type}`} className="flex-1 cursor-pointer">
                                            <div className="font-medium">{PAYMENT_TYPE_LABELS[type]}</div>
                                            <div className="text-xs text-gray-500">
                                                {type === 'hourly'
                                                    ? 'Valor por hora trabalhada'
                                                    : 'Valor fixo baseado na duração do turno'}
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Hourly Rate (conditional) */}
            {paymentType === 'hourly' && (
                <FormField
                    control={control}
                    name="payment_config.hourly_rate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Taxa Horária</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                        R$
                                    </span>
                                    <Input
                                        type="text"
                                        placeholder="0,00"
                                        className="pl-10"
                                        value={field.value ? formatCurrency(String(field.value * 100)) : ''}
                                        onChange={(e) => {
                                            const formatted = formatCurrency(e.target.value);
                                            const parsed = parseCurrency(formatted);
                                            field.onChange(parsed);
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>
                                Valor pago por hora de trabalho para todos os médicos desta unidade
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {/* Shift Duration Rates (conditional) */}
            {paymentType === 'fixed_per_shift' && (
                <ShiftDurationRateInput
                    control={control}
                    name="payment_config.duration_rates"
                />
            )}

            {/* Bonuses Section */}
            <div className="space-y-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900">
                    Adicionais
                </h4>

                <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                        control={control}
                        name="payment_config.night_shift_bonus_percent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Adicional Noturno (%)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="25"
                                        min="0"
                                        max="100"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="payment_config.weekend_bonus_percent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Adicional Fim de Semana (%)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="50"
                                        min="0"
                                        max="100"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="payment_config.holiday_bonus_percent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Adicional Feriado (%)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="100"
                                        min="0"
                                        max="100"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Night Shift Hours */}
            <div className="space-y-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900">
                    Horário do Adicional Noturno
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={control}
                        name="payment_config.night_shift_start_hour"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Início (hora)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="22"
                                        min="0"
                                        max="23"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Padrão: 22h (10 PM)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="payment_config.night_shift_end_hour"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Término (hora)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="6"
                                        min="0"
                                        max="23"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Padrão: 6h (6 AM)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
