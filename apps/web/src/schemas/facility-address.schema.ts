import { z } from 'zod';

// Brazilian state abbreviations (all 27 states including Federal District)
export const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

export const BRAZILIAN_STATE_LABELS: Record<typeof BRAZILIAN_STATES[number], string> = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapá',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceará',
    DF: 'Distrito Federal',
    ES: 'Espírito Santo',
    GO: 'Goiás',
    MA: 'Maranhão',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Pará',
    PB: 'Paraíba',
    PR: 'Paraná',
    PE: 'Pernambuco',
    PI: 'Piauí',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondônia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'São Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins',
};

// CEP regex pattern - accepts both formats: XXXXX-XXX and XXXXXXXX
const cepRegex = /^\d{5}-?\d{3}$/;

export const facilityAddressSchema = z.object({
    facility_id: z
        .string()
        .uuid('ID da unidade inválido'),
    street: z
        .string()
        .min(1, 'Logradouro é obrigatório')
        .min(3, 'Logradouro deve ter no mínimo 3 caracteres')
        .max(255, 'Logradouro muito longo'),
    number: z
        .string()
        .min(1, 'Número é obrigatório')
        .max(20, 'Número muito longo'),
    complement: z
        .string()
        .max(100, 'Complemento muito longo')
        .optional()
        .or(z.literal('')),
    neighborhood: z
        .string()
        .min(1, 'Bairro é obrigatório')
        .min(2, 'Bairro deve ter no mínimo 2 caracteres')
        .max(100, 'Bairro muito longo'),
    city: z
        .string()
        .min(1, 'Cidade é obrigatória')
        .min(2, 'Cidade deve ter no mínimo 2 caracteres')
        .max(100, 'Cidade muito longa'),
    state: z
        .enum(BRAZILIAN_STATES, {
            message: 'Selecione um estado válido',
        }),
    postal_code: z
        .string()
        .min(1, 'CEP é obrigatório')
        .refine(
            (val) => cepRegex.test(val),
            { message: 'CEP inválido. Use o formato XXXXX-XXX ou XXXXXXXX' }
        ),
    country: z
        .string()
        .min(1, 'País é obrigatório')
        .min(2, 'País deve ter no mínimo 2 caracteres')
        .max(100, 'País muito longo')
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
    is_migrated: z
        .boolean()
        .default(false)
        .optional(),
});

// Schema for creating a new facility address (without facility_id if it's provided by context)
export const createFacilityAddressSchema = facilityAddressSchema;

// Schema for updating a facility address (all fields optional except facility_id)
export const updateFacilityAddressSchema = facilityAddressSchema.partial().required({
    facility_id: true,
});

// TypeScript types
export type FacilityAddressFormData = z.infer<typeof facilityAddressSchema>;
export type CreateFacilityAddress = z.infer<typeof createFacilityAddressSchema>;
export type UpdateFacilityAddress = z.infer<typeof updateFacilityAddressSchema>;

// Type for the complete facility address from database
export type FacilityAddress = FacilityAddressFormData & {
    id: string;
    created_at: string;
    updated_at: string;
};

// Helper type for address display (formatted)
export type FacilityAddressDisplay = {
    full_address: string;
    short_address: string;
    city_state: string;
};

// Helper function to format address for display
export const formatAddress = (address: FacilityAddress): FacilityAddressDisplay => {
    const complement = address.complement ? `, ${address.complement}` : '';
    const full_address = `${address.street}, ${address.number}${complement}, ${address.neighborhood}, ${address.city} - ${address.state}, ${address.postal_code}`;
    const short_address = `${address.street}, ${address.number}, ${address.city} - ${address.state}`;
    const city_state = `${address.city} - ${address.state}`;

    return {
        full_address,
        short_address,
        city_state,
    };
};

// Helper function to format CEP (add hyphen if missing)
export const formatCEP = (cep: string): string => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length === 8) {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return cep;
};
