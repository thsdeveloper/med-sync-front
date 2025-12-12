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

// CEP regex pattern - accepts both formats: XXXXX-XXX and XXXXXXXX
const cepRegex = /^\d{5}-?\d{3}$/;

// Brazilian state abbreviations (subset for validation)
export const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

// Address fields schema (optional for facility creation)
export const facilityAddressFieldsSchema = z.object({
    street: z
        .string()
        .min(3, 'Logradouro deve ter no mínimo 3 caracteres')
        .max(255, 'Logradouro muito longo')
        .optional()
        .or(z.literal('')),
    number: z
        .string()
        .max(20, 'Número muito longo')
        .optional()
        .or(z.literal('')),
    complement: z
        .string()
        .max(100, 'Complemento muito longo')
        .optional()
        .or(z.literal('')),
    neighborhood: z
        .string()
        .min(2, 'Bairro deve ter no mínimo 2 caracteres')
        .max(100, 'Bairro muito longo')
        .optional()
        .or(z.literal('')),
    city: z
        .string()
        .min(2, 'Cidade deve ter no mínimo 2 caracteres')
        .max(100, 'Cidade muito longa')
        .optional()
        .or(z.literal('')),
    state: z
        .enum(BRAZILIAN_STATES, {
            message: 'Selecione um estado válido',
        })
        .optional()
        .or(z.literal('') as any),
    postal_code: z
        .string()
        .refine(
            (val) => !val || val === '' || cepRegex.test(val),
            { message: 'CEP inválido. Use o formato XXXXX-XXX ou XXXXXXXX' }
        )
        .optional()
        .or(z.literal('')),
    country: z
        .string()
        .max(100, 'País muito longo')
        .optional()
        .or(z.literal(''))
        .default('Brasil'),
    latitude: z
        .number()
        .min(-90, 'Latitude deve estar entre -90 e 90')
        .max(90, 'Latitude deve estar entre -90 e 90')
        .optional()
        .nullable(),
    longitude: z
        .number()
        .min(-180, 'Longitude deve estar entre -180 e 180')
        .max(180, 'Longitude deve estar entre -180 e 180')
        .optional()
        .nullable(),
}).optional();

// Extended facility schema with address fields
export const facilityWithAddressSchema = facilitySchema.extend({
    address_fields: facilityAddressFieldsSchema,
});

export type FacilityFormData = z.infer<typeof facilitySchema>;
export type FacilityWithAddressFormData = z.infer<typeof facilityWithAddressSchema>;

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
