-- Migration: Create Especialidades (Medical Specialties) Table
-- Description: Creates a normalized table for medical specialties to replace
--              free-text specialty field in corpo_clinico/medical_staff table
-- Author: MedSync Team
-- Date: 2025-12-15

-- ============================================================================
-- Table: especialidades
-- Purpose: Stores medical specialties for standardized selection
-- ============================================================================
CREATE TABLE IF NOT EXISTS especialidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for name lookups and search
CREATE INDEX IF NOT EXISTS idx_especialidades_nome
ON especialidades(nome);

COMMENT ON TABLE especialidades IS 'Medical specialties catalog for standardized selection in medical staff profiles';
COMMENT ON COLUMN especialidades.nome IS 'Name of the medical specialty in Portuguese';

-- ============================================================================
-- Seed Data: Common Medical Specialties (Brazilian Medical Specialties)
-- ============================================================================
INSERT INTO especialidades (nome) VALUES
    ('Cardiologia'),
    ('Dermatologia'),
    ('Ortopedia'),
    ('Pediatria'),
    ('Ginecologia'),
    ('Oftalmologia'),
    ('Neurologia'),
    ('Psiquiatria'),
    ('Oncologia'),
    ('Endocrinologia'),
    ('Otorrinolaringologia'),
    ('Urologia'),
    ('Gastroenterologia'),
    ('Pneumologia'),
    ('Nefrologia'),
    ('Reumatologia'),
    ('Hematologia'),
    ('Infectologia'),
    ('Geriatria'),
    ('Medicina de Família e Comunidade'),
    ('Anestesiologia'),
    ('Radiologia'),
    ('Cirurgia Geral'),
    ('Cirurgia Plástica'),
    ('Cirurgia Vascular'),
    ('Clínica Médica'),
    ('Medicina do Trabalho'),
    ('Medicina Intensiva'),
    ('Patologia'),
    ('Genética Médica')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on especialidades table
ALTER TABLE especialidades ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (SELECT) for all users
-- This allows unauthenticated users to view the list of specialties
-- which is necessary for registration and public-facing forms
CREATE POLICY public_especialidades_select
    ON especialidades
    FOR SELECT
    TO public
    USING (true);

-- Note: Only SELECT is allowed publicly. INSERT/UPDATE/DELETE operations
-- should be restricted to authenticated admin users in future migrations.
