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
        .min(1, 'Cor é obrigatória'), // Removido .default() para evitar conflito de tipos no form
    active: z
        .boolean(), // Removido .default()
});

export type MedicalStaffFormData = z.infer<typeof medicalStaffSchema>;

export type MedicalStaff = MedicalStaffFormData & {
    id: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
};
