'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Input } from '../atoms/Input';
import { CheckCircle } from 'lucide-react';
import { normalizeCpf, formatCpf, isValidCpfChecksum } from '@medsync/shared';

interface CpfInputProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
}

export function CpfInput({
    value,
    onChange,
    onBlur,
    error,
    disabled,
    placeholder = '000.000.000-00',
}: CpfInputProps) {
    const [isTouched, setIsTouched] = useState(false);

    // Format the value for display
    const displayValue = useMemo(() => {
        if (!value) return '';
        return formatCpf(value);
    }, [value]);

    // Check if CPF is valid
    const isValid = useMemo(() => {
        const normalized = normalizeCpf(value);
        return normalized.length === 11 && isValidCpfChecksum(normalized);
    }, [value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        // Remove all non-digit characters and limit to 11 digits
        const normalized = normalizeCpf(rawValue).slice(0, 11);
        onChange(normalized);
    }, [onChange]);

    const handleBlur = useCallback(() => {
        setIsTouched(true);
        onBlur?.();
    }, [onBlur]);

    const hasError = isTouched && !!error;
    const showValid = isTouched && !error && isValid && !!value;

    return (
        <div>
            <Input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                hasError={hasError}
                isValid={showValid}
                maxLength={14} // XXX.XXX.XXX-XX
                rightIcon={showValid ? <CheckCircle className="h-5 w-5 text-green-500" /> : undefined}
            />
            {hasError && (
                <p className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

export default CpfInput;
