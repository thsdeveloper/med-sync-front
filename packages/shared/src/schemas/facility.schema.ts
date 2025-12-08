import { z } from 'zod';

export const FACILITY_TYPES = ['clinic', 'hospital'] as const;

export const FACILITY_TYPE_LABELS: Record<typeof FACILITY_TYPES[number], string> = {
    clinic: 'Clínica',
    hospital: 'Hospital',
};

const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

export const facilitySchema = z.object({
    name: z
        .string()
        .min(1, 'Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(150, 'Nome muito longo'),
    type: z
        .enum(FACILITY_TYPES, {
            message: 'Selecione o tipo de unidade',
        }),
    cnpj: z
        .string()
        .optional()
        .refine(
            (val) => !val || val === '' || cnpjRegex.test(val),
            { message: 'CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX' }
        )
        .or(z.literal('')),
    address: z
        .string()
        .max(500, 'Endereço muito longo')
        .optional()
        .or(z.literal('')),
    phone: z
        .string()
        .max(20, 'Telefone muito longo')
        .optional()
        .or(z.literal('')),
    active: z
        .boolean(),
});

export type FacilityFormData = z.infer<typeof facilitySchema>;

export type Facility = FacilityFormData & {
    id: string;
    organization_id: string;
    created_at: string;
};

export type StaffFacility = {
    id: string;
    staff_id: string;
    facility_id: string;
    created_at: string;
};
