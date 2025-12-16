-- Migration: Create conselhos_profissionais table
-- Description: Catálogo de conselhos profissionais da área da saúde no Brasil
-- Author: Claude Code
-- Date: 2024-12-16

-- ============================================================================
-- FASE 1: Criar tabela conselhos_profissionais
-- ============================================================================

BEGIN;

-- Criar tabela de conselhos profissionais
CREATE TABLE IF NOT EXISTS conselhos_profissionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sigla VARCHAR(10) NOT NULL,
    nome_completo TEXT NOT NULL,
    regex_validacao TEXT NOT NULL DEFAULT '^\d+$',
    requer_categoria BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint de unicidade para sigla
ALTER TABLE conselhos_profissionais
    ADD CONSTRAINT conselhos_profissionais_sigla_unique UNIQUE (sigla);

-- Índice para buscas por sigla
CREATE INDEX IF NOT EXISTS idx_conselhos_profissionais_sigla
    ON conselhos_profissionais(sigla);

-- Comentários para documentação
COMMENT ON TABLE conselhos_profissionais IS
    'Catálogo de conselhos profissionais da área da saúde no Brasil (CRM, COREN, CRP, etc.)';

COMMENT ON COLUMN conselhos_profissionais.sigla IS
    'Sigla do conselho profissional (ex: CRM, COREN, CRP)';

COMMENT ON COLUMN conselhos_profissionais.nome_completo IS
    'Nome completo do conselho por extenso';

COMMENT ON COLUMN conselhos_profissionais.regex_validacao IS
    'Expressão regular para validar o número do registro profissional';

COMMENT ON COLUMN conselhos_profissionais.requer_categoria IS
    'Indica se o conselho requer categoria profissional (ex: COREN requer Enfermeiro/Técnico/Auxiliar)';

-- ============================================================================
-- FASE 2: Habilitar Row Level Security
-- ============================================================================

ALTER TABLE conselhos_profissionais ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (necessário para formulários)
CREATE POLICY conselhos_profissionais_select_policy
    ON conselhos_profissionais
    FOR SELECT
    TO public
    USING (true);

-- ============================================================================
-- FASE 3: Seed data - Conselhos profissionais brasileiros
-- ============================================================================

INSERT INTO conselhos_profissionais (sigla, nome_completo, regex_validacao, requer_categoria) VALUES
    ('CRM', 'Conselho Regional de Medicina', '^\d+$', false),
    ('COREN', 'Conselho Regional de Enfermagem', '^\d+$', true),
    ('CRP', 'Conselho Regional de Psicologia', '^\d{2}/\d+$', false),
    ('CRF', 'Conselho Regional de Farmácia', '^\d+$', false),
    ('CRO', 'Conselho Regional de Odontologia', '^\d+$', false),
    ('CREFITO', 'Conselho Regional de Fisioterapia e Terapia Ocupacional', '^\d+-[FTO]$', false),
    ('CRN', 'Conselho Regional de Nutricionistas', '^\d+$', false),
    ('CRBM', 'Conselho Regional de Biomedicina', '^\d+$', false),
    ('CRESS', 'Conselho Regional de Serviço Social', '^\d+$', false),
    ('CRFa', 'Conselho Regional de Fonoaudiologia', '^\d+$', false)
ON CONFLICT (sigla) DO UPDATE SET
    nome_completo = EXCLUDED.nome_completo,
    regex_validacao = EXCLUDED.regex_validacao,
    requer_categoria = EXCLUDED.requer_categoria;

COMMIT;

-- ============================================================================
-- Verificação
-- ============================================================================
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM conselhos_profissionais;
    RAISE NOTICE 'Tabela conselhos_profissionais criada com % registros', row_count;
END $$;
