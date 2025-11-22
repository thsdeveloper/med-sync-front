import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Briefcase, FileText, Phone, MapPin } from '@deemlol/next-icons';
import { CompanyRegistrationFormData } from '@/schemas/companyRegistration.schema';
import { InputField } from '@/components/molecules/InputField';
import { TextareaField } from '@/components/molecules/TextareaField';
import { FormSection } from '@/components/molecules/FormSection';

export const Step2Company: React.FC = () => {
    const {
        register,
        formState: { errors, touchedFields },
        watch,
        setValue
    } = useFormContext<CompanyRegistrationFormData>();

    const watchedValues = watch();

    const isFieldValid = (fieldName: keyof CompanyRegistrationFormData): boolean => {
        return !!(touchedFields[fieldName] && !errors[fieldName] && watchedValues[fieldName]);
    };

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length <= 14) {
            const masked = cleanValue
                .replace(/\D/g, '')
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2');
            setValue('cnpj', masked, { shouldValidate: true });
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length <= 11) {
            const masked = cleanValue
                .replace(/\D/g, '')
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4,5})(\d{4})$/, '$1-$2');
            setValue('phone', masked, { shouldValidate: true });
        }
    };

    return (
        <FormSection
            title="Dados da Empresa"
            description="Informações da sua clínica ou hospital"
            icon={<Briefcase className="w-5 h-5" />}
        >
            <InputField
                label="Nome da Empresa"
                icon={<Briefcase className="h-5 w-5 text-slate-400" />}
                placeholder="Ex: Hospital São Paulo"
                type="text"
                required
                register={register('companyName')}
                error={errors.companyName?.message}
                isValid={isFieldValid('companyName')}
                isTouched={!!touchedFields.companyName}
            />

            <InputField
                label="CNPJ"
                icon={<FileText className="h-5 w-5 text-slate-400" />}
                placeholder="00.000.000/0000-00"
                type="text"
                required
                maxLength={18}
                register={register('cnpj', {
                    onChange: handleCnpjChange
                })}
                error={errors.cnpj?.message}
                isValid={isFieldValid('cnpj')}
                isTouched={!!touchedFields.cnpj}
            />

            <InputField
                label={
                    <>
                        Telefone da Empresa <span className="text-slate-400 font-normal">(opcional)</span>
                    </>
                }
                icon={<Phone className="h-5 w-5 text-slate-400" />}
                placeholder="(00) 00000-0000"
                type="text"
                maxLength={15}
                register={register('phone', {
                    onChange: handlePhoneChange
                })}
                error={errors.phone?.message}
                isValid={watchedValues.phone ? isFieldValid('phone') : false}
                isTouched={!!touchedFields.phone}
            />

            <TextareaField
                label={
                    <>
                        Endereço <span className="text-slate-400 font-normal">(opcional)</span>
                    </>
                }
                icon={<MapPin className="h-5 w-5 text-slate-400" />}
                placeholder="Rua, número, bairro, cidade - UF"
                rows={3}
                register={register('address')}
                error={errors.address?.message}
                isTouched={!!touchedFields.address}
            />
        </FormSection>
    );
};

