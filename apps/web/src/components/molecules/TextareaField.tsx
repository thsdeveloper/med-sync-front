import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Label } from '../atoms/Label';
import { Textarea } from '../atoms/Textarea';
import { XCircle } from '@deemlol/next-icons';

interface TextareaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'onBlur'> {
    label: string | React.ReactNode;
    icon?: React.ReactNode;
    error?: string;
    isTouched?: boolean;
    required?: boolean;
    register?: UseFormRegisterReturn;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
    label,
    icon,
    error,
    isTouched = false,
    required = false,
    id,
    name,
    register,
    onChange,
    onBlur,
    ...props
}) => {
    const hasError = isTouched && !!error;
    const fieldName = register?.name || name;
    const fieldId = id || fieldName;

    return (
        <div>
            <Label htmlFor={fieldId} required={required}>
                {label}
            </Label>
            <Textarea
                id={fieldId}
                icon={icon}
                {...register}
                {...props}
                onChange={(e) => {
                    register?.onChange(e);
                    onChange?.(e);
                }}
                onBlur={(e) => {
                    register?.onBlur(e);
                    onBlur?.(e);
                }}
            />
            {hasError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    );
};

