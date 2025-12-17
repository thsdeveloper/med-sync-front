-- Migration: Create rate limiting system for attachment uploads
-- Feature: F034 - Add attachment management API endpoints and validation
-- Description: Implements rate limiting (max 10 uploads per hour per user)
-- Created: 2025-12-17

-- ============================================================================
-- TABLE: attachment_upload_rate_limits
-- ============================================================================
-- Tracks upload attempts per user for rate limiting enforcement
-- Automatically cleaned up after 1 hour to prevent table bloat

CREATE TABLE IF NOT EXISTS attachment_upload_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE attachment_upload_rate_limits IS
'Tracks attachment upload attempts for rate limiting enforcement. Records older than 1 hour are automatically cleaned up.';

COMMENT ON COLUMN attachment_upload_rate_limits.user_id IS
'Medical staff member who uploaded the attachment';

COMMENT ON COLUMN attachment_upload_rate_limits.uploaded_at IS
'Timestamp when the upload occurred (used for rate limit calculations)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for efficient rate limit queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_uploaded
ON attachment_upload_rate_limits(user_id, uploaded_at DESC);

-- Index for organization-level monitoring
CREATE INDEX IF NOT EXISTS idx_rate_limits_org_uploaded
ON attachment_upload_rate_limits(organization_id, uploaded_at DESC);

-- Partial index for recent uploads only (last hour - used for rate limit checks)
CREATE INDEX IF NOT EXISTS idx_rate_limits_recent_uploads
ON attachment_upload_rate_limits(user_id, uploaded_at)
WHERE uploaded_at > (now() - interval '1 hour');

-- ============================================================================
-- RPC FUNCTION: check_upload_rate_limit
-- ============================================================================
-- Checks if user has exceeded upload rate limit (10 per hour)
-- Returns boolean: true if allowed, false if rate limit exceeded

CREATE OR REPLACE FUNCTION check_upload_rate_limit(
    p_user_id UUID,
    p_organization_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_upload_count INTEGER;
    v_rate_limit INTEGER := 10; -- Max 10 uploads per hour
BEGIN
    -- Count uploads in the last hour
    SELECT COUNT(*)
    INTO v_upload_count
    FROM attachment_upload_rate_limits
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND uploaded_at > (now() - interval '1 hour');

    -- Return true if under limit, false if exceeded
    RETURN v_upload_count < v_rate_limit;
END;
$$;

COMMENT ON FUNCTION check_upload_rate_limit IS
'Checks if user has exceeded the upload rate limit (10 uploads per hour). Returns true if upload is allowed, false otherwise.';

-- ============================================================================
-- RPC FUNCTION: record_upload_attempt
-- ============================================================================
-- Records an upload attempt for rate limiting tracking
-- Should be called after successful file upload

CREATE OR REPLACE FUNCTION record_upload_attempt(
    p_user_id UUID,
    p_organization_id UUID,
    p_conversation_id UUID,
    p_file_name TEXT,
    p_file_size INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert rate limit record
    INSERT INTO attachment_upload_rate_limits (
        user_id,
        organization_id,
        conversation_id,
        file_name,
        file_size,
        uploaded_at
    ) VALUES (
        p_user_id,
        p_organization_id,
        p_conversation_id,
        p_file_name,
        p_file_size,
        now()
    );

    -- Clean up old rate limit records (older than 1 hour)
    DELETE FROM attachment_upload_rate_limits
    WHERE uploaded_at < (now() - interval '1 hour');

END;
$$;

COMMENT ON FUNCTION record_upload_attempt IS
'Records an upload attempt for rate limiting tracking. Automatically cleans up records older than 1 hour.';

-- ============================================================================
-- RPC FUNCTION: get_user_upload_stats
-- ============================================================================
-- Returns upload statistics for a user in the current hour
-- Used for displaying rate limit status to users

CREATE OR REPLACE FUNCTION get_user_upload_stats(
    p_user_id UUID,
    p_organization_id UUID
)
RETURNS TABLE (
    uploads_in_last_hour INTEGER,
    rate_limit INTEGER,
    remaining_uploads INTEGER,
    limit_resets_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_upload_count INTEGER;
    v_rate_limit INTEGER := 10;
    v_oldest_upload TIMESTAMPTZ;
BEGIN
    -- Count uploads in the last hour
    SELECT COUNT(*), MIN(uploaded_at)
    INTO v_upload_count, v_oldest_upload
    FROM attachment_upload_rate_limits
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND uploaded_at > (now() - interval '1 hour');

    -- Return statistics
    RETURN QUERY SELECT
        v_upload_count,
        v_rate_limit,
        GREATEST(0, v_rate_limit - v_upload_count),
        COALESCE(v_oldest_upload + interval '1 hour', now());
END;
$$;

COMMENT ON FUNCTION get_user_upload_stats IS
'Returns upload statistics for a user: uploads in last hour, rate limit, remaining uploads, and when the limit resets.';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE attachment_upload_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own rate limit records
CREATE POLICY staff_view_own_rate_limits ON attachment_upload_rate_limits
    FOR SELECT
    USING (
        user_id = auth.uid()
    );

-- Policy: System can insert rate limit records (via RPC functions only)
-- Note: Individual users cannot directly insert - must use RPC functions
CREATE POLICY system_insert_rate_limits ON attachment_upload_rate_limits
    FOR INSERT
    WITH CHECK (false); -- No direct inserts allowed, use RPC functions

-- Policy: Admins can view all rate limit records for their organization
CREATE POLICY admin_view_org_rate_limits ON attachment_upload_rate_limits
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM medical_staff ms
            WHERE ms.id = auth.uid()
              AND ms.organization_id = attachment_upload_rate_limits.organization_id
              AND ms.role = 'admin'
        )
    );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attachment_upload_rate_limits') THEN
        RAISE NOTICE '✅ Table attachment_upload_rate_limits created successfully';
    ELSE
        RAISE EXCEPTION '❌ Table attachment_upload_rate_limits was not created';
    END IF;
END $$;

-- Verify indexes exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rate_limits_user_uploaded') THEN
        RAISE NOTICE '✅ Index idx_rate_limits_user_uploaded created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rate_limits_recent_uploads') THEN
        RAISE NOTICE '✅ Index idx_rate_limits_recent_uploads created successfully';
    END IF;
END $$;

-- Verify RPC functions exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_upload_rate_limit') THEN
        RAISE NOTICE '✅ Function check_upload_rate_limit created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'record_upload_attempt') THEN
        RAISE NOTICE '✅ Function record_upload_attempt created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_upload_stats') THEN
        RAISE NOTICE '✅ Function get_user_upload_stats created successfully';
    END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'attachment_upload_rate_limits'
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS enabled on attachment_upload_rate_limits';
    ELSE
        RAISE WARNING '⚠️ RLS not enabled on attachment_upload_rate_limits';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS attachment_upload_rate_limits CASCADE;
-- DROP FUNCTION IF EXISTS check_upload_rate_limit(UUID, UUID);
-- DROP FUNCTION IF EXISTS record_upload_attempt(UUID, UUID, UUID, TEXT, INTEGER);
-- DROP FUNCTION IF EXISTS get_user_upload_stats(UUID, UUID);
