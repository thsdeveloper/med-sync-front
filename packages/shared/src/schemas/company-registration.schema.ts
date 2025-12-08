import { z } from 'zod';

const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
};

const validatePhone = (phone: string): boolean => {
    if (!phone || phone === '') return true;
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
};

export const companyRegistrationSchema = z.object({
    fullName: z
        .string()
        .min(1, 'Nome completo é obrigatório')
        .min(3, 'Nome completo deve ter no mínimo 3 caracteres')
        .max(100, 'Nome completo muito longo'),
    personalPhone: z
        .string()
        .min(1, 'Telefone pessoal é obrigatório')
        .refine((val) => {
            const cleanPhone = val.replace(/\D/g, '');
            return cleanPhone.length >= 10;
        }, {
            message: 'Telefone pessoal inválido'
        }),
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
    password: z
        .string()
        .min(6, 'Senha deve ter no mínimo 6 caracteres')
        .max(100, 'Senha muito longa'),
    companyName: z
        .string()
        .min(1, 'Nome da empresa é obrigatório')
        .min(3, 'Nome da empresa deve ter no mínimo 3 caracteres')
        .max(100, 'Nome da empresa muito longo'),
    cnpj: z
        .string()
        .min(1, 'CNPJ é obrigatório')
        .refine(validateCNPJ, {
            message: 'CNPJ deve ter 14 dígitos'
        }),
    phone: z
        .string()
        .refine((val) => {
            if (!val || val === '') return true;
            if (val.length > 15) return false;
            return validatePhone(val);
        }, {
            message: 'Telefone inválido'
        })
        .optional(),
    address: z
        .string()
        .refine((val) => {
            if (!val || val === '') return true;
            return val.length <= 500;
        }, {
            message: 'Endereço muito longo'
        })
        .optional()
});

export type CompanyRegistrationFormData = z.infer<typeof companyRegistrationSchema>;
