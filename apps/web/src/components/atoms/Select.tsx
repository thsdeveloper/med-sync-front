import React from 'react';
import type { SelectProps as RadixSelectProps } from '@radix-ui/react-select';

import {
    Select as PrimitiveSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface SelectOption {
    label: React.ReactNode;
    value: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<RadixSelectProps, 'children'> {
    placeholder?: string;
    options?: SelectOption[];
    triggerClassName?: string;
    contentClassName?: string;
    children?: React.ReactNode;
}

export function Select({
    placeholder = 'Selecione...',
    options,
    triggerClassName,
    contentClassName,
    children,
    ...props
}: SelectProps) {
    return (
        <PrimitiveSelect {...props}>
            <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
                {options?.map((option) => (
                    <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </SelectItem>
                ))}
                {children}
            </SelectContent>
        </PrimitiveSelect>
    );
}

Select.displayName = 'Select';

