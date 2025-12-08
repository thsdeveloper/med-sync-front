import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';
import { CheckCircle, XCircle } from '@deemlol/next-icons';

interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
    label: string | React.ReactNode;
    icon?: React.ReactNode;
    error?: string;
    isValid?: boolean;
    isTouched?: boolean;
    required?: boolean;
    register?: UseFormRegisterReturn;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const InputField: React.FC<InputFieldProps> = ({
    label,
    icon,
    error,
    isValid = false,
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
    const showValid = isTouched && !error && isValid && !!props.value;
    const fieldName = register?.name || name;
    const fieldId = id || fieldName;

    return (
        <div>
            <Label htmlFor={fieldId} required={required}>
                {label}
            </Label>
            <Input
                id={fieldId}
                hasError={hasError}
                isValid={showValid}
                icon={icon}
                rightIcon={showValid ? <CheckCircle className="h-5 w-5 text-green-500" /> : undefined}
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

