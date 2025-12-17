-- Migration: Create audit logging system for attachment operations
-- Feature: F034 - Add attachment management API endpoints and validation
-- Description: Implements comprehensive audit trail for all attachment operations
-- Created: 2025-12-17

-- ============================================================================
-- TABLE: attachment_audit_logs
-- ============================================================================
-- Comprehensive audit trail for all attachment operations
-- Retention: 90 days (configurable via cleanup job)

CREATE TABLE IF NOT EXISTS attachment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attachment_id UUID REFERENCES chat_attachments(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN (
        'upload',
        'upload_failed',
        'status_change',
        'view',
        'download',
        'delete',
        'delete_failed',
        'cleanup_orphaned',
        'cleanup_message_deleted'
    )),

    -- Actor information
    actor_id UUID REFERENCES medical_staff(id) ON DELETE SET NULL,
    actor_role TEXT, -- 'admin', 'staff', 'system'

    -- Context information
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,

    -- Metadata (flexible JSONB for action-specific details)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Status tracking
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,

    -- Network information
    ip_address INET,
    user_agent TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE attachment_audit_logs IS
'Comprehensive audit trail for all attachment operations. Records are retained for 90 days for compliance and security monitoring.';

COMMENT ON COLUMN attachment_audit_logs.action IS
'Type of operation: upload, status_change, view, download, delete, cleanup_orphaned, cleanup_message_deleted';

COMMENT ON COLUMN attachment_audit_logs.metadata IS
'Flexible JSON field for action-specific details: file_name, file_type, file_size, old_status, new_status, rejected_reason, etc.';

COMMENT ON COLUMN attachment_audit_logs.actor_role IS
'Role of the user performing the action: admin, staff, or system (for automated operations)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying logs by attachment
CREATE INDEX IF NOT EXISTS idx_audit_logs_attachment_id
ON attachment_audit_logs(attachment_id, created_at DESC);

-- Index for querying logs by actor
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
ON attachment_audit_logs(actor_id, created_at DESC);

-- Index for querying logs by organization
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id
ON attachment_audit_logs(organization_id, created_at DESC);

-- Index for querying logs by conversation
CREATE INDEX IF NOT EXISTS idx_audit_logs_conversation_id
ON attachment_audit_logs(conversation_id, created_at DESC);

-- Index for querying logs by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON attachment_audit_logs(action, created_at DESC);

-- Partial index for failed operations
CREATE INDEX IF NOT EXISTS idx_audit_logs_failures
ON attachment_audit_logs(action, created_at DESC)
WHERE success = false;

-- Index for cleanup queries (logs older than retention period)
CREATE INDEX IF NOT EXISTS idx_audit_logs_cleanup
ON attachment_audit_logs(created_at)
WHERE created_at < (now() - interval '90 days');

-- ============================================================================
-- RPC FUNCTION: log_attachment_operation
-- ============================================================================
-- Logs an attachment operation to the audit trail
-- Called by other RPC functions and database triggers

CREATE OR REPLACE FUNCTION log_attachment_operation(
    p_attachment_id UUID,
    p_action TEXT,
    p_actor_id UUID,
    p_actor_role TEXT,
    p_organization_id UUID,
    p_conversation_id UUID DEFAULT NULL,
    p_message_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- Insert audit log record
    INSERT INTO attachment_audit_logs (
        attachment_id,
        action,
        actor_id,
        actor_role,
        organization_id,
        conversation_id,
        message_id,
        metadata,
        success,
        error_message,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_attachment_id,
        p_action,
        p_actor_id,
        p_actor_role,
        p_organization_id,
        p_conversation_id,
        p_message_id,
        p_metadata,
        p_success,
        p_error_message,
        p_ip_address,
        p_user_agent,
        now()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION log_attachment_operation IS
'Logs an attachment operation to the audit trail. Returns the log entry ID.';

-- ============================================================================
-- RPC FUNCTION: get_attachment_audit_trail
-- ============================================================================
-- Retrieves complete audit trail for a specific attachment
-- Used for compliance reporting and security investigation

CREATE OR REPLACE FUNCTION get_attachment_audit_trail(
    p_attachment_id UUID,
    p_organization_id UUID
)
RETURNS TABLE (
    id UUID,
    action TEXT,
    actor_name TEXT,
    actor_role TEXT,
    success BOOLEAN,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify user has permission to view audit logs (admin only)
    IF NOT EXISTS (
        SELECT 1 FROM medical_staff ms
        WHERE ms.id = auth.uid()
          AND ms.organization_id = p_organization_id
          AND ms.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Permission denied: Only admins can view audit logs';
    END IF;

    -- Return audit trail with actor names
    RETURN QUERY
    SELECT
        aal.id,
        aal.action,
        ms.name AS actor_name,
        aal.actor_role,
        aal.success,
        aal.error_message,
        aal.metadata,
        aal.created_at
    FROM attachment_audit_logs aal
    LEFT JOIN medical_staff ms ON ms.id = aal.actor_id
    WHERE aal.attachment_id = p_attachment_id
      AND aal.organization_id = p_organization_id
    ORDER BY aal.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_attachment_audit_trail IS
'Retrieves complete audit trail for a specific attachment. Admin-only access.';

-- ============================================================================
-- RPC FUNCTION: get_organization_audit_report
-- ============================================================================
-- Generates audit report for organization within date range
-- Used for compliance reporting and security monitoring

CREATE OR REPLACE FUNCTION get_organization_audit_report(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT (now() - interval '30 days'),
    p_end_date TIMESTAMPTZ DEFAULT now(),
    p_action_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    action TEXT,
    total_operations BIGINT,
    successful_operations BIGINT,
    failed_operations BIGINT,
    unique_actors BIGINT,
    unique_attachments BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify user has permission to view audit reports (admin only)
    IF NOT EXISTS (
        SELECT 1 FROM medical_staff ms
        WHERE ms.id = auth.uid()
          AND ms.organization_id = p_organization_id
          AND ms.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Permission denied: Only admins can view audit reports';
    END IF;

    -- Return aggregated audit statistics
    RETURN QUERY
    SELECT
        aal.action,
        COUNT(*) AS total_operations,
        COUNT(*) FILTER (WHERE aal.success = true) AS successful_operations,
        COUNT(*) FILTER (WHERE aal.success = false) AS failed_operations,
        COUNT(DISTINCT aal.actor_id) AS unique_actors,
        COUNT(DISTINCT aal.attachment_id) AS unique_attachments
    FROM attachment_audit_logs aal
    WHERE aal.organization_id = p_organization_id
      AND aal.created_at BETWEEN p_start_date AND p_end_date
      AND (p_action_filter IS NULL OR aal.action = p_action_filter)
    GROUP BY aal.action
    ORDER BY total_operations DESC;
END;
$$;

COMMENT ON FUNCTION get_organization_audit_report IS
'Generates aggregated audit report for organization within date range. Admin-only access.';

-- ============================================================================
-- RPC FUNCTION: cleanup_old_audit_logs
-- ============================================================================
-- Cleans up audit logs older than retention period (90 days)
-- Should be called by scheduled job

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
    p_retention_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    deleted_count BIGINT,
    oldest_remaining TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count BIGINT;
    v_oldest_remaining TIMESTAMPTZ;
BEGIN
    -- Delete old audit logs
    DELETE FROM attachment_audit_logs
    WHERE created_at < (now() - make_interval(days => p_retention_days));

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Get oldest remaining log
    SELECT MIN(created_at)
    INTO v_oldest_remaining
    FROM attachment_audit_logs;

    -- Return statistics
    RETURN QUERY SELECT v_deleted_count, v_oldest_remaining;
END;
$$;

COMMENT ON FUNCTION cleanup_old_audit_logs IS
'Cleans up audit logs older than retention period (default 90 days). Returns count of deleted records and oldest remaining timestamp.';

-- ============================================================================
-- TRIGGER: Auto-log attachment status changes
-- ============================================================================
-- Automatically logs status changes to audit trail

CREATE OR REPLACE FUNCTION trigger_log_attachment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_organization_id UUID;
    v_actor_role TEXT;
BEGIN
    -- Get organization_id from conversation
    SELECT cc.organization_id
    INTO v_organization_id
    FROM chat_conversations cc
    WHERE cc.id = NEW.conversation_id;

    -- Determine actor role
    SELECT ms.role
    INTO v_actor_role
    FROM medical_staff ms
    WHERE ms.id = NEW.reviewed_by;

    -- Log status change
    PERFORM log_attachment_operation(
        p_attachment_id => NEW.id,
        p_action => 'status_change',
        p_actor_id => NEW.reviewed_by,
        p_actor_role => COALESCE(v_actor_role, 'system'),
        p_organization_id => v_organization_id,
        p_conversation_id => NEW.conversation_id,
        p_message_id => NEW.message_id,
        p_metadata => jsonb_build_object(
            'file_name', NEW.file_name,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'rejected_reason', NEW.rejected_reason
        ),
        p_success => true
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_attachment_status_change
    AFTER UPDATE ON chat_attachments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trigger_log_attachment_status_change();

COMMENT ON TRIGGER trigger_audit_attachment_status_change ON chat_attachments IS
'Automatically logs attachment status changes to the audit trail.';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE attachment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit logs for their own actions
CREATE POLICY staff_view_own_audit_logs ON attachment_audit_logs
    FOR SELECT
    USING (
        actor_id = auth.uid()
    );

-- Policy: Admins can view all audit logs for their organization
CREATE POLICY admin_view_org_audit_logs ON attachment_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM medical_staff ms
            WHERE ms.id = auth.uid()
              AND ms.organization_id = attachment_audit_logs.organization_id
              AND ms.role = 'admin'
        )
    );

-- Policy: System can insert audit logs (via RPC functions only)
CREATE POLICY system_insert_audit_logs ON attachment_audit_logs
    FOR INSERT
    WITH CHECK (false); -- No direct inserts allowed, use RPC functions

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attachment_audit_logs') THEN
        RAISE NOTICE '✅ Table attachment_audit_logs created successfully';
    ELSE
        RAISE EXCEPTION '❌ Table attachment_audit_logs was not created';
    END IF;
END $$;

-- Verify indexes exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_attachment_id') THEN
        RAISE NOTICE '✅ Index idx_audit_logs_attachment_id created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_actor_id') THEN
        RAISE NOTICE '✅ Index idx_audit_logs_actor_id created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_failures') THEN
        RAISE NOTICE '✅ Index idx_audit_logs_failures created successfully';
    END IF;
END $$;

-- Verify RPC functions exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_attachment_operation') THEN
        RAISE NOTICE '✅ Function log_attachment_operation created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_attachment_audit_trail') THEN
        RAISE NOTICE '✅ Function get_attachment_audit_trail created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_organization_audit_report') THEN
        RAISE NOTICE '✅ Function get_organization_audit_report created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_audit_logs') THEN
        RAISE NOTICE '✅ Function cleanup_old_audit_logs created successfully';
    END IF;
END $$;

-- Verify trigger exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_audit_attachment_status_change') THEN
        RAISE NOTICE '✅ Trigger trigger_audit_attachment_status_change created successfully';
    END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'attachment_audit_logs'
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS enabled on attachment_audit_logs';
    ELSE
        RAISE WARNING '⚠️ RLS not enabled on attachment_audit_logs';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, run:
-- DROP TRIGGER IF EXISTS trigger_audit_attachment_status_change ON chat_attachments;
-- DROP FUNCTION IF EXISTS trigger_log_attachment_status_change();
-- DROP TABLE IF EXISTS attachment_audit_logs CASCADE;
-- DROP FUNCTION IF EXISTS log_attachment_operation(UUID, TEXT, UUID, TEXT, UUID, UUID, UUID, JSONB, BOOLEAN, TEXT, INET, TEXT);
-- DROP FUNCTION IF EXISTS get_attachment_audit_trail(UUID, UUID);
-- DROP FUNCTION IF EXISTS get_organization_audit_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT);
-- DROP FUNCTION IF EXISTS cleanup_old_audit_logs(INTEGER);
