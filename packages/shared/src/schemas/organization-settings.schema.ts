import { z } from "zod";

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 120;
const MAX_ADDRESS_LENGTH = 500;

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

const validatePhone = (phone: string | undefined) => {
    if (!phone) return true;
    const digits = sanitizeDigits(phone);
    return digits.length >= 10 && digits.length <= 11;
};

export const organizationSettingsSchema = z.object({
    name: z
        .string()
        .min(1, "Nome é obrigatório")
        .min(MIN_NAME_LENGTH, `Nome deve ter ao menos ${MIN_NAME_LENGTH} caracteres`)
        .max(MAX_NAME_LENGTH, "Nome muito longo"),
    cnpj: z
        .string()
        .min(14, "CNPJ inválido")
        .max(18, "CNPJ inválido"),
    phone: z
        .string()
        .optional()
        .refine(validatePhone, { message: "Telefone inválido" }),
    address: z
        .string()
        .max(MAX_ADDRESS_LENGTH, "Endereço muito longo")
        .optional()
        .or(z.literal("")),
});

export type OrganizationSettingsFormData = z.infer<typeof organizationSettingsSchema>;
