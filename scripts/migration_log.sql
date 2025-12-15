-- ==========================================
-- Migration Verification and Logging Script
-- ==========================================
-- Purpose: Verify the medical_staff specialty migration completed successfully
-- and generate detailed logs for review
--
-- Usage: Run this after the migration to verify results
-- ==========================================

-- Verification 1: Check all records have especialidade_id where specialty exists
SELECT
    'Records with specialty text but no especialidade_id' as check_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) = 0 THEN '✓ PASS'
        ELSE '✗ FAIL - Manual review needed'
    END as status
FROM medical_staff
WHERE specialty IS NOT NULL
    AND TRIM(specialty) != ''
    AND especialidade_id IS NULL;

-- Verification 2: Check foreign key integrity
SELECT
    'Records with invalid especialidade_id references' as check_name,
    COUNT(*) as count,
    CASE
        WHEN COUNT(*) = 0 THEN '✓ PASS'
        ELSE '✗ FAIL - Data integrity issue'
    END as status
FROM medical_staff ms
LEFT JOIN especialidades e ON ms.especialidade_id = e.id
WHERE ms.especialidade_id IS NOT NULL
    AND e.id IS NULL;

-- Verification 3: Migration coverage summary
SELECT
    'Migration Coverage' as report_section,
    COUNT(*) FILTER (WHERE specialty IS NOT NULL) as records_with_specialty,
    COUNT(*) FILTER (WHERE especialidade_id IS NOT NULL) as records_with_especialidade_id,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE especialidade_id IS NOT NULL) /
        NULLIF(COUNT(*) FILTER (WHERE specialty IS NOT NULL), 0),
        2
    ) as coverage_percentage
FROM medical_staff;

-- Verification 4: Detailed mapping report
SELECT
    ms.specialty as original_text,
    e.nome as mapped_to,
    COUNT(*) as record_count,
    CASE
        WHEN LOWER(TRIM(ms.specialty)) = LOWER(TRIM(e.nome)) THEN 'Exact Match'
        WHEN LOWER(e.nome) LIKE '%' || LOWER(TRIM(ms.specialty)) || '%' THEN 'Partial Match'
        WHEN LOWER(TRIM(ms.specialty)) LIKE '%' || LOWER(e.nome) || '%' THEN 'Fuzzy Match'
        ELSE 'Complex Match'
    END as match_quality
FROM medical_staff ms
LEFT JOIN especialidades e ON ms.especialidade_id = e.id
WHERE ms.specialty IS NOT NULL
GROUP BY ms.specialty, e.nome
ORDER BY record_count DESC, ms.specialty;

-- Verification 5: List any unmapped records requiring manual review
SELECT
    ms.id,
    ms.name as staff_name,
    ms.specialty as unmapped_specialty,
    ms.email,
    'NEEDS MANUAL MAPPING' as action_required
FROM medical_staff ms
WHERE ms.specialty IS NOT NULL
    AND TRIM(ms.specialty) != ''
    AND ms.especialidade_id IS NULL
ORDER BY ms.name;

-- Verification 6: List all especialidades with usage counts
SELECT
    e.nome as especialidade,
    COUNT(ms.id) as staff_count,
    ROUND(
        100.0 * COUNT(ms.id) / NULLIF((SELECT COUNT(*) FROM medical_staff WHERE especialidade_id IS NOT NULL), 0),
        2
    ) as percentage_of_staff
FROM especialidades e
LEFT JOIN medical_staff ms ON ms.especialidade_id = e.id
GROUP BY e.id, e.nome
ORDER BY staff_count DESC, e.nome;

-- Verification 7: Check for potential duplicates or issues
SELECT
    specialty as potential_issue,
    COUNT(DISTINCT especialidade_id) as mapped_to_count,
    STRING_AGG(DISTINCT e.nome, ', ') as mapped_to_names,
    COUNT(*) as record_count,
    CASE
        WHEN COUNT(DISTINCT especialidade_id) > 1 THEN '⚠ Multiple mappings - review needed'
        ELSE '✓ Consistent mapping'
    END as status
FROM medical_staff ms
LEFT JOIN especialidades e ON ms.especialidade_id = e.id
WHERE ms.specialty IS NOT NULL
GROUP BY ms.specialty
HAVING COUNT(DISTINCT especialidade_id) > 1
ORDER BY record_count DESC;

-- Verification 8: Final summary statistics
SELECT
    'FINAL MIGRATION SUMMARY' as summary,
    (SELECT COUNT(*) FROM medical_staff) as total_staff_records,
    (SELECT COUNT(*) FROM medical_staff WHERE specialty IS NOT NULL) as staff_with_old_specialty_field,
    (SELECT COUNT(*) FROM medical_staff WHERE especialidade_id IS NOT NULL) as staff_with_new_especialidade_id,
    (SELECT COUNT(*) FROM especialidades) as total_especialidades_available,
    (SELECT COUNT(DISTINCT especialidade_id) FROM medical_staff WHERE especialidade_id IS NOT NULL) as especialidades_in_use,
    CASE
        WHEN (SELECT COUNT(*) FROM medical_staff WHERE specialty IS NOT NULL AND TRIM(specialty) != '' AND especialidade_id IS NULL) = 0
        THEN '✓ ALL RECORDS MIGRATED SUCCESSFULLY'
        ELSE '⚠ SOME RECORDS NEED MANUAL REVIEW (see details above)'
    END as migration_status;
