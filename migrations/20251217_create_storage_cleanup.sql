-- Migration: Create storage cleanup system for attachments
-- Feature: F034 - Add attachment management API endpoints and validation
-- Description: Implements automatic cleanup of orphaned attachments and storage files
-- Created: 2025-12-17

-- ============================================================================
-- TRIGGER: Cleanup attachments when message is deleted
-- ============================================================================
-- Automatically deletes attachments and storage files when parent message is deleted
-- Logs cleanup action to audit trail

CREATE OR REPLACE FUNCTION trigger_cleanup_message_attachments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attachment RECORD;
    v_organization_id UUID;
BEGIN
    -- Get organization_id from conversation
    SELECT cc.organization_id
    INTO v_organization_id
    FROM chat_conversations cc
    WHERE cc.id = OLD.conversation_id;

    -- Loop through all attachments for this message
    FOR v_attachment IN
        SELECT id, file_name, file_path, file_type, file_size
        FROM chat_attachments
        WHERE message_id = OLD.id
    LOOP
        -- Log cleanup action to audit trail
        PERFORM log_attachment_operation(
            p_attachment_id => v_attachment.id,
            p_action => 'cleanup_message_deleted',
            p_actor_id => NULL, -- System action
            p_actor_role => 'system',
            p_organization_id => v_organization_id,
            p_conversation_id => OLD.conversation_id,
            p_message_id => OLD.id,
            p_metadata => jsonb_build_object(
                'file_name', v_attachment.file_name,
                'file_path', v_attachment.file_path,
                'file_type', v_attachment.file_type,
                'file_size', v_attachment.file_size,
                'reason', 'parent_message_deleted'
            ),
            p_success => true
        );

        -- Note: Storage file deletion must be handled by the application layer
        -- Supabase storage.remove() requires client-side call with proper auth
        -- The chat_attachments record deletion will cascade automatically due to ON DELETE CASCADE

    END LOOP;

    RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_cleanup_attachments_on_message_delete
    BEFORE DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_message_attachments();

COMMENT ON TRIGGER trigger_cleanup_attachments_on_message_delete ON chat_messages IS
'Automatically logs attachment cleanup when parent message is deleted. Storage file cleanup must be handled by application layer.';

-- ============================================================================
-- RPC FUNCTION: cleanup_orphaned_attachments
-- ============================================================================
-- Identifies and cleans up orphaned attachments (no message_id for >7 days)
-- Should be called by scheduled job or manually by admin
-- Returns list of cleaned up attachments for storage file removal

CREATE OR REPLACE FUNCTION cleanup_orphaned_attachments(
    p_organization_id UUID,
    p_grace_period_days INTEGER DEFAULT 7,
    p_dry_run BOOLEAN DEFAULT false
)
RETURNS TABLE (
    attachment_id UUID,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ,
    age_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_orphaned_record RECORD;
    v_deleted_count INTEGER := 0;
BEGIN
    -- Verify user has permission (admin only for non-dry-run)
    IF p_dry_run = false THEN
        IF NOT EXISTS (
            SELECT 1 FROM medical_staff ms
            WHERE ms.id = auth.uid()
              AND ms.organization_id = p_organization_id
              AND ms.role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Permission denied: Only admins can cleanup orphaned attachments';
        END IF;
    END IF;

    -- Find and process orphaned attachments
    FOR v_orphaned_record IN
        SELECT
            ca.id,
            ca.file_path,
            ca.file_name,
            ca.file_size,
            ca.created_at,
            EXTRACT(DAY FROM (now() - ca.created_at))::INTEGER AS age_days,
            ca.conversation_id
        FROM chat_attachments ca
        INNER JOIN chat_conversations cc ON cc.id = ca.conversation_id
        WHERE cc.organization_id = p_organization_id
          AND ca.message_id IS NULL -- Orphaned (not linked to message)
          AND ca.created_at < (now() - make_interval(days => p_grace_period_days))
        ORDER BY ca.created_at ASC
    LOOP
        -- Return record for storage cleanup
        attachment_id := v_orphaned_record.id;
        file_path := v_orphaned_record.file_path;
        file_name := v_orphaned_record.file_name;
        file_size := v_orphaned_record.file_size;
        created_at := v_orphaned_record.created_at;
        age_days := v_orphaned_record.age_days;
        RETURN NEXT;

        -- If not dry run, log and delete the record
        IF p_dry_run = false THEN
            -- Log cleanup action
            PERFORM log_attachment_operation(
                p_attachment_id => v_orphaned_record.id,
                p_action => 'cleanup_orphaned',
                p_actor_id => auth.uid(),
                p_actor_role => 'admin',
                p_organization_id => p_organization_id,
                p_conversation_id => v_orphaned_record.conversation_id,
                p_message_id => NULL,
                p_metadata => jsonb_build_object(
                    'file_name', v_orphaned_record.file_name,
                    'file_path', v_orphaned_record.file_path,
                    'file_size', v_orphaned_record.file_size,
                    'age_days', v_orphaned_record.age_days,
                    'grace_period_days', p_grace_period_days,
                    'reason', 'orphaned_no_message_link'
                ),
                p_success => true
            );

            -- Delete the attachment record
            DELETE FROM chat_attachments WHERE id = v_orphaned_record.id;
            v_deleted_count := v_deleted_count + 1;
        END IF;
    END LOOP;

    -- Log summary
    IF p_dry_run = false THEN
        RAISE NOTICE 'Cleaned up % orphaned attachment(s)', v_deleted_count;
    ELSE
        RAISE NOTICE 'Dry run: Found % orphaned attachment(s) eligible for cleanup', v_deleted_count;
    END IF;

END;
$$;

COMMENT ON FUNCTION cleanup_orphaned_attachments IS
'Identifies and cleans up orphaned attachments (no message_id for >7 days). Returns list of attachments for storage file removal. Use p_dry_run=true to preview without deleting.';

-- ============================================================================
-- RPC FUNCTION: delete_attachment
-- ============================================================================
-- Deletes an attachment record and logs the action
-- Storage file deletion must be handled by application layer
-- Validates user permissions before deletion

CREATE OR REPLACE FUNCTION delete_attachment(
    p_attachment_id UUID,
    p_organization_id UUID,
    p_reason TEXT DEFAULT 'user_requested'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attachment RECORD;
    v_user_role TEXT;
    v_has_permission BOOLEAN := false;
BEGIN
    -- Get attachment details
    SELECT ca.*, cc.organization_id
    INTO v_attachment
    FROM chat_attachments ca
    INNER JOIN chat_conversations cc ON cc.id = ca.conversation_id
    WHERE ca.id = p_attachment_id;

    -- Check if attachment exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Attachment not found'
        );
    END IF;

    -- Verify organization matches
    IF v_attachment.organization_id != p_organization_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Organization mismatch'
        );
    END IF;

    -- Get user role
    SELECT role INTO v_user_role
    FROM medical_staff
    WHERE id = auth.uid()
      AND organization_id = p_organization_id;

    -- Check permissions:
    -- - Admins can delete any attachment
    -- - Users can delete their own attachments (if pending or not yet linked to message)
    IF v_user_role = 'admin' THEN
        v_has_permission := true;
    ELSIF v_attachment.sender_id = auth.uid() AND (v_attachment.status = 'pending' OR v_attachment.message_id IS NULL) THEN
        v_has_permission := true;
    END IF;

    -- Verify permission
    IF NOT v_has_permission THEN
        -- Log failed attempt
        PERFORM log_attachment_operation(
            p_attachment_id => p_attachment_id,
            p_action => 'delete_failed',
            p_actor_id => auth.uid(),
            p_actor_role => COALESCE(v_user_role, 'unknown'),
            p_organization_id => p_organization_id,
            p_conversation_id => v_attachment.conversation_id,
            p_message_id => v_attachment.message_id,
            p_metadata => jsonb_build_object(
                'file_name', v_attachment.file_name,
                'reason', p_reason
            ),
            p_success => false,
            p_error_message => 'Permission denied'
        );

        RETURN jsonb_build_object(
            'success', false,
            'error', 'Permission denied'
        );
    END IF;

    -- Log deletion
    PERFORM log_attachment_operation(
        p_attachment_id => p_attachment_id,
        p_action => 'delete',
        p_actor_id => auth.uid(),
        p_actor_role => v_user_role,
        p_organization_id => p_organization_id,
        p_conversation_id => v_attachment.conversation_id,
        p_message_id => v_attachment.message_id,
        p_metadata => jsonb_build_object(
            'file_name', v_attachment.file_name,
            'file_path', v_attachment.file_path,
            'file_type', v_attachment.file_type,
            'file_size', v_attachment.file_size,
            'status', v_attachment.status,
            'reason', p_reason
        ),
        p_success => true
    );

    -- Delete the attachment record
    DELETE FROM chat_attachments WHERE id = p_attachment_id;

    -- Return success with file path for storage cleanup
    RETURN jsonb_build_object(
        'success', true,
        'file_path', v_attachment.file_path,
        'file_name', v_attachment.file_name
    );

END;
$$;

COMMENT ON FUNCTION delete_attachment IS
'Deletes an attachment record after validating permissions. Returns file_path for storage cleanup. Admins can delete any attachment, users can delete their own pending attachments.';

-- ============================================================================
-- RPC FUNCTION: get_orphaned_attachment_report
-- ============================================================================
-- Generates report of orphaned attachments for monitoring
-- Does not delete anything - read-only report

CREATE OR REPLACE FUNCTION get_orphaned_attachment_report(
    p_organization_id UUID,
    p_min_age_days INTEGER DEFAULT 1
)
RETURNS TABLE (
    total_orphaned INTEGER,
    total_size_bytes BIGINT,
    oldest_orphan_age_days INTEGER,
    orphaned_by_type JSONB,
    eligible_for_cleanup INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_orphaned INTEGER;
    v_total_size BIGINT;
    v_oldest_age INTEGER;
    v_by_type JSONB;
    v_eligible INTEGER;
BEGIN
    -- Verify user has permission (admin only)
    IF NOT EXISTS (
        SELECT 1 FROM medical_staff ms
        WHERE ms.id = auth.uid()
          AND ms.organization_id = p_organization_id
          AND ms.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Permission denied: Only admins can view orphaned attachment reports';
    END IF;

    -- Calculate statistics
    SELECT
        COUNT(*)::INTEGER,
        COALESCE(SUM(ca.file_size), 0)::BIGINT,
        COALESCE(MAX(EXTRACT(DAY FROM (now() - ca.created_at))::INTEGER), 0),
        jsonb_object_agg(ca.file_type, type_count),
        COUNT(*) FILTER (WHERE ca.created_at < (now() - make_interval(days => 7)))::INTEGER
    INTO v_total_orphaned, v_total_size, v_oldest_age, v_by_type, v_eligible
    FROM chat_attachments ca
    INNER JOIN chat_conversations cc ON cc.id = ca.conversation_id
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::INTEGER AS type_count
        FROM chat_attachments ca2
        INNER JOIN chat_conversations cc2 ON cc2.id = ca2.conversation_id
        WHERE ca2.file_type = ca.file_type
          AND ca2.message_id IS NULL
          AND ca2.created_at < (now() - make_interval(days => p_min_age_days))
          AND cc2.organization_id = p_organization_id
    ) counts ON true
    WHERE cc.organization_id = p_organization_id
      AND ca.message_id IS NULL
      AND ca.created_at < (now() - make_interval(days => p_min_age_days))
    GROUP BY ca.file_type;

    -- Return report
    RETURN QUERY SELECT
        v_total_orphaned,
        v_total_size,
        v_oldest_age,
        COALESCE(v_by_type, '{}'::jsonb),
        v_eligible;

END;
$$;

COMMENT ON FUNCTION get_orphaned_attachment_report IS
'Generates report of orphaned attachments for monitoring. Read-only, does not delete anything. Admin-only access.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify trigger function exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_cleanup_message_attachments') THEN
        RAISE NOTICE '✅ Function trigger_cleanup_message_attachments created successfully';
    END IF;
END $$;

-- Verify trigger exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_cleanup_attachments_on_message_delete') THEN
        RAISE NOTICE '✅ Trigger trigger_cleanup_attachments_on_message_delete created successfully';
    END IF;
END $$;

-- Verify RPC functions exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_orphaned_attachments') THEN
        RAISE NOTICE '✅ Function cleanup_orphaned_attachments created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_attachment') THEN
        RAISE NOTICE '✅ Function delete_attachment created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_orphaned_attachment_report') THEN
        RAISE NOTICE '✅ Function get_orphaned_attachment_report created successfully';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, run:
-- DROP TRIGGER IF EXISTS trigger_cleanup_attachments_on_message_delete ON chat_messages;
-- DROP FUNCTION IF EXISTS trigger_cleanup_message_attachments();
-- DROP FUNCTION IF EXISTS cleanup_orphaned_attachments(UUID, INTEGER, BOOLEAN);
-- DROP FUNCTION IF EXISTS delete_attachment(UUID, UUID, TEXT);
-- DROP FUNCTION IF EXISTS get_orphaned_attachment_report(UUID, INTEGER);
