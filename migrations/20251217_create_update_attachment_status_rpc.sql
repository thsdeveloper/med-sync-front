-- ============================================================================
-- Migration: Create RPC function for updating chat attachment status
-- Description: Allows admins to accept or reject document attachments with
--              proper permission checks and audit trail
-- Created: 2025-12-17
-- Feature: F031 - Build admin document review UI in web dashboard
-- ============================================================================

-- Create RPC function for updating attachment status (admin only)
CREATE OR REPLACE FUNCTION update_attachment_status(
    p_attachment_id UUID,
    p_status TEXT,
    p_rejected_reason TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attachment RECORD;
    v_staff_record RECORD;
    v_conversation_record RECORD;
    v_user_id UUID;
    v_organization_id UUID;
    v_result json;
BEGIN
    -- Get current user ID from auth context
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Validate status input
    IF p_status NOT IN ('accepted', 'rejected') THEN
        RAISE EXCEPTION 'Status inválido. Use "accepted" ou "rejected"';
    END IF;

    -- Validate rejected_reason when status is 'rejected'
    IF p_status = 'rejected' AND (p_rejected_reason IS NULL OR TRIM(p_rejected_reason) = '') THEN
        RAISE EXCEPTION 'Motivo da rejeição é obrigatório quando o documento é rejeitado';
    END IF;

    -- Fetch the attachment
    SELECT * INTO v_attachment
    FROM chat_attachments
    WHERE id = p_attachment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Anexo não encontrado';
    END IF;

    -- Check if attachment is still pending
    IF v_attachment.status != 'pending' THEN
        RAISE EXCEPTION 'Este anexo já foi revisado e não pode ser alterado';
    END IF;

    -- Fetch conversation to get organization_id
    SELECT * INTO v_conversation_record
    FROM chat_conversations
    WHERE id = v_attachment.conversation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conversa não encontrada';
    END IF;

    v_organization_id := v_conversation_record.organization_id;

    -- Check if user is a staff member in the organization
    SELECT * INTO v_staff_record
    FROM medical_staff
    WHERE user_id = v_user_id
    AND organization_id = v_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não é membro desta organização';
    END IF;

    -- Check if user has admin role (assuming 'Administrador' role exists)
    IF v_staff_record.funcao != 'Administrador' THEN
        RAISE EXCEPTION 'Apenas administradores podem revisar documentos';
    END IF;

    -- Update attachment status
    UPDATE chat_attachments
    SET
        status = p_status,
        rejected_reason = CASE
            WHEN p_status = 'rejected' THEN p_rejected_reason
            ELSE NULL
        END,
        reviewed_by = v_user_id,
        reviewed_at = NOW()
    WHERE id = p_attachment_id
    RETURNING * INTO v_attachment;

    -- Build result JSON
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
        'rejected_reason', v_attachment.rejected_reason,
        'reviewed_by', v_attachment.reviewed_by,
        'reviewed_at', v_attachment.reviewed_at,
        'created_at', v_attachment.created_at
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION update_attachment_status IS
'RPC function to update chat attachment status (accept/reject). Only admins can execute. Validates permissions and maintains audit trail.';

-- Grant execute permission to authenticated users (function handles authorization internally)
GRANT EXECUTE ON FUNCTION update_attachment_status TO authenticated;

-- ============================================================================
-- Verification
-- ============================================================================
-- Run these queries to verify the function was created successfully:
--
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name = 'update_attachment_status';
--
-- ============================================================================
