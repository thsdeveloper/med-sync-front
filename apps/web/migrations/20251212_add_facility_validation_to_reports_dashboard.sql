-- Migration: Add facility validation to reports_dashboard_metrics RPC function
-- Description: Validates facility_id exists when p_unit parameter is provided (not 'todas')
-- Improves error handling and adds documentation for facility filtering

CREATE OR REPLACE FUNCTION reports_dashboard_metrics(
    p_period TEXT DEFAULT '30d',
    p_specialty TEXT DEFAULT 'todas',
    p_unit TEXT DEFAULT 'todas'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_period_days INTEGER;
    v_result JSON;
    v_summary JSON;
    v_specialty_trend JSON;
    v_efficiency_trend JSON;
    v_financial_trend JSON;
    v_highlights JSON;
    v_total_shifts INTEGER;
    v_accepted_shifts INTEGER;
    v_coverage_rate NUMERIC;
    v_avg_rate NUMERIC;
    v_total_revenue NUMERIC;
    v_previous_revenue NUMERIC;
    v_revenue_delta NUMERIC;
    v_current_occupancy NUMERIC;
    v_previous_occupancy NUMERIC;
    v_occupancy_delta NUMERIC;
    v_facility_exists BOOLEAN;
BEGIN
    -- Validate facility_id exists when p_unit is not 'todas'
    -- This ensures data integrity and prevents queries against non-existent facilities
    IF p_unit != 'todas' THEN
        SELECT EXISTS (
            SELECT 1
            FROM facilities
            WHERE id::TEXT = p_unit
        ) INTO v_facility_exists;

        IF NOT v_facility_exists THEN
            RAISE EXCEPTION 'Facility with id % does not exist', p_unit
                USING HINT = 'Please provide a valid facility_id or use ''todas'' to query all facilities';
        END IF;
    END IF;

    -- Set date range based on period parameter
    v_end_date := NOW();

    CASE p_period
        WHEN '7d' THEN
            v_period_days := 7;
            v_start_date := v_end_date - INTERVAL '7 days';
        WHEN '30d' THEN
            v_period_days := 30;
            v_start_date := v_end_date - INTERVAL '30 days';
        WHEN '90d' THEN
            v_period_days := 90;
            v_start_date := v_end_date - INTERVAL '90 days';
        WHEN '180d' THEN
            v_period_days := 180;
            v_start_date := v_end_date - INTERVAL '180 days';
        ELSE
            v_period_days := 30;
            v_start_date := v_end_date - INTERVAL '30 days';
    END CASE;

    -- Calculate total shifts in period with filters
    -- Filters by specialty (medical_staff.specialty) and facility (shifts.facility_id)
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE s.status = 'accepted')
    INTO v_total_shifts, v_accepted_shifts
    FROM shifts s
    LEFT JOIN medical_staff ms ON s.staff_id = ms.id
    LEFT JOIN facilities f ON s.facility_id = f.id
    WHERE s.start_time >= v_start_date
        AND s.start_time <= v_end_date
        AND (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
        AND (p_unit = 'todas' OR f.id::TEXT = p_unit);

    -- Calculate coverage rate
    v_coverage_rate := CASE
        WHEN v_total_shifts > 0 THEN (v_accepted_shifts::NUMERIC / v_total_shifts::NUMERIC * 100)
        ELSE 0
    END;

    -- Calculate average payment rate from payment_records
    -- Filtered by specialty and facility to match selected filters
    SELECT COALESCE(AVG(base_rate), 0)
    INTO v_avg_rate
    FROM payment_records pr
    LEFT JOIN medical_staff ms ON pr.staff_id = ms.id
    LEFT JOIN facilities f ON pr.facility_id = f.id
    WHERE pr.shift_start_time >= v_start_date
        AND pr.shift_start_time <= v_end_date
        AND (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
        AND (p_unit = 'todas' OR f.id::TEXT = p_unit);

    -- Calculate total revenue
    -- Aggregates payment_records.total_amount filtered by specialty and facility
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_revenue
    FROM payment_records pr
    LEFT JOIN medical_staff ms ON pr.staff_id = ms.id
    LEFT JOIN facilities f ON pr.facility_id = f.id
    WHERE pr.shift_start_time >= v_start_date
        AND pr.shift_start_time <= v_end_date
        AND (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
        AND (p_unit = 'todas' OR f.id::TEXT = p_unit);

    -- Calculate previous period revenue for delta
    -- Compares current period revenue with equivalent previous period
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_previous_revenue
    FROM payment_records pr
    LEFT JOIN medical_staff ms ON pr.staff_id = ms.id
    LEFT JOIN facilities f ON pr.facility_id = f.id
    WHERE pr.shift_start_time >= (v_start_date - (v_end_date - v_start_date))
        AND pr.shift_start_time < v_start_date
        AND (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
        AND (p_unit = 'todas' OR f.id::TEXT = p_unit);

    v_revenue_delta := CASE
        WHEN v_previous_revenue > 0 THEN ((v_total_revenue - v_previous_revenue) / v_previous_revenue * 100)
        ELSE 0
    END;

    -- Calculate current and previous occupancy (coverage rate as proxy)
    v_current_occupancy := v_coverage_rate;

    SELECT
        CASE
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE s.status = 'accepted')::NUMERIC / COUNT(*)::NUMERIC * 100)
            ELSE 0
        END
    INTO v_previous_occupancy
    FROM shifts s
    LEFT JOIN medical_staff ms ON s.staff_id = ms.id
    LEFT JOIN facilities f ON s.facility_id = f.id
    WHERE s.start_time >= (v_start_date - (v_end_date - v_start_date))
        AND s.start_time < v_start_date
        AND (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
        AND (p_unit = 'todas' OR f.id::TEXT = p_unit);

    v_occupancy_delta := v_current_occupancy - COALESCE(v_previous_occupancy, v_current_occupancy);

    -- Build summary metrics array
    v_summary := json_build_array(
        json_build_object(
            'id', 'assistance',
            'label', 'Atendimentos no período',
            'value', v_accepted_shifts::TEXT,
            'helper', 'Plantões aceitos',
            'delta', ROUND((v_accepted_shifts::NUMERIC / NULLIF(v_total_shifts, 0) * 100 - 80), 1)
        ),
        json_build_object(
            'id', 'occupancy',
            'label', 'Taxa média de ocupação',
            'value', ROUND(v_coverage_rate, 1)::TEXT || '%',
            'helper', 'Meta: 82%',
            'delta', ROUND(v_occupancy_delta, 1)
        ),
        json_build_object(
            'id', 'revenue',
            'label', 'Receita assistencial',
            'value', 'R$ ' || TO_CHAR(v_total_revenue, 'FM999G999G999'),
            'helper', 'Considera convênios + particular',
            'delta', ROUND(v_revenue_delta, 1)
        ),
        json_build_object(
            'id', 'average_rate',
            'label', 'Taxa média por hora',
            'value', 'R$ ' || TO_CHAR(v_avg_rate, 'FM999G999'),
            'helper', 'Baseado em registros de pagamento',
            'delta', 0
        )
    );

    -- Build specialty trend (aggregated by week or month depending on period)
    -- Respects both p_specialty and p_unit filters
    WITH date_series AS (
        SELECT
            generate_series(
                DATE_TRUNC('day', v_start_date),
                DATE_TRUNC('day', v_end_date),
                CASE
                    WHEN v_period_days <= 30 THEN INTERVAL '7 days'
                    ELSE INTERVAL '30 days'
                END
            ) AS period_start
    ),
    specialty_counts AS (
        SELECT
            ds.period_start,
            COALESCE(LOWER(ms.specialty), 'geral') as specialty,
            COUNT(s.id) as count
        FROM date_series ds
        LEFT JOIN shifts s ON s.start_time >= ds.period_start
            AND s.start_time < ds.period_start + CASE
                WHEN v_period_days <= 30 THEN INTERVAL '7 days'
                ELSE INTERVAL '30 days'
            END
            AND s.status = 'accepted'
        LEFT JOIN medical_staff ms ON s.staff_id = ms.id
        LEFT JOIN facilities f ON s.facility_id = f.id
        WHERE (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
            AND (p_unit = 'todas' OR f.id::TEXT = p_unit)
        GROUP BY ds.period_start, COALESCE(LOWER(ms.specialty), 'geral')
    ),
    pivoted AS (
        SELECT
            period_start,
            SUM(CASE WHEN specialty = 'geral' THEN count ELSE 0 END) as geral,
            SUM(CASE WHEN LOWER(specialty) LIKE '%cardio%' THEN count ELSE 0 END) as cardiologia,
            SUM(CASE WHEN LOWER(specialty) LIKE '%pediatr%' THEN count ELSE 0 END) as pediatria
        FROM specialty_counts
        GROUP BY period_start
    )
    SELECT json_agg(
        json_build_object(
            'label', TO_CHAR(period_start, 'Mon'),
            'geral', geral,
            'cardiologia', cardiologia,
            'pediatria', pediatria
        ) ORDER BY period_start
    )
    INTO v_specialty_trend
    FROM pivoted;

    -- Build efficiency trend (coverage rate over time)
    -- Filtered by specialty and facility
    WITH date_series AS (
        SELECT
            generate_series(
                DATE_TRUNC('day', v_start_date),
                DATE_TRUNC('day', v_end_date),
                CASE
                    WHEN v_period_days <= 30 THEN INTERVAL '7 days'
                    ELSE INTERVAL '30 days'
                END
            ) AS period_start
    ),
    period_stats AS (
        SELECT
            ds.period_start,
            COUNT(s.id) as total_shifts,
            COUNT(s.id) FILTER (WHERE s.status = 'accepted') as accepted_shifts
        FROM date_series ds
        LEFT JOIN shifts s ON s.start_time >= ds.period_start
            AND s.start_time < ds.period_start + CASE
                WHEN v_period_days <= 30 THEN INTERVAL '7 days'
                ELSE INTERVAL '30 days'
            END
        LEFT JOIN medical_staff ms ON s.staff_id = ms.id
        LEFT JOIN facilities f ON s.facility_id = f.id
        WHERE (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
            AND (p_unit = 'todas' OR f.id::TEXT = p_unit)
        GROUP BY ds.period_start
    )
    SELECT json_agg(
        json_build_object(
            'label', TO_CHAR(period_start, 'Mon'),
            'ocupacao', ROUND(COALESCE(
                (accepted_shifts::NUMERIC / NULLIF(total_shifts, 0) * 100),
                0
            ), 1),
            'sla', ROUND(COALESCE(
                100 - (accepted_shifts::NUMERIC / NULLIF(total_shifts, 0) * 100),
                0
            ), 1)
        ) ORDER BY period_start
    )
    INTO v_efficiency_trend
    FROM period_stats;

    -- Build financial trend (revenue over time)
    -- Filtered by specialty and facility
    WITH date_series AS (
        SELECT
            generate_series(
                DATE_TRUNC('day', v_start_date),
                DATE_TRUNC('day', v_end_date),
                CASE
                    WHEN v_period_days <= 30 THEN INTERVAL '7 days'
                    ELSE INTERVAL '30 days'
                END
            ) AS period_start
    ),
    revenue_by_period AS (
        SELECT
            ds.period_start,
            COALESCE(SUM(pr.total_amount), 0) as receita
        FROM date_series ds
        LEFT JOIN payment_records pr ON pr.shift_start_time >= ds.period_start
            AND pr.shift_start_time < ds.period_start + CASE
                WHEN v_period_days <= 30 THEN INTERVAL '7 days'
                ELSE INTERVAL '30 days'
            END
        LEFT JOIN medical_staff ms ON pr.staff_id = ms.id
        LEFT JOIN facilities f ON pr.facility_id = f.id
        WHERE (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
            AND (p_unit = 'todas' OR f.id::TEXT = p_unit)
        GROUP BY ds.period_start
    )
    SELECT json_agg(
        json_build_object(
            'label', TO_CHAR(period_start, 'Mon'),
            'receita', receita,
            'glosas', 0
        ) ORDER BY period_start
    )
    INTO v_financial_trend
    FROM revenue_by_period;

    -- Build highlights (top performers by shift count)
    -- IMPORTANT: Filtered by both specialty and facility to show relevant top performers
    SELECT json_agg(
        json_build_object(
            'id', staff_name,
            'name', staff_name,
            'specialty', staff_specialty,
            'unit', facility_name,
            'volume', shift_count,
            'variation', ROUND((RANDOM() * 10)::NUMERIC, 1)
        )
    )
    INTO v_highlights
    FROM (
        SELECT
            COALESCE(ms.name, 'N/A') as staff_name,
            COALESCE(ms.specialty, 'Geral') as staff_specialty,
            COALESCE(f.name, 'N/A') as facility_name,
            COUNT(s.id) as shift_count
        FROM shifts s
        LEFT JOIN medical_staff ms ON s.staff_id = ms.id
        LEFT JOIN facilities f ON s.facility_id = f.id
        WHERE s.start_time >= v_start_date
            AND s.start_time <= v_end_date
            AND s.status = 'accepted'
            AND (p_specialty = 'todas' OR LOWER(COALESCE(ms.specialty, 'geral')) = LOWER(p_specialty))
            AND (p_unit = 'todas' OR f.id::TEXT = p_unit)
            AND ms.id IS NOT NULL
        GROUP BY ms.name, ms.specialty, f.name
        ORDER BY shift_count DESC
        LIMIT 5
    ) top_performers;

    -- Handle null arrays
    v_specialty_trend := COALESCE(v_specialty_trend, '[]'::JSON);
    v_efficiency_trend := COALESCE(v_efficiency_trend, '[]'::JSON);
    v_financial_trend := COALESCE(v_financial_trend, '[]'::JSON);
    v_highlights := COALESCE(v_highlights, '[]'::JSON);

    -- Build final result matching ReportMetricsBundle interface
    v_result := json_build_object(
        'summary', v_summary,
        'specialtyTrend', v_specialty_trend,
        'efficiencyTrend', v_efficiency_trend,
        'financialTrend', v_financial_trend,
        'highlights', v_highlights
    );

    RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION reports_dashboard_metrics(TEXT, TEXT, TEXT) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION reports_dashboard_metrics IS 'Aggregates dashboard metrics from shifts, medical_staff, facilities, and payment_records tables. Returns JSON matching ReportMetricsBundle TypeScript interface. Filters by specialty and facility (unit) parameters. Validates facility_id exists when p_unit != ''todas''. Handles NULL specialty values with COALESCE.';
