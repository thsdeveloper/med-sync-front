import React, { useEffect, useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';
import { CheckCircle, XCircle, Eye, EyeOff } from '@deemlol/next-icons';

interface PasswordStrength {
    strength: number;
    label: string;
    color: string;
}

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'type'> {
    label: string;
    icon?: React.ReactNode;
    error?: string;
    isValid?: boolean;
    isTouched?: boolean;
    required?: boolean;
    showStrengthIndicator?: boolean;
    register?: UseFormRegisterReturn;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
        { label: 'Muito fraca', color: 'bg-red-500' },
        { label: 'Fraca', color: 'bg-orange-500' },
        { label: 'Média', color: 'bg-yellow-500' },
        { label: 'Forte', color: 'bg-blue-500' },
        { label: 'Muito forte', color: 'bg-green-500' },
    ];

    return { strength, ...levels[Math.min(strength - 1, 4)] };
};

export const PasswordField: React.FC<PasswordFieldProps> = ({
    label,
    icon,
    error,
    isValid = false,
    isTouched = false,
    required = false,
    showStrengthIndicator = true,
    value,
    register,
    onChange,
    onBlur,
    id,
    name,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState<string>((value as string) || '');

    useEffect(() => {
        if (typeof value !== 'undefined') {
            setInternalValue(value as string);
        }
    }, [value]);

    const hasError = isTouched && !!error;
    const resolvedValue = typeof value !== 'undefined' ? value : internalValue;
    const fieldValue =
        typeof resolvedValue === 'string'
            ? resolvedValue
            : Array.isArray(resolvedValue)
                ? resolvedValue.join('')
                : resolvedValue?.toString() || '';
    const showValid = Boolean(isTouched && !error && isValid && fieldValue);
    const passwordStrength = getPasswordStrength(fieldValue || '');
    const fieldName = register?.name || name;
    const fieldId = id || fieldName;

    return (
        <div>
            <Label htmlFor={fieldId} required={required}>
                {label}
            </Label>
            <Input
                id={fieldId}
                type={showPassword ? 'text' : 'password'}
                hasError={hasError}
                isValid={showValid}
                icon={icon}
                rightIcon={
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                }
                {...register}
                {...props}
                onChange={(e) => {
                    setInternalValue(e.target.value);
                    register?.onChange?.(e);
                    onChange?.(e);
                }}
                onBlur={(e) => {
                    register?.onBlur?.(e);
                    onBlur?.(e);
                }}
            />
            {showStrengthIndicator && fieldValue && (
                <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all ${
                                    level <= passwordStrength.strength
                                        ? passwordStrength.color
                                        : 'bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                    {passwordStrength.label && (
                        <p className="text-xs text-slate-500">{passwordStrength.label}</p>
                    )}
                </div>
            )}
            {hasError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    );
};

