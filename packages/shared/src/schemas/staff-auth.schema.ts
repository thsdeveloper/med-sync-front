import { z } from 'zod';
import { crmSchema, normalizeCRM } from './crm.schema';
import { cpfSchema, normalizeCpf } from './cpf.schema';
import {
    VALID_UFS,
    CONSELHOS,
    normalizeRegistroNumero,
} from './registro-profissional.schema';

// ============================================================================
// Schemas Legados (deprecated - mantidos para backward compatibility)
// ============================================================================

/**
 * @deprecated Use registroLookupSchema
 */
export const crmLookupSchema = z.object({
    crm: crmSchema,
});

export type CrmLookupData = z.infer<typeof crmLookupSchema>;

/**
 * @deprecated Use staffLoginWithRegistroSchema
 */
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

/**
 * @deprecated Use staffRegisterWithRegistroSchema
 */
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
    /** @deprecated Use especialidade_id */
    specialty: z
        .string()
        .optional()
        .or(z.literal('')),
    especialidade_id: z
        .string()
        .uuid('ID da especialidade deve ser um UUID válido')
        .min(1, 'Especialidade é obrigatória'),
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

/**
 * @deprecated Use staffSetupPasswordWithRegistroSchema
 */
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

/**
 * @deprecated Use RegistroLookupResult
 */
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
        especialidade_id?: string | null;
        role: string;
    };
};

// ============================================================================
// Novos Schemas para Registro Profissional Genérico
// ============================================================================

/**
 * Schema para lookup de profissional por registro
 */
export const registroLookupSchema = z.object({
    conselho: z.enum(CONSELHOS, { message: 'Selecione um conselho válido' }),
    numero: z
        .string()
        .min(1, 'Número do registro é obrigatório')
        .transform(normalizeRegistroNumero),
    uf: z.enum(VALID_UFS, { message: 'Selecione uma UF válida' }),
});

export type RegistroLookupData = z.infer<typeof registroLookupSchema>;

/**
 * Schema para login com registro profissional
 */
export const staffLoginWithRegistroSchema = z.object({
    conselho: z.enum(CONSELHOS, { message: 'Selecione um conselho válido' }),
    numero: z
        .string()
        .min(1, 'Número do registro é obrigatório')
        .transform(normalizeRegistroNumero),
    uf: z.enum(VALID_UFS, { message: 'Selecione uma UF válida' }),
    password: z
        .string()
        .min(1, 'Senha é obrigatória')
        .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type StaffLoginWithRegistroData = z.infer<typeof staffLoginWithRegistroSchema>;

/**
 * Schema para registro de novo profissional
 */
export const staffRegisterWithRegistroSchema = z.object({
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
    // Registro profissional
    profissao_id: z
        .string()
        .uuid('Selecione uma profissão válida')
        .min(1, 'Profissão é obrigatória'),
    registro_numero: z
        .string()
        .min(1, 'Número do registro é obrigatório')
        .regex(/^\d+$/, 'Número do registro deve conter apenas dígitos'),
    registro_uf: z.enum(VALID_UFS, { message: 'Selecione uma UF válida' }),
    registro_categoria: z
        .string()
        .optional()
        .nullable(),
    // Especialidade
    especialidade_id: z
        .string()
        .uuid('ID da especialidade deve ser um UUID válido')
        .min(1, 'Especialidade é obrigatória'),
    // Senha
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

export type StaffRegisterWithRegistroData = z.infer<typeof staffRegisterWithRegistroSchema>;

/**
 * Schema para setup de senha para profissional existente
 */
export const staffSetupPasswordWithRegistroSchema = z.object({
    registro_numero: z
        .string()
        .min(1, 'Número do registro é obrigatório'),
    registro_uf: z.enum(VALID_UFS, { message: 'UF inválida' }),
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

export type StaffSetupPasswordWithRegistroData = z.infer<typeof staffSetupPasswordWithRegistroSchema>;

/**
 * Tipo do resultado do lookup por registro
 */
export type RegistroLookupResult = {
    found: boolean;
    hasAuth: boolean;
    staff?: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        profissao_id: string;
        registro_numero: string;
        registro_uf: string;
        registro_categoria?: string | null;
        especialidade_id?: string | null;
        // Dados do conselho (de JOIN)
        profissao?: {
            id: string;
            nome: string;
            conselho?: {
                id: string;
                sigla: string;
                nome_completo: string;
            };
        };
    };
};

// ============================================================================
// Schemas para Autenticação por CPF
// ============================================================================

/**
 * Schema para lookup de profissional por CPF
 */
export const cpfLookupSchema = z.object({
    cpf: cpfSchema,
});

export type CpfLookupData = z.infer<typeof cpfLookupSchema>;

/**
 * Schema para login com CPF
 */
export const staffLoginWithCpfSchema = z.object({
    cpf: cpfSchema,
    password: z
        .string()
        .min(1, 'Senha é obrigatória')
        .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type StaffLoginWithCpfData = z.infer<typeof staffLoginWithCpfSchema>;

/**
 * Schema para registro de novo profissional (com CPF como identificador principal)
 */
export const staffRegisterWithCpfSchema = z.object({
    // CPF - identificador principal
    cpf: cpfSchema,
    // Dados pessoais
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
    // Registro profissional (ainda coletado)
    profissao_id: z
        .string()
        .uuid('Selecione uma profissão válida')
        .min(1, 'Profissão é obrigatória'),
    registro_numero: z
        .string()
        .min(1, 'Número do registro é obrigatório')
        .regex(/^\d+$/, 'Número do registro deve conter apenas dígitos'),
    registro_uf: z.enum(VALID_UFS, { message: 'Selecione uma UF válida' }),
    registro_categoria: z
        .string()
        .optional()
        .nullable(),
    // Especialidade
    especialidade_id: z
        .string()
        .uuid('ID da especialidade deve ser um UUID válido')
        .min(1, 'Especialidade é obrigatória'),
    // Senha
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

export type StaffRegisterWithCpfData = z.infer<typeof staffRegisterWithCpfSchema>;

/**
 * Schema para setup de senha para profissional existente (identificado por CPF)
 */
export const staffSetupPasswordWithCpfSchema = z.object({
    cpf: cpfSchema,
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

export type StaffSetupPasswordWithCpfData = z.infer<typeof staffSetupPasswordWithCpfSchema>;

/**
 * Tipo do resultado do lookup por CPF
 */
export type CpfLookupResult = {
    found: boolean;
    hasAuth: boolean;
    staff?: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        cpf: string;
        profissao_id?: string | null;
        registro_numero?: string | null;
        registro_uf?: string | null;
        registro_categoria?: string | null;
        especialidade_id?: string | null;
        // Dados do conselho (de JOIN)
        profissao?: {
            id: string;
            nome: string;
            conselho?: {
                id: string;
                sigla: string;
                nome_completo: string;
            };
        };
    };
};
