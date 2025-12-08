import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Email, Lock, Phone, User } from '@deemlol/next-icons';
import { CompanyRegistrationFormData } from '@medsync/shared';
import { InputField } from '@/components/molecules/InputField';
import { PasswordField } from '@/components/molecules/PasswordField';
import { FormSection } from '@/components/molecules/FormSection';

export const Step1User: React.FC = () => {
    const {
        register,
        formState: { errors, touchedFields },
        watch,
        setValue,
        trigger
    } = useFormContext<CompanyRegistrationFormData>();

    const watchedValues = watch();

    const isFieldValid = (fieldName: keyof CompanyRegistrationFormData): boolean => {
        return !!(touchedFields[fieldName] && !errors[fieldName] && watchedValues[fieldName]);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length <= 11) {
            const masked = cleanValue
                .replace(/\D/g, '')
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4,5})(\d{4})$/, '$1-$2');
            setValue('personalPhone', masked, { shouldValidate: true });
        }
    };

    return (
        <FormSection
            title="Dados do Responsável"
            description="Informe seus dados pessoais para criar o acesso administrativo"
            icon={<User className="w-5 h-5" />}
        >
            <InputField
                label="Nome Completo"
                icon={<User className="h-5 w-5 text-slate-400" />}
                placeholder="Ex: João da Silva"
                type="text"
                required
                register={register('fullName')}
                error={errors.fullName?.message}
                isValid={isFieldValid('fullName')}
                isTouched={!!touchedFields.fullName}
            />

            <InputField
                label="Telefone Pessoal (WhatsApp)"
                icon={<Phone className="h-5 w-5 text-slate-400" />}
                placeholder="(00) 00000-0000"
                type="text"
                maxLength={15}
                required
                register={register('personalPhone', {
                    onChange: handlePhoneChange
                })}
                error={errors.personalPhone?.message}
                isValid={isFieldValid('personalPhone')}
                isTouched={!!touchedFields.personalPhone}
            />

            <InputField
                label="Email Corporativo"
                icon={<Email className="h-5 w-5 text-slate-400" />}
                placeholder="seu@email.com"
                type="email"
                required
                register={register('email')}
                error={errors.email?.message}
                isValid={isFieldValid('email')}
                isTouched={!!touchedFields.email}
                autoComplete="email"
            />

            <PasswordField
                label="Senha"
                icon={<Lock className="h-5 w-5 text-slate-400" />}
                placeholder="Mínimo 6 caracteres"
                required
                register={register('password')}
                error={errors.password?.message}
                isValid={isFieldValid('password')}
                isTouched={!!touchedFields.password}
                showStrengthIndicator
                autoComplete="new-password"
            />
        </FormSection>
    );
};

