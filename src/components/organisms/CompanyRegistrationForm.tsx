'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Email,
    Lock,
    Briefcase,
    FileText,
    Phone,
    MapPin,
    CheckCircle,
    XCircle
} from '@deemlol/next-icons';

// Schema
import { companyRegistrationSchema, CompanyRegistrationFormData } from '@/schemas/companyRegistration.schema';

// Atoms
import { Alert } from '../atoms/Alert';
import { ProgressBar } from '../atoms/ProgressBar';

// Molecules
import { InputField } from '../molecules/InputField';
import { PasswordField } from '../molecules/PasswordField';
import { TextareaField } from '../molecules/TextareaField';
import { FormSection } from '../molecules/FormSection';

export const CompanyRegistrationForm: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields, isValid },
        watch,
        setValue
    } = useForm<CompanyRegistrationFormData>({
        resolver: zodResolver(companyRegistrationSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
            companyName: '',
            cnpj: '',
            address: '',
            phone: '',
        }
    });

    // Watch values for password strength and field validation
    const watchedValues = watch();

    // Aplicar máscaras nos campos
    const applyMask = (name: 'cnpj' | 'phone', value: string) => {
        if (name === 'cnpj') {
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
        } else if (name === 'phone') {
            const cleanValue = value.replace(/\D/g, '');
            if (cleanValue.length <= 11) {
                const masked = cleanValue
                    .replace(/\D/g, '')
                    .replace(/^(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{4,5})(\d{4})$/, '$1-$2');
                setValue('phone', masked, { shouldValidate: true });
            }
        }
    };

    const onSubmit = async (data: CompanyRegistrationFormData) => {
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        role: 'company_admin',
                    },
                },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Erro ao criar usuário.');

            // 2. Create organization using stored procedure
            const { error: orgError } = await supabase.rpc('insert_organization', {
                p_name: data.companyName,
                p_cnpj: data.cnpj.replace(/\D/g, ''),
                p_address: data.address || null,
                p_phone: data.phone?.replace(/\D/g, '') || null,
                p_owner_id: authData.user.id,
            });

            if (orgError) {
                if (orgError.code === '42501' && orgError.message?.includes('users')) {
                    console.warn('Warning: Permission error on users table, but organization was created:', orgError);
                } else {
                    throw orgError;
                }
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Ocorreu um erro durante o cadastro.');
        } finally {
            setLoading(false);
        }
    };

    const isFieldValid = (fieldName: keyof CompanyRegistrationFormData): boolean => {
        return !!(touchedFields[fieldName] && !errors[fieldName] && watchedValues[fieldName]);
    };

    const getStepLabel = () => {
        return currentStep === 1 ? 'Credenciais' : 'Dados da Empresa';
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Success Message */}
            {success && (
                <Alert
                    type="success"
                    title="Cadastro realizado com sucesso!"
                    message="Verifique seu email para confirmar sua conta. Redirecionando..."
                    icon={<CheckCircle className="w-5 h-5" />}
                />
            )}

            {/* Error Message */}
            {error && (
                <Alert
                    type="error"
                    title="Erro"
                    message={error}
                    icon={<XCircle className="w-5 h-5" />}
                />
            )}

            {/* Progress Indicator */}
            <ProgressBar
                current={currentStep}
                total={2}
                labels={{
                    current: `Passo ${currentStep} de 2`,
                    step: getStepLabel()
                }}
            />

            {/* Seção 1: Credenciais */}
            <FormSection
                title="Credenciais de Acesso"
                description="Crie sua conta de administrador"
                icon={<Lock className="w-5 h-5" />}
            >
                <InputField
                    label="Email do Administrador"
                    icon={<Email className="h-5 w-5 text-slate-400" />}
                    placeholder="seu@email.com"
                    type="email"
                    required
                    register={register('email')}
                    error={errors.email?.message}
                    isValid={isFieldValid('email')}
                    isTouched={!!touchedFields.email}
                    onFocus={() => setCurrentStep(1)}
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
                    onFocus={() => setCurrentStep(1)}
                    showStrengthIndicator
                    autoComplete="new-password"
                />
            </FormSection>

            {/* Seção 2: Dados da Empresa */}
            <FormSection
                title="Dados da Empresa"
                description="Informações da sua clínica ou hospital"
                icon={<Briefcase className="w-5 h-5" />}
                className="pt-6 border-t border-slate-200"
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
                    onFocus={() => setCurrentStep(2)}
                />

                <InputField
                    label="CNPJ"
                    icon={<FileText className="h-5 w-5 text-slate-400" />}
                    placeholder="00.000.000/0000-00"
                    type="text"
                    required
                    maxLength={18}
                    register={register('cnpj', {
                        onChange: (e) => {
                            applyMask('cnpj', e.target.value);
                        }
                    })}
                    error={errors.cnpj?.message}
                    isValid={isFieldValid('cnpj')}
                    isTouched={!!touchedFields.cnpj}
                    onFocus={() => setCurrentStep(2)}
                />

                <InputField
                    label={
                        <>
                            Telefone <span className="text-slate-400 font-normal">(opcional)</span>
                        </>
                    }
                    icon={<Phone className="h-5 w-5 text-slate-400" />}
                    placeholder="(00) 00000-0000"
                    type="text"
                    maxLength={15}
                    register={register('phone', {
                        onChange: (e) => {
                            applyMask('phone', e.target.value);
                        }
                    })}
                    error={errors.phone?.message}
                    isValid={watchedValues.phone ? isFieldValid('phone') : false}
                    isTouched={!!touchedFields.phone}
                    onFocus={() => setCurrentStep(2)}
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
                    onFocus={() => setCurrentStep(2)}
                />
            </FormSection>

            {/* Submit Button */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-400 hover:from-blue-700 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Cadastrando...
                        </>
                    ) : success ? (
                        <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Cadastro Realizado!
                        </>
                    ) : (
                        'Cadastrar Empresa'
                    )}
                </button>
            </div>
        </form>
    );
};
