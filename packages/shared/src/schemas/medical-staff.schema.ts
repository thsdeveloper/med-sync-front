import { z } from 'zod';
import { crmOptionalSchema } from './crm.schema';

export const ROLES = ['Médico', 'Enfermeiro', 'Técnico', 'Administrativo', 'Outro'] as const;

// Especialidade type and schema (database record)
export const especialidadeSchema = z.object({
    id: z.string().uuid('ID da especialidade deve ser um UUID válido'),
    nome: z.string().min(1, 'Nome da especialidade é obrigatório'),
    created_at: z.string().optional(),
});

export type Especialidade = z.infer<typeof especialidadeSchema>;

// Form schema - usado para criar/editar profissionais
// Note: specialty field is kept for backward compatibility but deprecated
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
    crm: crmOptionalSchema,
    // Foreign key to especialidades table (REQUIRED)
    especialidade_id: z
        .string()
        .uuid('ID da especialidade deve ser um UUID válido')
        .min(1, 'Especialidade é obrigatória'),
    role: z
        .enum(ROLES),
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
    // This is populated when querying with .select('*, especialidade:especialidades(*)')
    especialidade?: Especialidade | null;
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

export const searchStaffByCrmSchema = z.object({
    crm: z
        .string()
        .min(1, 'CRM é obrigatório para busca')
        .min(3, 'CRM deve ter no mínimo 3 caracteres')
        .transform((value) => value.trim().toUpperCase()),
});

export type SearchStaffByCrmData = z.infer<typeof searchStaffByCrmSchema>;
