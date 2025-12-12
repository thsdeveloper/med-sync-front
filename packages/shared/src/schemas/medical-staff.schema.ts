import { z } from 'zod';
import { crmOptionalSchema } from './crm.schema';

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
    crm: crmOptionalSchema,
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

export type MedicalStaff = MedicalStaffFormData & {
    id: string;
    organization_id?: string | null;
    user_id?: string | null;
    auth_email?: string | null;
    avatar_url?: string | null;
    created_at: string;
    updated_at: string;
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
