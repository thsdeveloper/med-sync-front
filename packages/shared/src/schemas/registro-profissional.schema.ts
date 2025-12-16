import { z } from 'zod';

/**
 * Lista de UFs válidas do Brasil
 */
export const VALID_UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

export type UF = typeof VALID_UFS[number];

/**
 * Siglas dos conselhos profissionais da área da saúde no Brasil
 */
export const CONSELHOS = [
    'CRM',     // Conselho Regional de Medicina
    'COREN',   // Conselho Regional de Enfermagem
    'CRP',     // Conselho Regional de Psicologia
    'CRF',     // Conselho Regional de Farmácia
    'CRO',     // Conselho Regional de Odontologia
    'CREFITO', // Conselho Regional de Fisioterapia e Terapia Ocupacional
    'CRN',     // Conselho Regional de Nutricionistas
    'CRBM',    // Conselho Regional de Biomedicina
    'CRESS',   // Conselho Regional de Serviço Social
    'CRFa',    // Conselho Regional de Fonoaudiologia
] as const;

export type Conselho = typeof CONSELHOS[number];

/**
 * Categorias disponíveis para o COREN
 */
export const CATEGORIAS_COREN = ['Enfermeiro', 'Técnico', 'Auxiliar'] as const;
export type CategoriaCoren = typeof CATEGORIAS_COREN[number];

// ============================================================================
// Schemas de Database (para tipos vindos do Supabase)
// ============================================================================

/**
 * Schema para conselho profissional (registro do banco)
 */
export const conselhoProfissionalSchema = z.object({
    id: z.string().uuid(),
    sigla: z.string(),
    nome_completo: z.string(),
    regex_validacao: z.string(),
    requer_categoria: z.boolean(),
    created_at: z.string().nullable().optional(),
});

export type ConselhoProfissional = z.infer<typeof conselhoProfissionalSchema>;

/**
 * Schema para profissão (registro do banco)
 */
export const profissaoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    conselho_id: z.string().uuid(),
    categorias_disponiveis: z.array(z.string()).nullable(),
    created_at: z.string().nullable().optional(),
});

export type Profissao = z.infer<typeof profissaoSchema>;

/**
 * Profissão com conselho aninhado (resultado de JOIN)
 */
export const profissaoComConselhoSchema = profissaoSchema.extend({
    conselho: conselhoProfissionalSchema.optional(),
});

export type ProfissaoComConselho = z.infer<typeof profissaoComConselhoSchema>;

// ============================================================================
// Schemas de Formulário
// ============================================================================

/**
 * Schema para input de registro profissional em formulários
 */
export const registroProfissionalSchema = z.object({
    profissao_id: z.string().uuid('Selecione uma profissão'),
    registro_numero: z.string()
        .min(1, 'Número do registro é obrigatório')
        .regex(/^\d+$/, 'Número do registro deve conter apenas dígitos'),
    registro_uf: z.enum(VALID_UFS, { message: 'Selecione uma UF válida' }),
    registro_categoria: z.string().optional().nullable(),
});

export type RegistroProfissionalFormData = z.infer<typeof registroProfissionalSchema>;

/**
 * Schema opcional para registro profissional
 */
export const registroProfissionalOptionalSchema = z.object({
    profissao_id: z.string().uuid().optional().nullable(),
    registro_numero: z.string().optional().nullable(),
    registro_uf: z.string().optional().nullable(),
    registro_categoria: z.string().optional().nullable(),
});

export type RegistroProfissionalOptionalFormData = z.infer<typeof registroProfissionalOptionalSchema>;

// ============================================================================
// Funções Utilitárias
// ============================================================================

/**
 * Normaliza o número do registro (remove caracteres não numéricos)
 */
export function normalizeRegistroNumero(numero: string): string {
    if (!numero) return '';
    return numero.replace(/\D/g, '').trim();
}

/**
 * Formata o registro profissional completo
 * @example formatRegistroCompleto('CRM', '12345', 'SP') => 'CRM 12345/SP'
 */
export function formatRegistroCompleto(
    siglaConselho: string,
    numero: string,
    uf: string
): string {
    if (!siglaConselho || !numero || !uf) return '';
    return `${siglaConselho} ${numero}/${uf.toUpperCase()}`;
}

/**
 * Gera o email de autenticação baseado no registro profissional
 * @example generateAuthEmail('CRM', '12345', 'SP') => 'crm12345sp@medsync.doctor'
 */
export function generateAuthEmail(
    siglaConselho: string,
    numero: string,
    uf: string
): string {
    if (!siglaConselho || !numero || !uf) return '';
    const normalized = `${siglaConselho}${numero}${uf}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${normalized}@medsync.doctor`;
}

/**
 * Valida se o número do registro está no formato correto para o conselho
 */
export function isValidRegistroNumero(numero: string, regexValidacao?: string): boolean {
    if (!numero) return false;
    const pattern = regexValidacao || '^\\d+$';
    try {
        return new RegExp(pattern).test(numero);
    } catch {
        // Se o regex for inválido, usa validação padrão (apenas dígitos)
        return /^\d+$/.test(numero);
    }
}

/**
 * Valida o registro profissional completo
 */
export function validateRegistroProfissional(
    numero: string,
    uf: string,
    regexValidacao?: string
): { isValid: boolean; error?: string } {
    if (!numero) {
        return { isValid: false, error: 'Número do registro é obrigatório' };
    }

    if (!isValidRegistroNumero(numero, regexValidacao)) {
        return { isValid: false, error: 'Número do registro inválido' };
    }

    if (!uf) {
        return { isValid: false, error: 'UF é obrigatória' };
    }

    if (!VALID_UFS.includes(uf.toUpperCase() as UF)) {
        return { isValid: false, error: `UF "${uf}" inválida` };
    }

    return { isValid: true };
}

/**
 * Extrai número e UF de um CRM no formato antigo (ex: "12345/SP")
 */
export function parseCrmLegacy(crm: string): { numero: string; uf: string } | null {
    if (!crm) return null;

    const parts = crm.trim().split('/');
    if (parts.length !== 2) return null;

    const numero = parts[0].trim();
    const uf = parts[1].trim().toUpperCase();

    if (!numero || !uf) return null;
    if (!VALID_UFS.includes(uf as UF)) return null;

    return { numero, uf };
}

/**
 * Verifica se o conselho requer categoria
 */
export function conselhoRequerCategoria(siglaConselho: string): boolean {
    return siglaConselho === 'COREN';
}

/**
 * Retorna as categorias disponíveis para um conselho
 */
export function getCategoriasConselho(siglaConselho: string): readonly string[] {
    if (siglaConselho === 'COREN') {
        return CATEGORIAS_COREN;
    }
    return [];
}
