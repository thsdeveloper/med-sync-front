-- Migration: Create RPC function for message deletion
-- Feature: Delete chat messages with associated attachments
-- Created: 2025-12-18

-- ============================================================================
-- RPC FUNCTION: delete_chat_message
-- ============================================================================
-- Deletes a chat message and its associated attachments.
-- Only the message sender can delete their own messages.
-- Returns file_paths for storage cleanup on the client side.
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_chat_message(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_message RECORD;
    v_user_id UUID := auth.uid();
    v_staff_id UUID;
    v_is_sender BOOLEAN := false;
    v_attachments JSONB := '[]'::JSONB;
    v_attachment RECORD;
BEGIN
    -- Validate input
    IF p_message_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ID da mensagem e obrigatorio'
        );
    END IF;

    -- Get message details
    SELECT * INTO v_message
    FROM chat_messages
    WHERE id = p_message_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Mensagem nao encontrada'
        );
    END IF;

    -- Get staff_id for current user (if they have a medical_staff record)
    SELECT id INTO v_staff_id
    FROM medical_staff
    WHERE user_id = v_user_id;

    -- Check if user is the sender
    -- Case 1: Message sent by medical_staff (sender_id matches user's staff record)
    IF v_message.sender_id IS NOT NULL AND v_message.sender_id = v_staff_id THEN
        v_is_sender := true;
    END IF;

    -- Case 2: Message sent by admin (admin_sender_id matches current user)
    IF v_message.admin_sender_id IS NOT NULL AND v_message.admin_sender_id = v_user_id THEN
        v_is_sender := true;
    END IF;

    -- Verify permission
    IF NOT v_is_sender THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Voce nao tem permissao para excluir esta mensagem'
        );
    END IF;

    -- Collect attachments info for storage cleanup
    FOR v_attachment IN
        SELECT id, file_path
        FROM chat_attachments
        WHERE message_id = p_message_id
    LOOP
        v_attachments := v_attachments || jsonb_build_array(
            jsonb_build_object('id', v_attachment.id, 'file_path', v_attachment.file_path)
        );
    END LOOP;

    -- Delete attachments from database
    DELETE FROM chat_attachments WHERE message_id = p_message_id;

    -- Delete the message
    DELETE FROM chat_messages WHERE id = p_message_id;

    -- Return success with attachment info for storage cleanup
    RETURN jsonb_build_object(
        'success', true,
        'deleted_message_id', p_message_id,
        'deleted_attachments', v_attachments,
        'message', 'Mensagem excluida com sucesso'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Erro ao excluir mensagem: %s', SQLERRM)
        );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION delete_chat_message IS
'Deletes a chat message and its attachments. Only the message sender can delete their own messages. Returns file_paths for storage cleanup.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_chat_message TO authenticated;
