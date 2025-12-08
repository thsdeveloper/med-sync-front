import React, { useState, useCallback } from 'react';
import { UseFormRegisterReturn, UseFormSetValue, FieldValues, Path } from 'react-hook-form';
import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';
import { CheckCircle, XCircle } from '@deemlol/next-icons';
import { normalizeCRM, validateCRM, CRM_ERROR_MESSAGE } from '@medsync/shared';

interface CRMInputProps<T extends FieldValues = FieldValues>
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
    label?: string | React.ReactNode;
    error?: string;
    isValid?: boolean;
    isTouched?: boolean;
    required?: boolean;
    register?: UseFormRegisterReturn;
    setValue?: UseFormSetValue<T>;
    fieldName?: Path<T>;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onValidationChange?: (isValid: boolean, normalizedValue: string) => void;
}

export function CRMInput<T extends FieldValues = FieldValues>({
    label = 'CRM',
    error: externalError,
    isValid: externalIsValid,
    isTouched: externalIsTouched = false,
    required = false,
    id,
    name,
    register,
    setValue,
    fieldName,
    onChange,
    onBlur,
    onValidationChange,
    ...props
}: CRMInputProps<T>) {
    const [localError, setLocalError] = useState<string | undefined>();
    const [isTouched, setIsTouched] = useState(externalIsTouched);
    const [isLocalValid, setIsLocalValid] = useState(false);

    const fieldNameValue = register?.name || name || fieldName;
    const fieldId = id || fieldNameValue;

    // Determina o erro a ser exibido (externo tem prioridade)
    const displayError = externalError || localError;
    const hasError = isTouched && !!displayError;
    const showValid = isTouched && !displayError && (externalIsValid ?? isLocalValid) && !!props.value;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = normalizeCRM(e.target.value);

        // Atualiza o valor normalizado
        if (setValue && fieldName) {
            setValue(fieldName, normalized as any, { shouldValidate: true });
        }

        // Limpa erro enquanto digita
        setLocalError(undefined);

        // Chama handlers externos
        register?.onChange(e);
        onChange?.(e);
    }, [setValue, fieldName, register, onChange]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        setIsTouched(true);

        const value = e.target.value;

        if (value) {
            const validation = validateCRM(value);

            if (!validation.isValid) {
                setLocalError(validation.error);
                setIsLocalValid(false);
            } else {
                setLocalError(undefined);
                setIsLocalValid(true);

                // Atualiza com valor normalizado
                if (setValue && fieldName) {
                    setValue(fieldName, validation.normalized as any, { shouldValidate: true });
                }
            }

            onValidationChange?.(validation.isValid, validation.normalized);
        } else if (required) {
            setLocalError('CRM é obrigatório');
            setIsLocalValid(false);
            onValidationChange?.(false, '');
        } else {
            setLocalError(undefined);
            setIsLocalValid(true);
            onValidationChange?.(true, '');
        }

        // Chama handlers externos
        register?.onBlur(e);
        onBlur?.(e);
    }, [required, setValue, fieldName, register, onBlur, onValidationChange]);

    return (
        <div>
            <Label htmlFor={fieldId} required={required}>
                {label}
            </Label>
            <Input
                id={fieldId}
                hasError={hasError}
                isValid={showValid}
                placeholder="1234/DF"
                rightIcon={showValid ? <CheckCircle className="h-5 w-5 text-green-500" /> : undefined}
                {...register}
                {...props}
                onChange={handleChange}
                onBlur={handleBlur}
            />
            {hasError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {displayError}
                </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
                Formato: número/UF (ex: 1234/SP)
            </p>
        </div>
    );
}

export default CRMInput;
