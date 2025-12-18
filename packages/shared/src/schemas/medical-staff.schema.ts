import { z } from 'zod';
import { crmOptionalSchema } from './crm.schema';
import {
    VALID_UFS,
    type Profissao,
    type ProfissaoComConselho,
} from './registro-profissional.schema';
import { normalizeCpf, isValidCpfChecksum } from './cpf.schema';

// Especialidade type and schema (database record)
export const especialidadeSchema = z.object({
    id: z.string().uuid('ID da especialidade deve ser um UUID válido'),
    nome: z.string().min(1, 'Nome da especialidade é obrigatório'),
    created_at: z.string().optional(),
});

export type Especialidade = z.infer<typeof especialidadeSchema>;

// Form schema - usado para criar/editar profissionais
export const medicalStaffSchema = z.object({
    name: z
        .string()
        .min(1, 'Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome muito longo'),
    email: z
        .string()
        .email('Email inválido')
        .optional()
        .or(z.literal('')),
    phone: z
        .string()
        .optional()
        .or(z.literal('')),

    // ========================================================================
    // CPF - Cadastro de Pessoa Física (opcional, normalizado para 11 dígitos)
    // ========================================================================
    cpf: z
        .string()
        .optional()
        .or(z.literal(''))
        .refine((val) => !val || normalizeCpf(val).length === 11, {
            message: 'CPF deve ter 11 dígitos',
        })
        .refine((val) => !val || isValidCpfChecksum(normalizeCpf(val)), {
            message: 'CPF inválido',
        }),

    // ========================================================================
    // Novos campos de registro profissional (substituem CRM)
    // ========================================================================
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

    // ========================================================================
    // Campo CRM legado (deprecated - mantido para backward compatibility)
    // ========================================================================
    /** @deprecated Use registro_numero e registro_uf */
    crm: crmOptionalSchema,

    // Foreign key to especialidades table (REQUIRED)
    especialidade_id: z
        .string()
        .uuid('ID da especialidade deve ser um UUID válido')
        .min(1, 'Especialidade é obrigatória'),

    color: z
        .string()
        .min(1, 'Cor é obrigatória'),
    active: z
        .boolean(),
});

export type MedicalStaffFormData = z.infer<typeof medicalStaffSchema>;

// Tipo do profissional no banco (cadastro global)
export type MedicalStaff = MedicalStaffFormData & {
    id: string;
    organization_id?: string | null;
    user_id?: string | null;
    auth_email?: string | null;
    avatar_url?: string | null;
    created_at: string;
    updated_at: string;
    // Nested especialidade object from JOIN query
    especialidade?: Especialidade | null;
    // Nested profissao object from JOIN query
    profissao?: ProfissaoComConselho | null;
};

export type StaffOrganization = {
    id: string;
    staff_id: string;
    organization_id: string;
    active: boolean;
    created_at: string;
};

export type MedicalStaffWithOrganization = MedicalStaff & {
    staff_organization?: StaffOrganization;
    organization_count?: number;
};

/**
 * @deprecated Use searchStaffByRegistroSchema
 */
export const searchStaffByCrmSchema = z.object({
    crm: z
        .string()
        .min(1, 'CRM é obrigatório para busca')
        .min(3, 'CRM deve ter no mínimo 3 caracteres')
        .transform((value) => value.trim().toUpperCase()),
});

export type SearchStaffByCrmData = z.infer<typeof searchStaffByCrmSchema>;

/**
 * Schema para buscar profissional por registro
 */
export const searchStaffByRegistroSchema = z.object({
    registro_numero: z
        .string()
        .min(1, 'Número do registro é obrigatório')
        .transform((value) => value.trim()),
    registro_uf: z
        .string()
        .min(2, 'UF é obrigatória')
        .max(2, 'UF deve ter 2 caracteres')
        .transform((value) => value.trim().toUpperCase()),
});

export type SearchStaffByRegistroData = z.infer<typeof searchStaffByRegistroSchema>;

/**
 * Schema para buscar profissional por CPF
 */
export const searchStaffByCpfSchema = z.object({
    cpf: z
        .string()
        .min(11, 'CPF deve ter 11 dígitos')
        .transform(normalizeCpf),
});

export type SearchStaffByCpfData = z.infer<typeof searchStaffByCpfSchema>;

// Re-export types from registro-profissional for convenience
export type { Profissao, ProfissaoComConselho };
