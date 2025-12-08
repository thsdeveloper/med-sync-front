import { z } from 'zod';

export const ROLES = ['Médico', 'Enfermeiro', 'Técnico', 'Administrativo', 'Outro'] as const;

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
    crm: z
        .string()
        .optional()
        .or(z.literal('')),
    specialty: z
        .string()
        .optional()
        .or(z.literal('')),
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
    organization_id?: string | null; // DEPRECATED: usar staff_organizations
    created_at: string;
    updated_at: string;
};

// Tipo do vínculo entre profissional e organização
export type StaffOrganization = {
    id: string;
    staff_id: string;
    organization_id: string;
    active: boolean;
    created_at: string;
};

// Tipo combinado para listagem (profissional + dados do vínculo)
export type MedicalStaffWithOrganization = MedicalStaff & {
    staff_organization?: StaffOrganization;
    organization_count?: number; // Quantidade de organizações vinculadas
};

// Schema para busca de profissional por CRM
export const searchStaffByCrmSchema = z.object({
    crm: z
        .string()
        .min(1, 'CRM é obrigatório para busca')
        .min(3, 'CRM deve ter no mínimo 3 caracteres'),
});

export type SearchStaffByCrmData = z.infer<typeof searchStaffByCrmSchema>;
