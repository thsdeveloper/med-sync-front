import { z } from 'zod';
import { VALID_UFS, type UF } from './registro-profissional.schema';

/**
 * Regex para validação de CRM
 * Formato: número/UF (ex: 1234/SP, 123456/RJ)
 * - Começa com um ou mais dígitos
 * - Seguido de uma barra /
 * - Termina com exatamente 2 letras maiúsculas (UF)
 */
export const CRM_REGEX = /^\d+\/[A-Z]{2}$/;

/**
 * Mensagem de erro padrão para CRM inválido
 */
export const CRM_ERROR_MESSAGE = 'CRM inválido. Use o formato 1234/DF';

/**
 * Normaliza o valor do CRM:
 * - Remove espaços do início e fim (trim)
 * - Converte UF para maiúsculo
 */
export function normalizeCRM(value: string): string {
    if (!value) return '';

    const trimmed = value.trim();

    // Encontra a posição da barra
    const slashIndex = trimmed.indexOf('/');

    if (slashIndex === -1) {
        // Sem barra, retorna o valor com trim
        return trimmed;
    }

    // Separa número e UF
    const number = trimmed.substring(0, slashIndex);
    const uf = trimmed.substring(slashIndex + 1).toUpperCase();

    return `${number}/${uf}`;
}

/**
 * Valida se o CRM está no formato correto
 * Retorna true se válido, false se inválido
 */
export function isValidCRM(value: string): boolean {
    if (!value) return false;

    const normalized = normalizeCRM(value);

    if (!CRM_REGEX.test(normalized)) {
        return false;
    }

    // Extrai a UF e verifica se é válida
    const uf = normalized.split('/')[1] as UF;
    return VALID_UFS.includes(uf);
}

/**
 * Valida o CRM e retorna um objeto com resultado e mensagem de erro
 */
export function validateCRM(value: string): { isValid: boolean; error?: string; normalized: string } {
    const normalized = normalizeCRM(value);

    if (!normalized) {
        return { isValid: false, error: 'CRM é obrigatório', normalized };
    }

    if (!CRM_REGEX.test(normalized)) {
        return { isValid: false, error: CRM_ERROR_MESSAGE, normalized };
    }

    // Extrai a UF e verifica se é válida
    const uf = normalized.split('/')[1];
    if (!VALID_UFS.includes(uf as UF)) {
        return { isValid: false, error: `UF "${uf}" inválida`, normalized };
    }

    return { isValid: true, normalized };
}

/**
 * Schema Zod para CRM obrigatório
 */
export const crmSchema = z
    .string()
    .min(1, 'CRM é obrigatório')
    .transform(normalizeCRM)
    .refine(
        (value) => CRM_REGEX.test(value),
        { message: CRM_ERROR_MESSAGE }
    )
    .refine(
        (value) => {
            const uf = value.split('/')[1];
            return VALID_UFS.includes(uf as UF);
        },
        { message: 'UF inválida' }
    );

/**
 * Schema Zod para CRM opcional (aceita string vazia)
 * Não usa transform para manter compatibilidade com formulários
 * A normalização deve ser feita no onChange do input
 */
export const crmOptionalSchema = z
    .string()
    .refine(
        (value) => {
            if (!value || value === '') return true;
            const normalized = normalizeCRM(value);
            return CRM_REGEX.test(normalized);
        },
        { message: CRM_ERROR_MESSAGE }
    )
    .refine(
        (value) => {
            if (!value || value === '') return true;
            const normalized = normalizeCRM(value);
            const uf = normalized.split('/')[1];
            return VALID_UFS.includes(uf as UF);
        },
        { message: 'UF inválida' }
    )
    .optional()
    .or(z.literal(''));

export type CRM = z.infer<typeof crmSchema>;
