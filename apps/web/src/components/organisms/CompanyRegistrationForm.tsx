'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, ArrowLeft } from '@deemlol/next-icons';
import { useToastMessage } from '@/hooks/useToastMessage';

// Schema
import { companyRegistrationSchema, type CompanyRegistrationFormData } from '@medsync/shared';

// Atoms
import { ProgressBar } from '../atoms/ProgressBar';

// Steps
import { Step1User } from './company-registration/Step1User';
import { Step2Company } from './company-registration/Step2Company';

export const CompanyRegistrationForm: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const { notifyError, notifySuccess } = useToastMessage();

    const methods = useForm<CompanyRegistrationFormData>({
        resolver: zodResolver(companyRegistrationSchema),
        mode: 'onBlur',
        defaultValues: {
            fullName: '',
            personalPhone: '',
            email: '',
            password: '',
            companyName: '',
            cnpj: '',
            address: '',
            phone: '',
        }
    });

    const { handleSubmit, trigger } = methods;

    const onSubmit = async (data: CompanyRegistrationFormData) => {
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
                        full_name: data.fullName,
                        phone: data.personalPhone,
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
            notifySuccess('Cadastro realizado com sucesso!', {
                description: 'Verifique seu e-mail para confirmar a conta. Redirecionando...',
            });
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: unknown) {
            console.error('Registration error:', err);
            const message = err instanceof Error ? err.message : 'Ocorreu um erro durante o cadastro.';
            notifyError('Erro no cadastro', {
                description: message,
            });
        } finally {
            setLoading(false);
        }
    };

    const nextStep = async () => {
        const fieldsStep1: (keyof CompanyRegistrationFormData)[] = ['fullName', 'personalPhone', 'email', 'password'];
        const isValid = await trigger(fieldsStep1);
        
        if (isValid) {
            setCurrentStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStepLabel = () => {
        return currentStep === 1 ? 'Dados do Responsável' : 'Dados da Empresa';
    };

    return (
        <FormProvider {...methods}>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Progress Indicator */}
                <ProgressBar
                    current={currentStep}
                    total={2}
                    labels={{
                        current: `Passo ${currentStep} de 2`,
                        step: getStepLabel()
                    }}
                />

                {/* Step Content */}
                <div className="mt-8">
                    {currentStep === 1 && <Step1User />}
                    {currentStep === 2 && <Step2Company />}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-6 flex gap-4 justify-between">
                    {currentStep === 2 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={loading || success}
                            className="flex items-center justify-center gap-2 py-3 px-6 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </button>
                    )}

                    {currentStep === 1 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="w-full md:w-auto md:ml-auto flex items-center justify-center gap-2 py-3 px-8 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md hover:shadow-lg"
                        >
                            Próximo
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="flex-1 md:flex-none md:w-auto flex justify-center items-center gap-2 py-3 px-8 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-400 hover:from-blue-700 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                                'Finalizar Cadastro'
                            )}
                        </button>
                    )}
                </div>
            </form>
        </FormProvider>
    );
};
