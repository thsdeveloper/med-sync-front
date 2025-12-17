-- Migration: Create RPC functions for attachment management
-- Feature: F034 - Add attachment management API endpoints and validation
-- Description: Implements upload_chat_attachment, update_attachment_status RPC functions with validation
-- Created: 2025-12-17

-- ============================================================================
-- RPC FUNCTION: upload_chat_attachment
-- ============================================================================
-- Creates attachment record after file upload with comprehensive validation
-- Validates: file type, size, user permissions, rate limit, conversation access
-- Returns: attachment_id on success or error details

CREATE OR REPLACE FUNCTION upload_chat_attachment(
    p_conversation_id UUID,
    p_message_id UUID,
    p_file_name TEXT,
    p_file_type TEXT,
    p_file_path TEXT,
    p_file_size INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_organization_id UUID;
    v_sender_id UUID := auth.uid();
    v_user_role TEXT;
    v_rate_limit_ok BOOLEAN;
    v_attachment_id UUID;
    v_allowed_extensions TEXT[] := ARRAY['.pdf', '.jpg', '.jpeg', '.png', '.gif'];
    v_file_extension TEXT;
    v_max_file_size INTEGER := 10485760; -- 10MB in bytes
BEGIN
    -- Validate required parameters
    IF p_conversation_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'conversation_id is required'
        );
    END IF;

    IF p_message_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'message_id is required'
        );
    END IF;

    IF p_file_name IS NULL OR LENGTH(TRIM(p_file_name)) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'file_name is required'
        );
    END IF;

    -- Validate file type
    IF p_file_type NOT IN ('pdf', 'image') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid file_type. Must be "pdf" or "image"'
        );
    END IF;

    -- Validate file size
    IF p_file_size IS NULL OR p_file_size <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid file_size. Must be positive integer'
        );
    END IF;

    IF p_file_size > v_max_file_size THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('File size exceeds maximum allowed (10MB). File size: %s bytes', p_file_size)
        );
    END IF;

    -- Validate file extension
    v_file_extension := lower(substring(p_file_name from '\.[^.]*$'));
    IF v_file_extension IS NULL OR NOT (v_file_extension = ANY(v_allowed_extensions)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Invalid file extension "%s". Allowed: %s', COALESCE(v_file_extension, 'none'), array_to_string(v_allowed_extensions, ', '))
        );
    END IF;

    -- Get organization_id and verify conversation exists
    SELECT cc.organization_id
    INTO v_organization_id
    FROM chat_conversations cc
    WHERE cc.id = p_conversation_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Conversation not found'
        );
    END IF;

    -- Verify user is a medical staff member
    SELECT role INTO v_user_role
    FROM medical_staff
    WHERE id = v_sender_id
      AND organization_id = v_organization_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User is not a staff member of this organization'
        );
    END IF;

    -- Verify user is participant in conversation
    IF NOT EXISTS (
        SELECT 1 FROM chat_participants cp
        WHERE cp.conversation_id = p_conversation_id
          AND cp.participant_id = v_sender_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User is not a participant in this conversation'
        );
    END IF;

    -- Verify message exists and belongs to conversation
    IF NOT EXISTS (
        SELECT 1 FROM chat_messages cm
        WHERE cm.id = p_message_id
          AND cm.conversation_id = p_conversation_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Message not found or does not belong to conversation'
        );
    END IF;

    -- Check rate limit
    v_rate_limit_ok := check_upload_rate_limit(v_sender_id, v_organization_id);

    IF NOT v_rate_limit_ok THEN
        -- Log failed upload attempt
        PERFORM log_attachment_operation(
            p_attachment_id => NULL,
            p_action => 'upload_failed',
            p_actor_id => v_sender_id,
            p_actor_role => v_user_role,
            p_organization_id => v_organization_id,
            p_conversation_id => p_conversation_id,
            p_message_id => p_message_id,
            p_metadata => jsonb_build_object(
                'file_name', p_file_name,
                'file_size', p_file_size,
                'file_type', p_file_type
            ),
            p_success => false,
            p_error_message => 'Rate limit exceeded (max 10 uploads per hour)'
        );

        RETURN jsonb_build_object(
            'success', false,
            'error', 'Rate limit exceeded. Maximum 10 uploads per hour allowed.'
        );
    END IF;

    -- Create attachment record
    INSERT INTO chat_attachments (
        conversation_id,
        message_id,
        sender_id,
        file_name,
        file_type,
        file_path,
        file_size,
        status,
        created_at
    ) VALUES (
        p_conversation_id,
        p_message_id,
        v_sender_id,
        p_file_name,
        p_file_type,
        p_file_path,
        p_file_size,
        'pending',
        now()
    ) RETURNING id INTO v_attachment_id;

    -- Record upload attempt for rate limiting
    PERFORM record_upload_attempt(
        v_sender_id,
        v_organization_id,
        p_conversation_id,
        p_file_name,
        p_file_size
    );

    -- Log successful upload
    PERFORM log_attachment_operation(
        p_attachment_id => v_attachment_id,
        p_action => 'upload',
        p_actor_id => v_sender_id,
        p_actor_role => v_user_role,
        p_organization_id => v_organization_id,
        p_conversation_id => p_conversation_id,
        p_message_id => p_message_id,
        p_metadata => jsonb_build_object(
            'file_name', p_file_name,
            'file_path', p_file_path,
            'file_type', p_file_type,
            'file_size', p_file_size,
            'status', 'pending'
        ),
        p_success => true
    );

    -- Return success with attachment_id
    RETURN jsonb_build_object(
        'success', true,
        'attachment_id', v_attachment_id,
        'status', 'pending',
        'message', 'Attachment uploaded successfully. Awaiting admin approval.'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log failed upload
        PERFORM log_attachment_operation(
            p_attachment_id => NULL,
            p_action => 'upload_failed',
            p_actor_id => v_sender_id,
            p_actor_role => COALESCE(v_user_role, 'unknown'),
            p_organization_id => v_organization_id,
            p_conversation_id => p_conversation_id,
            p_message_id => p_message_id,
            p_metadata => jsonb_build_object(
                'file_name', p_file_name,
                'file_size', p_file_size,
                'file_type', p_file_type,
                'error', SQLERRM
            ),
            p_success => false,
            p_error_message => SQLERRM
        );

        RETURN jsonb_build_object(
            'success', false,
            'error', format('Upload failed: %s', SQLERRM)
        );
END;
$$;

COMMENT ON FUNCTION upload_chat_attachment IS
'Creates attachment record after file upload with comprehensive validation. Validates file type, size, user permissions, rate limit, and conversation access. Returns attachment_id on success.';

-- ============================================================================
-- RPC FUNCTION: update_attachment_status (Enhanced)
-- ============================================================================
-- Updates attachment status with validation and audit logging
-- Admin-only function for accepting/rejecting attachments

CREATE OR REPLACE FUNCTION update_attachment_status(
    p_attachment_id UUID,
    p_status TEXT,
    p_rejected_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attachment RECORD;
    v_organization_id UUID;
    v_user_role TEXT;
BEGIN
    -- Validate status
    IF p_status NOT IN ('accepted', 'rejected') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status. Must be "accepted" or "rejected"'
        );
    END IF;

    -- Validate rejected_reason when status is rejected
    IF p_status = 'rejected' AND (p_rejected_reason IS NULL OR LENGTH(TRIM(p_rejected_reason)) = 0) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'rejected_reason is required when status is "rejected"'
        );
    END IF;

    IF p_rejected_reason IS NOT NULL AND LENGTH(p_rejected_reason) > 500 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'rejected_reason must not exceed 500 characters'
        );
    END IF;

    -- Get attachment details
    SELECT ca.*, cc.organization_id
    INTO v_attachment
    FROM chat_attachments ca
    INNER JOIN chat_conversations cc ON cc.id = ca.conversation_id
    WHERE ca.id = p_attachment_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Attachment not found'
        );
    END IF;

    v_organization_id := v_attachment.organization_id;

    -- Verify user is an admin
    SELECT role INTO v_user_role
    FROM medical_staff
    WHERE id = auth.uid()
      AND organization_id = v_organization_id;

    IF v_user_role != 'admin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Permission denied. Only admins can update attachment status.'
        );
    END IF;

    -- Check if attachment is already in final state
    IF v_attachment.status IN ('accepted', 'rejected') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Attachment has already been %s', v_attachment.status)
        );
    END IF;

    -- Update attachment status
    UPDATE chat_attachments
    SET
        status = p_status,
        rejected_reason = p_rejected_reason,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = p_attachment_id;

    -- Note: Audit logging is handled by trigger_log_attachment_status_change trigger

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'attachment_id', p_attachment_id,
        'status', p_status,
        'message', format('Attachment %s successfully', p_status)
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log failed status update
        PERFORM log_attachment_operation(
            p_attachment_id => p_attachment_id,
            p_action => 'status_change',
            p_actor_id => auth.uid(),
            p_actor_role => COALESCE(v_user_role, 'unknown'),
            p_organization_id => v_organization_id,
            p_conversation_id => v_attachment.conversation_id,
            p_message_id => v_attachment.message_id,
            p_metadata => jsonb_build_object(
                'file_name', v_attachment.file_name,
                'old_status', v_attachment.status,
                'new_status', p_status,
                'rejected_reason', p_rejected_reason,
                'error', SQLERRM
            ),
            p_success => false,
            p_error_message => SQLERRM
        );

        RETURN jsonb_build_object(
            'success', false,
            'error', format('Status update failed: %s', SQLERRM)
        );
END;
$$;

COMMENT ON FUNCTION update_attachment_status IS
'Updates attachment status (accept/reject) with validation and audit logging. Admin-only access. Returns success status and message.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RPC functions exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upload_chat_attachment') THEN
        RAISE NOTICE '✅ Function upload_chat_attachment created successfully';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_attachment_status') THEN
        RAISE NOTICE '✅ Function update_attachment_status created successfully';
    END IF;
END $$;

-- Test file extension validation
DO $$
DECLARE
    v_test_result JSONB;
BEGIN
    -- This is just a syntax check, actual testing requires real data
    RAISE NOTICE '✅ RPC functions are ready for testing with real data';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, run:
-- DROP FUNCTION IF EXISTS upload_chat_attachment(UUID, UUID, TEXT, TEXT, TEXT, INTEGER);
-- DROP FUNCTION IF EXISTS update_attachment_status(UUID, TEXT, TEXT);
