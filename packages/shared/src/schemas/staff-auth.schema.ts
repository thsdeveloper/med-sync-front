import { z } from 'zod';
import { crmSchema, normalizeCRM } from './crm.schema';

// Schema for CRM lookup
export const crmLookupSchema = z.object({
    crm: crmSchema,
});

export type CrmLookupData = z.infer<typeof crmLookupSchema>;

// Schema for doctor login
export const staffLoginSchema = z.object({
    crm: z
        .string()
        .min(1, 'CRM é obrigatório')
        .transform(normalizeCRM),
    password: z
        .string()
        .min(1, 'Senha é obrigatória')
        .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type StaffLoginData = z.infer<typeof staffLoginSchema>;

// Schema for new doctor registration (CRM not in database)
export const staffRegisterSchema = z.object({
    name: z
        .string()
        .min(1, 'Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome muito longo'),
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
    phone: z
        .string()
        .optional()
        .or(z.literal('')),
    crm: crmSchema,
    specialty: z
        .string()
        .optional()
        .or(z.literal('')),
    password: z
        .string()
        .min(1, 'Senha é obrigatória')
        .min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z
        .string()
        .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

export type StaffRegisterData = z.infer<typeof staffRegisterSchema>;

// Schema for setting up password for existing CRM
export const staffSetupPasswordSchema = z.object({
    crm: z
        .string()
        .min(1, 'CRM é obrigatório')
        .transform(normalizeCRM),
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
    password: z
        .string()
        .min(1, 'Senha é obrigatória')
        .min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z
        .string()
        .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

export type StaffSetupPasswordData = z.infer<typeof staffSetupPasswordSchema>;

// CRM lookup result type
export type CrmLookupResult = {
    found: boolean;
    hasAuth: boolean;
    staff?: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        crm: string;
        specialty?: string | null;
        role: string;
    };
};
