-- ==========================================
-- Migration: Migrate medical_staff.specialty to especialidade_id
-- ==========================================
-- Purpose: Replace free-text specialty field with foreign key reference
-- to especialidades table for data consistency and normalization
--
-- Changes:
-- 1. Add especialidade_id column (uuid, nullable, foreign key to especialidades)
-- 2. Map existing specialty text values to especialidade_id using fuzzy matching
-- 3. Create new especialidades entries for unmapped values
-- 4. Add foreign key constraint and index
-- 5. Preserve original specialty field for backward compatibility
--
-- Note: This migration does NOT drop the specialty text field to maintain
-- backward compatibility. Future migrations can remove it after full transition.
-- ==========================================

-- Step 1: Add new especialidade_id column (nullable initially)
ALTER TABLE medical_staff
ADD COLUMN IF NOT EXISTS especialidade_id UUID REFERENCES especialidades(id);

-- Step 2: Create a temporary table to log the migration mappings
CREATE TEMP TABLE specialty_migration_log (
    original_specialty TEXT,
    matched_especialidade_id UUID,
    matched_especialidade_nome TEXT,
    match_type TEXT,
    record_count INT
);

-- Step 3: Define mapping logic with fuzzy matching
-- This function handles various specialty name variations
CREATE OR REPLACE FUNCTION map_specialty_to_especialidade(specialty_text TEXT)
RETURNS UUID AS $$
DECLARE
    especialidade_id_result UUID;
    trimmed_specialty TEXT;
BEGIN
    -- Return NULL for NULL or empty input
    IF specialty_text IS NULL OR TRIM(specialty_text) = '' THEN
        RETURN NULL;
    END IF;

    trimmed_specialty := TRIM(specialty_text);

    -- Strategy 1: Exact match (case-insensitive, trimmed)
    SELECT id INTO especialidade_id_result
    FROM especialidades
    WHERE LOWER(TRIM(nome)) = LOWER(trimmed_specialty)
    LIMIT 1;

    IF especialidade_id_result IS NOT NULL THEN
        RETURN especialidade_id_result;
    END IF;

    -- Strategy 2: Handle common abbreviations and variations
    -- Cardio -> Cardiologia
    IF LOWER(trimmed_specialty) IN ('cardio', 'cardiologista') THEN
        SELECT id INTO especialidade_id_result
        FROM especialidades
        WHERE LOWER(nome) = 'cardiologia'
        LIMIT 1;
        RETURN especialidade_id_result;
    END IF;

    -- Anestesia -> Anestesiologia
    IF LOWER(trimmed_specialty) IN ('anestesia', 'anestesista') THEN
        SELECT id INTO especialidade_id_result
        FROM especialidades
        WHERE LOWER(nome) = 'anestesiologia'
        LIMIT 1;
        RETURN especialidade_id_result;
    END IF;

    -- Neuro -> Neurologia
    IF LOWER(trimmed_specialty) IN ('neuro', 'neurologista') THEN
        SELECT id INTO especialidade_id_result
        FROM especialidades
        WHERE LOWER(nome) = 'neurologia'
        LIMIT 1;
        RETURN especialidade_id_result;
    END IF;

    -- Ortopedista -> Ortopedia
    IF LOWER(trimmed_specialty) = 'ortopedista' THEN
        SELECT id INTO especialidade_id_result
        FROM especialidades
        WHERE LOWER(nome) = 'ortopedia'
        LIMIT 1;
        RETURN especialidade_id_result;
    END IF;

    -- Pediatra -> Pediatria
    IF LOWER(trimmed_specialty) = 'pediatra' THEN
        SELECT id INTO especialidade_id_result
        FROM especialidades
        WHERE LOWER(nome) = 'pediatria'
        LIMIT 1;
        RETURN especialidade_id_result;
    END IF;

    -- Strategy 3: Partial match - find if the input is contained in any especialidade name
    SELECT id INTO especialidade_id_result
    FROM especialidades
    WHERE LOWER(nome) LIKE '%' || LOWER(trimmed_specialty) || '%'
    LIMIT 1;

    IF especialidade_id_result IS NOT NULL THEN
        RETURN especialidade_id_result;
    END IF;

    -- Strategy 4: Reverse partial match - find if any especialidade is contained in the input
    SELECT id INTO especialidade_id_result
    FROM especialidades
    WHERE LOWER(trimmed_specialty) LIKE '%' || LOWER(nome) || '%'
    LIMIT 1;

    IF especialidade_id_result IS NOT NULL THEN
        RETURN especialidade_id_result;
    END IF;

    -- Strategy 5: No match found - create new entry in especialidades
    -- Use the properly formatted version of the input
    INSERT INTO especialidades (nome)
    VALUES (INITCAP(trimmed_specialty))
    ON CONFLICT (nome) DO NOTHING
    RETURNING id INTO especialidade_id_result;

    -- If insert failed due to conflict, retrieve the existing id
    IF especialidade_id_result IS NULL THEN
        SELECT id INTO especialidade_id_result
        FROM especialidades
        WHERE LOWER(nome) = LOWER(trimmed_specialty)
        LIMIT 1;
    END IF;

    RETURN especialidade_id_result;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Populate especialidade_id for all records
-- Log the mappings before applying them
INSERT INTO specialty_migration_log (
    original_specialty,
    matched_especialidade_id,
    matched_especialidade_nome,
    match_type,
    record_count
)
SELECT
    ms.specialty,
    map_specialty_to_especialidade(ms.specialty) as mapped_id,
    e.nome as mapped_nome,
    CASE
        WHEN LOWER(TRIM(e.nome)) = LOWER(TRIM(ms.specialty)) THEN 'EXACT_MATCH'
        WHEN LOWER(e.nome) LIKE '%' || LOWER(TRIM(ms.specialty)) || '%' THEN 'PARTIAL_MATCH'
        WHEN e.nome IS NULL THEN 'NEW_ENTRY_CREATED'
        ELSE 'FUZZY_MATCH'
    END as match_type,
    COUNT(*) as record_count
FROM (
    SELECT DISTINCT specialty
    FROM medical_staff
    WHERE specialty IS NOT NULL
) ms
LEFT JOIN especialidades e ON e.id = map_specialty_to_especialidade(ms.specialty)
GROUP BY ms.specialty, mapped_id, e.nome;

-- Step 5: Apply the mappings to medical_staff table
UPDATE medical_staff
SET especialidade_id = map_specialty_to_especialidade(specialty)
WHERE specialty IS NOT NULL;

-- Step 6: Add index on especialidade_id for query performance
CREATE INDEX IF NOT EXISTS idx_medical_staff_especialidade_id
ON medical_staff(especialidade_id);

-- Step 7: Output migration results for review
DO $$
DECLARE
    total_records INT;
    records_with_specialty INT;
    records_migrated INT;
    records_unmapped INT;
    unique_specialties INT;
    new_especialidades_created INT;
BEGIN
    -- Gather statistics
    SELECT COUNT(*) INTO total_records FROM medical_staff;

    SELECT COUNT(*) INTO records_with_specialty
    FROM medical_staff
    WHERE specialty IS NOT NULL AND TRIM(specialty) != '';

    SELECT COUNT(*) INTO records_migrated
    FROM medical_staff
    WHERE especialidade_id IS NOT NULL;

    SELECT COUNT(*) INTO records_unmapped
    FROM medical_staff
    WHERE specialty IS NOT NULL
        AND TRIM(specialty) != ''
        AND especialidade_id IS NULL;

    SELECT COUNT(DISTINCT specialty) INTO unique_specialties
    FROM medical_staff
    WHERE specialty IS NOT NULL;

    SELECT COUNT(*) INTO new_especialidades_created
    FROM specialty_migration_log
    WHERE match_type = 'NEW_ENTRY_CREATED';

    -- Log results
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total medical_staff records: %', total_records;
    RAISE NOTICE 'Records with specialty text: %', records_with_specialty;
    RAISE NOTICE 'Records successfully migrated: %', records_migrated;
    RAISE NOTICE 'Records unmapped (manual review needed): %', records_unmapped;
    RAISE NOTICE 'Unique specialty values processed: %', unique_specialties;
    RAISE NOTICE 'New especialidades entries created: %', new_especialidades_created;
    RAISE NOTICE '========================================';

    -- Output mapping details
    RAISE NOTICE 'Mapping Details:';
    RAISE NOTICE '========================================';
END $$;

-- Step 8: Display detailed mapping log for manual review
SELECT
    original_specialty,
    matched_especialidade_nome,
    match_type,
    record_count,
    CASE
        WHEN match_type = 'EXACT_MATCH' THEN '✓ Exact match found'
        WHEN match_type = 'PARTIAL_MATCH' THEN '⚠ Partial match applied'
        WHEN match_type = 'FUZZY_MATCH' THEN '⚠ Fuzzy match applied'
        WHEN match_type = 'NEW_ENTRY_CREATED' THEN '+ New entry created'
        ELSE '✗ Review needed'
    END as status
FROM specialty_migration_log
ORDER BY
    CASE match_type
        WHEN 'EXACT_MATCH' THEN 1
        WHEN 'FUZZY_MATCH' THEN 2
        WHEN 'PARTIAL_MATCH' THEN 3
        WHEN 'NEW_ENTRY_CREATED' THEN 4
        ELSE 5
    END,
    record_count DESC;

-- Step 9: Identify any unmapped records that need manual review
SELECT
    ms.id,
    ms.name,
    ms.specialty,
    'Manual mapping required' as issue
FROM medical_staff ms
WHERE ms.specialty IS NOT NULL
    AND TRIM(ms.specialty) != ''
    AND ms.especialidade_id IS NULL;

-- Step 10: Clean up temporary function
DROP FUNCTION IF EXISTS map_specialty_to_especialidade(TEXT);

-- Note: The specialty text field is intentionally preserved for:
-- 1. Backward compatibility with existing code
-- 2. Audit trail and data verification
-- 3. Gradual migration of application code
--
-- A future migration can remove the specialty field once all application
-- code has been updated to use especialidade_id
