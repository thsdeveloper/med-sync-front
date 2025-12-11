-- Migration: Create Payment Management System
-- Description: Creates tables for facility payment configuration, shift duration rates,
--              payment records, and Brazilian holidays calendar
-- Author: MedSync Team
-- Date: 2025-12-11

-- ============================================================================
-- Table: facility_payment_config
-- Purpose: Stores payment configuration at the facility level
-- ============================================================================
CREATE TABLE IF NOT EXISTS facility_payment_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('hourly', 'fixed_per_shift')),
    hourly_rate DECIMAL(10, 2), -- Used when payment_type = 'hourly'
    night_shift_bonus_percent DECIMAL(5, 2) DEFAULT 0 CHECK (night_shift_bonus_percent >= 0 AND night_shift_bonus_percent <= 100),
    weekend_bonus_percent DECIMAL(5, 2) DEFAULT 0 CHECK (weekend_bonus_percent >= 0 AND weekend_bonus_percent <= 100),
    holiday_bonus_percent DECIMAL(5, 2) DEFAULT 0 CHECK (holiday_bonus_percent >= 0 AND holiday_bonus_percent <= 100),
    night_shift_start_hour INTEGER DEFAULT 22 CHECK (night_shift_start_hour >= 0 AND night_shift_start_hour <= 23),
    night_shift_end_hour INTEGER DEFAULT 6 CHECK (night_shift_end_hour >= 0 AND night_shift_end_hour <= 23),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_facility_config UNIQUE (facility_id)
);

-- Index for facility_id lookups
CREATE INDEX IF NOT EXISTS idx_facility_payment_config_facility
ON facility_payment_config(facility_id);

-- Index for active configurations
CREATE INDEX IF NOT EXISTS idx_facility_payment_config_active
ON facility_payment_config(active) WHERE active = true;

COMMENT ON TABLE facility_payment_config IS 'Stores payment configuration for each facility (clinic/hospital)';
COMMENT ON COLUMN facility_payment_config.payment_type IS 'Type of payment: hourly or fixed per shift';
COMMENT ON COLUMN facility_payment_config.hourly_rate IS 'Hourly rate when payment_type is hourly';
COMMENT ON COLUMN facility_payment_config.night_shift_bonus_percent IS 'Percentage bonus for night shifts (e.g., 25.00 for 25%)';

-- ============================================================================
-- Table: shift_duration_rates
-- Purpose: Stores fixed rates per shift duration (for fixed_per_shift payment type)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shift_duration_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_payment_config_id UUID NOT NULL REFERENCES facility_payment_config(id) ON DELETE CASCADE,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    fixed_rate DECIMAL(10, 2) NOT NULL CHECK (fixed_rate > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_duration_per_config UNIQUE (facility_payment_config_id, duration_hours)
);

-- Index for config lookups
CREATE INDEX IF NOT EXISTS idx_shift_duration_rates_config
ON shift_duration_rates(facility_payment_config_id);

COMMENT ON TABLE shift_duration_rates IS 'Fixed payment rates based on shift duration (6h, 12h, 24h, etc.)';
COMMENT ON COLUMN shift_duration_rates.duration_hours IS 'Duration of shift in hours (e.g., 6, 12, 24)';
COMMENT ON COLUMN shift_duration_rates.fixed_rate IS 'Fixed amount to pay for this duration';

-- ============================================================================
-- Table: payment_records
-- Purpose: Stores calculated payment records for each completed shift
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,

    -- Time tracking
    shift_start_time TIMESTAMPTZ NOT NULL,
    shift_end_time TIMESTAMPTZ NOT NULL,
    scheduled_minutes INTEGER NOT NULL CHECK (scheduled_minutes > 0),
    worked_minutes INTEGER NOT NULL CHECK (worked_minutes >= 0),
    overtime_minutes INTEGER DEFAULT 0 CHECK (overtime_minutes >= 0),

    -- Payment calculation
    payment_type TEXT NOT NULL CHECK (payment_type IN ('hourly', 'fixed_per_shift')),
    base_rate DECIMAL(10, 2) NOT NULL CHECK (base_rate >= 0),
    base_amount DECIMAL(10, 2) NOT NULL CHECK (base_amount >= 0),
    night_shift_bonus DECIMAL(10, 2) DEFAULT 0 CHECK (night_shift_bonus >= 0),
    weekend_bonus DECIMAL(10, 2) DEFAULT 0 CHECK (weekend_bonus >= 0),
    holiday_bonus DECIMAL(10, 2) DEFAULT 0 CHECK (holiday_bonus >= 0),
    overtime_amount DECIMAL(10, 2) DEFAULT 0 CHECK (overtime_amount >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),

    -- Flags
    is_night_shift BOOLEAN DEFAULT false,
    is_weekend BOOLEAN DEFAULT false,
    is_holiday BOOLEAN DEFAULT false,

    -- Metadata
    calculation_metadata JSONB, -- Stores detailed breakdown for auditing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_payment_per_shift UNIQUE (shift_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payment_records_organization
ON payment_records(organization_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_staff
ON payment_records(staff_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_facility
ON payment_records(facility_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_shift_start
ON payment_records(shift_start_time);

CREATE INDEX IF NOT EXISTS idx_payment_records_status
ON payment_records(status);

-- Composite index for report queries
CREATE INDEX IF NOT EXISTS idx_payment_records_org_period
ON payment_records(organization_id, shift_start_time DESC);

CREATE INDEX IF NOT EXISTS idx_payment_records_staff_period
ON payment_records(staff_id, shift_start_time DESC);

COMMENT ON TABLE payment_records IS 'Calculated payment records for completed shifts';
COMMENT ON COLUMN payment_records.calculation_metadata IS 'JSON with detailed calculation breakdown for audit purposes';
COMMENT ON COLUMN payment_records.status IS 'Payment status: pending (calculated), approved (manager approved), paid (payment processed)';

-- ============================================================================
-- Table: brazilian_holidays
-- Purpose: Stores Brazilian national and regional holidays for bonus calculation
-- ============================================================================
CREATE TABLE IF NOT EXISTS brazilian_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'national' CHECK (type IN ('national', 'state', 'municipal')),
    state_code TEXT, -- e.g., 'SP', 'RJ', null for national
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_holiday_date_type UNIQUE (date, type, state_code)
);

-- Index for date lookups
CREATE INDEX IF NOT EXISTS idx_brazilian_holidays_date
ON brazilian_holidays(date);

-- Index for national holidays (most common query)
CREATE INDEX IF NOT EXISTS idx_brazilian_holidays_national
ON brazilian_holidays(date, type) WHERE type = 'national';

COMMENT ON TABLE brazilian_holidays IS 'Calendar of Brazilian national and regional holidays';
COMMENT ON COLUMN brazilian_holidays.type IS 'Holiday type: national, state, or municipal';
COMMENT ON COLUMN brazilian_holidays.state_code IS 'State code (e.g., SP, RJ) for state/municipal holidays';

-- ============================================================================
-- Trigger Function: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to facility_payment_config
DROP TRIGGER IF EXISTS update_facility_payment_config_timestamp ON facility_payment_config;
CREATE TRIGGER update_facility_payment_config_timestamp
    BEFORE UPDATE ON facility_payment_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to payment_records
DROP TRIGGER IF EXISTS update_payment_records_timestamp ON payment_records;
CREATE TRIGGER update_payment_records_timestamp
    BEFORE UPDATE ON payment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed: Brazilian National Holidays (2024-2026)
-- ============================================================================
INSERT INTO brazilian_holidays (date, name, type, state_code) VALUES
    -- 2024
    ('2024-01-01', 'Ano Novo', 'national', NULL),
    ('2024-02-13', 'Carnaval', 'national', NULL),
    ('2024-03-29', 'Sexta-feira Santa', 'national', NULL),
    ('2024-04-21', 'Tiradentes', 'national', NULL),
    ('2024-05-01', 'Dia do Trabalho', 'national', NULL),
    ('2024-05-30', 'Corpus Christi', 'national', NULL),
    ('2024-09-07', 'Independência do Brasil', 'national', NULL),
    ('2024-10-12', 'Nossa Senhora Aparecida', 'national', NULL),
    ('2024-11-02', 'Finados', 'national', NULL),
    ('2024-11-15', 'Proclamação da República', 'national', NULL),
    ('2024-11-20', 'Consciência Negra', 'national', NULL),
    ('2024-12-25', 'Natal', 'national', NULL),

    -- 2025
    ('2025-01-01', 'Ano Novo', 'national', NULL),
    ('2025-03-04', 'Carnaval', 'national', NULL),
    ('2025-04-18', 'Sexta-feira Santa', 'national', NULL),
    ('2025-04-21', 'Tiradentes', 'national', NULL),
    ('2025-05-01', 'Dia do Trabalho', 'national', NULL),
    ('2025-06-19', 'Corpus Christi', 'national', NULL),
    ('2025-09-07', 'Independência do Brasil', 'national', NULL),
    ('2025-10-12', 'Nossa Senhora Aparecida', 'national', NULL),
    ('2025-11-02', 'Finados', 'national', NULL),
    ('2025-11-15', 'Proclamação da República', 'national', NULL),
    ('2025-11-20', 'Consciência Negra', 'national', NULL),
    ('2025-12-25', 'Natal', 'national', NULL),

    -- 2026
    ('2026-01-01', 'Ano Novo', 'national', NULL),
    ('2026-02-17', 'Carnaval', 'national', NULL),
    ('2026-04-03', 'Sexta-feira Santa', 'national', NULL),
    ('2026-04-21', 'Tiradentes', 'national', NULL),
    ('2026-05-01', 'Dia do Trabalho', 'national', NULL),
    ('2026-06-04', 'Corpus Christi', 'national', NULL),
    ('2026-09-07', 'Independência do Brasil', 'national', NULL),
    ('2026-10-12', 'Nossa Senhora Aparecida', 'national', NULL),
    ('2026-11-02', 'Finados', 'national', NULL),
    ('2026-11-15', 'Proclamação da República', 'national', NULL),
    ('2026-11-20', 'Consciência Negra', 'national', NULL),
    ('2026-12-25', 'Natal', 'national', NULL)
ON CONFLICT (date, type, state_code) DO NOTHING;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE facility_payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_duration_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE brazilian_holidays ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added in a separate migration after authentication
-- and organization access patterns are confirmed
