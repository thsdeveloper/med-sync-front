'use client';

import { useFieldArray, Control } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { ShiftDurationRateFormData } from '@medsync/shared';

interface ShiftDurationRateInputProps {
    control: Control<any>;
    name: string;
}

export function ShiftDurationRateInput({ control, name }: ShiftDurationRateInputProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name,
    });

    const handleAddDuration = () => {
        append({ duration_hours: 6, fixed_rate: 0 });
    };

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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <FormLabel>Taxas por Duração de Turno</FormLabel>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDuration}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar Duração
                </Button>
            </div>

            {fields.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                    Nenhuma duração configurada. Clique em "Adicionar Duração" para começar.
                </div>
            )}

            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="flex-1 grid gap-3 sm:grid-cols-2">
                            <FormField
                                control={control}
                                name={`${name}.${index}.duration_hours`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duração (horas)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Ex.: 6, 12, 24"
                                                min="1"
                                                max="24"
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
                                name={`${name}.${index}.fixed_rate`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Fixo</FormLabel>
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="mt-8 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {fields.length > 0 && (
                <p className="text-xs text-gray-500">
                    Configure o valor fixo a ser pago por turnos de diferentes durações.
                    O sistema escolherá automaticamente a duração mais próxima da programada.
                </p>
            )}
        </div>
    );
}
