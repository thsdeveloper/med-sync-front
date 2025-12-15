-- ==========================================
-- Data Analysis Script for medical_staff.specialty
-- ==========================================
-- Purpose: Analyze all unique specialty values in medical_staff table
-- to identify duplicates, variations, typos, and mapping requirements
-- before migration to especialidade_id foreign key
--
-- Usage: Run this query to understand the current state of specialty data
-- ==========================================

-- Part 1: All unique specialty values with counts
SELECT
    specialty,
    COUNT(*) as record_count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM medical_staff
WHERE specialty IS NOT NULL
GROUP BY specialty
ORDER BY record_count DESC, specialty;

-- Part 2: Identify potential matches in especialidades table
WITH specialty_analysis AS (
    SELECT DISTINCT
        ms.specialty as current_value,
        COUNT(*) OVER (PARTITION BY ms.specialty) as usage_count,
        TRIM(BOTH FROM ms.specialty) as trimmed_value,
        LOWER(TRIM(BOTH FROM ms.specialty)) as normalized_value
    FROM medical_staff ms
    WHERE ms.specialty IS NOT NULL
)
SELECT
    sa.current_value,
    sa.usage_count,
    sa.trimmed_value,
    sa.normalized_value,
    e.nome as exact_match,
    e.id as exact_match_id,
    CASE
        WHEN e.nome IS NOT NULL THEN 'EXACT_MATCH'
        WHEN EXISTS (
            SELECT 1 FROM especialidades e2
            WHERE LOWER(e2.nome) LIKE LOWER(sa.trimmed_value) || '%'
        ) THEN 'PREFIX_MATCH'
        WHEN EXISTS (
            SELECT 1 FROM especialidades e2
            WHERE LOWER(e2.nome) LIKE '%' || LOWER(sa.trimmed_value) || '%'
        ) THEN 'PARTIAL_MATCH'
        ELSE 'NO_MATCH'
    END as match_type,
    (
        SELECT e2.nome
        FROM especialidades e2
        WHERE LOWER(e2.nome) LIKE '%' || LOWER(sa.trimmed_value) || '%'
        LIMIT 1
    ) as suggested_match
FROM specialty_analysis sa
LEFT JOIN especialidades e ON LOWER(TRIM(BOTH FROM e.nome)) = sa.normalized_value
ORDER BY sa.usage_count DESC, sa.current_value;

-- Part 3: Records with NULL or empty specialty values
SELECT
    COUNT(*) as null_or_empty_count,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM medical_staff) as percentage
FROM medical_staff
WHERE specialty IS NULL OR TRIM(specialty) = '';

-- Part 4: Identify specialties that need manual review
SELECT DISTINCT
    specialty as needs_review,
    COUNT(*) as count,
    'No clear match in especialidades table' as reason
FROM medical_staff
WHERE specialty IS NOT NULL
    AND TRIM(specialty) != ''
    AND NOT EXISTS (
        SELECT 1 FROM especialidades e
        WHERE LOWER(TRIM(e.nome)) = LOWER(TRIM(specialty))
           OR LOWER(e.nome) LIKE '%' || LOWER(TRIM(specialty)) || '%'
    )
GROUP BY specialty
ORDER BY count DESC;

-- Part 5: Summary statistics
SELECT
    'Total medical_staff records' as metric,
    COUNT(*) as value
FROM medical_staff
UNION ALL
SELECT
    'Records with specialty set',
    COUNT(*)
FROM medical_staff
WHERE specialty IS NOT NULL AND TRIM(specialty) != ''
UNION ALL
SELECT
    'Unique specialty values',
    COUNT(DISTINCT specialty)
FROM medical_staff
WHERE specialty IS NOT NULL
UNION ALL
SELECT
    'Available especialidades',
    COUNT(*)
FROM especialidades;
