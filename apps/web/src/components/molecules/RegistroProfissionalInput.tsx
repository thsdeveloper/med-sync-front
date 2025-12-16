'use client';

import * as React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { VALID_UFS, normalizeRegistroNumero } from '@medsync/shared/schemas';
import type { ProfissaoComConselho } from '@medsync/shared/schemas';

export interface RegistroProfissionalValue {
    numero: string;
    uf: string;
    categoria?: string;
}

interface RegistroProfissionalInputProps {
    value: RegistroProfissionalValue;
    onChange: (value: RegistroProfissionalValue) => void;
    profissao?: ProfissaoComConselho | null;
    disabled?: boolean;
    className?: string;
    errors?: {
        numero?: string;
        uf?: string;
        categoria?: string;
    };
}

/**
 * RegistroProfissionalInput - Input group for professional registration
 *
 * A molecule component that combines Input and Select atoms to create
 * a complete professional registration input group.
 *
 * Features:
 * - Input for registration number (digits only)
 * - Select for UF (Brazilian state)
 * - Conditional categoria select when conselho requires it (e.g., COREN)
 * - Dynamic label based on the selected conselho
 * - Auto-normalizes input (removes non-digits)
 * - Validates against conselho regex pattern
 * - Shows error states for each field
 * - Follows Atomic Design (molecule combining Input, Select atoms)
 */
export function RegistroProfissionalInput({
    value,
    onChange,
    profissao,
    disabled = false,
    className,
    errors,
}: RegistroProfissionalInputProps) {
    const conselho = profissao?.conselho;
    const conselhoSigla = conselho?.sigla || 'Registro';
    const requerCategoria = conselho?.requer_categoria ?? false;
    const categoriasDisponiveis = profissao?.categorias_disponiveis || [];

    // Handle numero change with normalization
    const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const normalized = normalizeRegistroNumero(rawValue);
        onChange({
            ...value,
            numero: normalized,
        });
    };

    // Handle UF change
    const handleUfChange = (uf: string) => {
        onChange({
            ...value,
            uf,
        });
    };

    // Handle categoria change
    const handleCategoriaChange = (categoria: string) => {
        onChange({
            ...value,
            categoria,
        });
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Registration Number and UF Row */}
            <div className="grid grid-cols-3 gap-3">
                {/* Numero Input */}
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="registro-numero">
                        Numero do {conselhoSigla}
                    </Label>
                    <Input
                        id="registro-numero"
                        type="text"
                        inputMode="numeric"
                        placeholder={`Ex: 123456`}
                        value={value.numero}
                        onChange={handleNumeroChange}
                        disabled={disabled}
                        className={cn(errors?.numero && 'border-destructive')}
                    />
                    {errors?.numero && (
                        <p className="text-sm text-destructive">{errors.numero}</p>
                    )}
                </div>

                {/* UF Select */}
                <div className="space-y-2">
                    <Label htmlFor="registro-uf">UF</Label>
                    <Select
                        value={value.uf}
                        onValueChange={handleUfChange}
                        disabled={disabled}
                    >
                        <SelectTrigger
                            id="registro-uf"
                            className={cn(errors?.uf && 'border-destructive')}
                        >
                            <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                            {VALID_UFS.map((uf) => (
                                <SelectItem key={uf} value={uf}>
                                    {uf}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors?.uf && (
                        <p className="text-sm text-destructive">{errors.uf}</p>
                    )}
                </div>
            </div>

            {/* Categoria Select (conditional) */}
            {requerCategoria && categoriasDisponiveis.length > 0 && (
                <div className="space-y-2">
                    <Label htmlFor="registro-categoria">Categoria</Label>
                    <Select
                        value={value.categoria || ''}
                        onValueChange={handleCategoriaChange}
                        disabled={disabled}
                    >
                        <SelectTrigger
                            id="registro-categoria"
                            className={cn(errors?.categoria && 'border-destructive')}
                        >
                            <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {categoriasDisponiveis.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors?.categoria && (
                        <p className="text-sm text-destructive">{errors.categoria}</p>
                    )}
                </div>
            )}
        </div>
    );
}
