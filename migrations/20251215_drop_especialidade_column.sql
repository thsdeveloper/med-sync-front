-- Migration: Drop deprecated 'specialty' column from medical_staff table
-- Date: 2025-12-15
-- Description: After migrating all data to especialidade_id foreign key relationship,
--              we can safely drop the old text-based specialty column.
--
-- IMPORTANT: This migration should only be run AFTER verifying:
-- 1. All medical_staff records have especialidade_id populated
-- 2. All application code has been updated to use especialidade_id
-- 3. All tests pass with the new especialidade_id field

-- Step 1: Verify data integrity (all records must have especialidade_id)
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM medical_staff
    WHERE especialidade_id IS NULL;

    IF missing_count > 0 THEN
        RAISE EXCEPTION 'Cannot drop specialty column: % records are missing especialidade_id', missing_count;
    END IF;

    RAISE NOTICE 'Data integrity check passed: All % medical_staff records have especialidade_id',
        (SELECT COUNT(*) FROM medical_staff);
END $$;

-- Step 2: Drop the deprecated specialty column
ALTER TABLE medical_staff
DROP COLUMN IF EXISTS specialty;

-- Step 3: Add comment to especialidade_id column documenting the refactoring
COMMENT ON COLUMN medical_staff.especialidade_id IS
    'Foreign key to especialidades table. Replaces the deprecated specialty text field (dropped 2025-12-15).
     This provides normalized, consistent specialty data with referential integrity.';

-- Verification: Confirm column is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'medical_staff'
        AND column_name = 'specialty'
    ) THEN
        RAISE EXCEPTION 'Migration failed: specialty column still exists';
    ELSE
        RAISE NOTICE 'Migration successful: specialty column has been dropped';
    END IF;
END $$;
