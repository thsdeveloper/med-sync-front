-- ============================================================================
-- Migration: Create Attachment Management API with Rate Limiting and Audit
-- Description: Implements RPC functions for attachment operations, rate
--              limiting, orphaned attachment cleanup, and comprehensive audit
--              logging system
-- Created: 2025-12-17
-- Feature: F034 - Add attachment management API endpoints and validation
-- ============================================================================

-- ============================================================================
-- 1. Create Rate Limiting Infrastructure
-- ============================================================================

-- Table to track upload attempts per user per hour
CREATE TABLE IF NOT EXISTS public.attachment_upload_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    upload_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_attachment_rate_limits_user_id
ON public.attachment_upload_rate_limits(user_id);

-- Index for finding active rate limit windows
CREATE INDEX IF NOT EXISTS idx_attachment_rate_limits_window
ON public.attachment_upload_rate_limits(user_id, window_start);

-- Add table comments
COMMENT ON TABLE public.attachment_upload_rate_limits IS
'Tracks upload attempts per user for rate limiting. Enforces max 10 uploads per hour per user.';

COMMENT ON COLUMN public.attachment_upload_rate_limits.upload_count IS
'Number of uploads in current 1-hour window';

COMMENT ON COLUMN public.attachment_upload_rate_limits.window_start IS
'Start time of current 1-hour rate limit window';

-- ============================================================================
-- 2. Create Audit Log Infrastructure
-- ============================================================================

-- Audit log table for all attachment operations
CREATE TABLE IF NOT EXISTS public.attachment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attachment_id UUID REFERENCES public.chat_attachments(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operation TEXT NOT NULL CHECK (operation IN ('upload', 'delete', 'status_update', 'cleanup')),
    old_status TEXT,
    new_status TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_attachment_audit_attachment_id
ON public.attachment_audit_log(attachment_id);

CREATE INDEX IF NOT EXISTS idx_attachment_audit_user_id
ON public.attachment_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_attachment_audit_operation
ON public.attachment_audit_log(operation);

CREATE INDEX IF NOT EXISTS idx_attachment_audit_created_at
ON public.attachment_audit_log(created_at DESC);

-- Composite index for common queries (user + operation + date)
CREATE INDEX IF NOT EXISTS idx_attachment_audit_user_operation_date
ON public.attachment_audit_log(user_id, operation, created_at DESC);

-- Add table comments
COMMENT ON TABLE public.attachment_audit_log IS
'Audit trail for all attachment operations (upload, delete, status updates, cleanup). Maintains history for compliance and debugging.';

COMMENT ON COLUMN public.attachment_audit_log.operation IS
'Type of operation: upload (file uploaded), delete (file deleted), status_update (admin review), cleanup (orphaned file removed)';

COMMENT ON COLUMN public.attachment_audit_log.metadata IS
'Additional operation metadata (file_name, file_size, conversation_id, error details, etc.)';

-- ============================================================================
-- 3. RPC Function: Check and Update Rate Limit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_upload_rate_limit(
    p_user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rate_limit RECORD;
    v_current_count INTEGER;
    v_max_uploads INTEGER := 10; -- Max 10 uploads per hour
    v_window_duration INTERVAL := INTERVAL '1 hour';
    v_result json;
BEGIN
    -- Lock the row for this user to prevent race conditions
    SELECT * INTO v_rate_limit
    FROM attachment_upload_rate_limits
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- If no record exists or window expired, create/reset it
    IF NOT FOUND OR (now() - v_rate_limit.window_start) > v_window_duration THEN
        -- Delete old record if exists
        DELETE FROM attachment_upload_rate_limits WHERE user_id = p_user_id;

        -- Create new window
        INSERT INTO attachment_upload_rate_limits (user_id, upload_count, window_start)
        VALUES (p_user_id, 1, now())
        RETURNING upload_count INTO v_current_count;

        SELECT json_build_object(
            'allowed', true,
            'remaining', v_max_uploads - 1,
            'reset_at', now() + v_window_duration
        ) INTO v_result;

        RETURN v_result;
    END IF;

    -- Window is still active, check if limit exceeded
    IF v_rate_limit.upload_count >= v_max_uploads THEN
        SELECT json_build_object(
            'allowed', false,
            'remaining', 0,
            'reset_at', v_rate_limit.window_start + v_window_duration,
            'error', 'Limite de uploads excedido. Você pode enviar no máximo ' || v_max_uploads || ' arquivos por hora.'
        ) INTO v_result;

        RETURN v_result;
    END IF;

    -- Increment counter
    UPDATE attachment_upload_rate_limits
    SET upload_count = upload_count + 1,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING upload_count INTO v_current_count;

    SELECT json_build_object(
        'allowed', true,
        'remaining', v_max_uploads - v_current_count,
        'reset_at', v_rate_limit.window_start + v_window_duration
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION check_upload_rate_limit IS
'Checks and updates upload rate limit for a user. Returns allowed status and remaining quota. Max 10 uploads per hour.';

GRANT EXECUTE ON FUNCTION check_upload_rate_limit TO authenticated;

-- ============================================================================
-- 4. RPC Function: Upload Chat Attachment
-- ============================================================================

CREATE OR REPLACE FUNCTION upload_chat_attachment(
    p_conversation_id UUID,
    p_message_id UUID,
    p_file_name TEXT,
    p_file_type TEXT,
    p_file_path TEXT,
    p_file_size INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_staff_id UUID;
    v_conversation RECORD;
    v_rate_limit json;
    v_attachment RECORD;
    v_result json;
BEGIN
    -- Get authenticated user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Check rate limit
    v_rate_limit := check_upload_rate_limit(v_user_id);
    IF NOT (v_rate_limit->>'allowed')::boolean THEN
        RAISE EXCEPTION '%', v_rate_limit->>'error';
    END IF;

    -- Validate file type
    IF p_file_type NOT IN ('pdf', 'image') THEN
        RAISE EXCEPTION 'Tipo de arquivo inválido. Use "pdf" ou "image"';
    END IF;

    -- Validate file size (max 10MB)
    IF p_file_size <= 0 OR p_file_size > 10485760 THEN
        RAISE EXCEPTION 'Tamanho do arquivo inválido. Máximo: 10MB';
    END IF;

    -- Validate file name
    IF p_file_name IS NULL OR TRIM(p_file_name) = '' THEN
        RAISE EXCEPTION 'Nome do arquivo é obrigatório';
    END IF;

    -- Get staff ID for current user
    SELECT id INTO v_staff_id
    FROM medical_staff
    WHERE user_id = v_user_id;

    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não é um profissional cadastrado';
    END IF;

    -- Verify conversation exists
    SELECT * INTO v_conversation
    FROM chat_conversations
    WHERE id = p_conversation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conversa não encontrada';
    END IF;

    -- Verify user is participant in conversation
    IF NOT EXISTS (
        SELECT 1
        FROM chat_participants
        WHERE conversation_id = p_conversation_id
        AND staff_id = v_staff_id
    ) THEN
        RAISE EXCEPTION 'Você não é participante desta conversa';
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
        status
    ) VALUES (
        p_conversation_id,
        p_message_id,
        v_staff_id,
        p_file_name,
        p_file_type,
        p_file_path,
        p_file_size,
        'pending'
    )
    RETURNING * INTO v_attachment;

    -- Log the upload operation
    INSERT INTO attachment_audit_log (
        attachment_id,
        user_id,
        operation,
        new_status,
        metadata
    ) VALUES (
        v_attachment.id,
        v_user_id,
        'upload',
        'pending',
        json_build_object(
            'file_name', p_file_name,
            'file_type', p_file_type,
            'file_size', p_file_size,
            'conversation_id', p_conversation_id,
            'message_id', p_message_id
        )
    );

    -- Build result
    SELECT json_build_object(
        'id', v_attachment.id,
        'conversation_id', v_attachment.conversation_id,
        'message_id', v_attachment.message_id,
        'sender_id', v_attachment.sender_id,
        'file_name', v_attachment.file_name,
        'file_type', v_attachment.file_type,
        'file_path', v_attachment.file_path,
        'file_size', v_attachment.file_size,
        'status', v_attachment.status,
        'created_at', v_attachment.created_at,
        'rate_limit', json_build_object(
            'remaining', (v_rate_limit->>'remaining')::integer,
            'reset_at', v_rate_limit->>'reset_at'
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION upload_chat_attachment IS
'Creates a chat attachment record with validation and rate limiting. Enforces max 10 uploads per hour per user.';

GRANT EXECUTE ON FUNCTION upload_chat_attachment TO authenticated;

-- ============================================================================
-- 5. RPC Function: Delete Attachment
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_chat_attachment(
    p_attachment_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_staff_id UUID;
    v_attachment RECORD;
    v_conversation RECORD;
    v_is_admin BOOLEAN := false;
    v_result json;
BEGIN
    -- Get authenticated user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Get staff ID
    SELECT id INTO v_staff_id
    FROM medical_staff
    WHERE user_id = v_user_id;

    -- Fetch attachment
    SELECT * INTO v_attachment
    FROM chat_attachments
    WHERE id = p_attachment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Anexo não encontrado';
    END IF;

    -- Fetch conversation to check admin permissions
    SELECT * INTO v_conversation
    FROM chat_conversations
    WHERE id = v_attachment.conversation_id;

    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1
        FROM user_organizations uo
        WHERE uo.user_id = v_user_id
        AND uo.organization_id = v_conversation.organization_id
        AND uo.role IN ('admin', 'owner')
    ) INTO v_is_admin;

    -- Check permissions: user must be attachment sender OR admin
    IF v_attachment.sender_id != v_staff_id AND NOT v_is_admin THEN
        RAISE EXCEPTION 'Você não tem permissão para deletar este anexo';
    END IF;

    -- Log the deletion before deleting
    INSERT INTO attachment_audit_log (
        attachment_id,
        user_id,
        operation,
        old_status,
        metadata
    ) VALUES (
        v_attachment.id,
        v_user_id,
        'delete',
        v_attachment.status,
        json_build_object(
            'file_name', v_attachment.file_name,
            'file_type', v_attachment.file_type,
            'file_path', v_attachment.file_path,
            'conversation_id', v_attachment.conversation_id,
            'deleted_by_role', CASE WHEN v_is_admin THEN 'admin' ELSE 'sender' END
        )
    );

    -- Delete the attachment
    DELETE FROM chat_attachments WHERE id = p_attachment_id;

    -- Build result
    SELECT json_build_object(
        'success', true,
        'attachment_id', p_attachment_id,
        'file_path', v_attachment.file_path,
        'message', 'Anexo deletado com sucesso'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION delete_chat_attachment IS
'Deletes a chat attachment. Only sender or admin can delete. Returns file_path for storage cleanup.';

GRANT EXECUTE ON FUNCTION delete_chat_attachment TO authenticated;

-- ============================================================================
-- 6. RPC Function: Cleanup Orphaned Attachments
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_attachments(
    p_age_hours INTEGER DEFAULT 24
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_orphaned_attachments RECORD;
    v_deleted_count INTEGER := 0;
    v_deleted_paths TEXT[] := ARRAY[]::TEXT[];
    v_result json;
BEGIN
    -- Find and delete orphaned attachments
    -- Orphaned = message_id IS NULL and older than p_age_hours
    FOR v_orphaned_attachments IN
        SELECT *
        FROM chat_attachments
        WHERE message_id IS NULL
        AND created_at < (now() - (p_age_hours || ' hours')::INTERVAL)
    LOOP
        -- Log the cleanup
        INSERT INTO attachment_audit_log (
            attachment_id,
            user_id,
            operation,
            old_status,
            metadata
        ) VALUES (
            v_orphaned_attachments.id,
            NULL, -- System operation
            'cleanup',
            v_orphaned_attachments.status,
            json_build_object(
                'file_name', v_orphaned_attachments.file_name,
                'file_path', v_orphaned_attachments.file_path,
                'age_hours', EXTRACT(EPOCH FROM (now() - v_orphaned_attachments.created_at)) / 3600,
                'reason', 'Orphaned attachment (no message_id)'
            )
        );

        -- Store file path for cleanup
        v_deleted_paths := array_append(v_deleted_paths, v_orphaned_attachments.file_path);

        -- Delete the attachment
        DELETE FROM chat_attachments WHERE id = v_orphaned_attachments.id;

        v_deleted_count := v_deleted_count + 1;
    END LOOP;

    -- Build result
    SELECT json_build_object(
        'success', true,
        'deleted_count', v_deleted_count,
        'deleted_paths', array_to_json(v_deleted_paths),
        'message', 'Limpeza concluída: ' || v_deleted_count || ' anexos órfãos removidos'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION cleanup_orphaned_attachments IS
'Cleanup job to remove orphaned attachments (no message_id after specified hours). Returns file paths for storage cleanup.';

-- Grant to service role for scheduled execution
GRANT EXECUTE ON FUNCTION cleanup_orphaned_attachments TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_attachments TO service_role;

-- ============================================================================
-- 7. Trigger: Auto-log attachment status updates
-- ============================================================================

CREATE OR REPLACE FUNCTION log_attachment_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only log if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO attachment_audit_log (
            attachment_id,
            user_id,
            operation,
            old_status,
            new_status,
            metadata
        ) VALUES (
            NEW.id,
            NEW.reviewed_by,
            'status_update',
            OLD.status,
            NEW.status,
            json_build_object(
                'file_name', NEW.file_name,
                'conversation_id', NEW.conversation_id,
                'rejected_reason', NEW.rejected_reason,
                'reviewed_at', NEW.reviewed_at
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_attachment_status_update ON public.chat_attachments;
CREATE TRIGGER trigger_log_attachment_status_update
AFTER UPDATE ON public.chat_attachments
FOR EACH ROW
EXECUTE FUNCTION log_attachment_status_update();

COMMENT ON FUNCTION log_attachment_status_update IS
'Trigger function to automatically log attachment status changes to audit log';

-- ============================================================================
-- 8. Enable RLS on new tables
-- ============================================================================

ALTER TABLE public.attachment_upload_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachment_audit_log ENABLE ROW LEVEL SECURITY;

-- Rate limits: Users can only see their own rate limits
CREATE POLICY "users_view_own_rate_limits"
ON public.attachment_upload_rate_limits
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Audit log: Admins can view all logs in their organization
-- Staff can view their own operation logs
CREATE POLICY "staff_view_own_audit_logs"
ON public.attachment_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_view_all_audit_logs"
ON public.attachment_audit_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM user_organizations uo
        WHERE uo.user_id = auth.uid()
        AND uo.role IN ('admin', 'owner')
    )
);

-- ============================================================================
-- 9. Verification Queries
-- ============================================================================

-- Verify rate limiting table
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'attachment_upload_rate_limits';

-- Verify audit log table
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'attachment_audit_log';

-- Verify RPC functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'check_upload_rate_limit',
    'upload_chat_attachment',
    'delete_chat_attachment',
    'cleanup_orphaned_attachments'
);

-- Verify trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_log_attachment_status_update';

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
