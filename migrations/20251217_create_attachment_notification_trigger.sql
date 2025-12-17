-- Migration: Create trigger for attachment status change notifications
-- Description: Automatically creates push notifications when admin accepts or rejects document attachments
-- Created: 2025-12-17
-- Feature: F032 - Push notification system for attachment status updates

-- ============================================================================
-- STEP 1: Update notifications table type constraint to include new types
-- ============================================================================

-- Drop existing constraint
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint with new document notification types
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY[
    'shift_swap_request'::text,
    'shift_swap_accepted'::text,
    'shift_swap_rejected'::text,
    'shift_swap_admin_approved'::text,
    'shift_swap_admin_rejected'::text,
    'shift_assigned'::text,
    'shift_reminder'::text,
    'document_accepted'::text,
    'document_rejected'::text,
    'general'::text
]));

COMMENT ON CONSTRAINT notifications_type_check ON notifications IS
'Valid notification types including shift swap, shift assignment, document review, and general notifications';

-- ============================================================================
-- STEP 2: Create trigger function to send notifications on attachment status change
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_attachment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_organization_id UUID;
    v_conversation_id UUID;
    v_sender_name TEXT;
    v_notification_type TEXT;
    v_notification_title TEXT;
    v_notification_body TEXT;
BEGIN
    -- Only trigger on status change from 'pending' to 'accepted' or 'rejected'
    IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN

        -- Get organization_id and conversation_id from chat_attachments table
        SELECT ca.conversation_id, cc.organization_id
        INTO v_conversation_id, v_organization_id
        FROM chat_attachments ca
        INNER JOIN chat_conversations cc ON ca.conversation_id = cc.id
        WHERE ca.id = NEW.id;

        -- Get sender name from medical_staff table
        SELECT ms.name
        INTO v_sender_name
        FROM medical_staff ms
        WHERE ms.id = NEW.sender_id;

        -- Determine notification type and content based on status
        IF NEW.status = 'accepted' THEN
            v_notification_type := 'document_accepted';
            v_notification_title := 'Documento Aprovado';
            v_notification_body := 'Seu documento "' || NEW.file_name || '" foi aprovado pelo administrador.';
        ELSE -- rejected
            v_notification_type := 'document_rejected';
            v_notification_title := 'Documento Rejeitado';
            v_notification_body := 'Seu documento "' || NEW.file_name || '" foi rejeitado.';

            -- Add rejection reason to body if provided
            IF NEW.rejected_reason IS NOT NULL AND LENGTH(TRIM(NEW.rejected_reason)) > 0 THEN
                v_notification_body := v_notification_body || ' Motivo: ' || NEW.rejected_reason;
            END IF;
        END IF;

        -- Insert notification record
        INSERT INTO notifications (
            organization_id,
            staff_id,
            type,
            title,
            body,
            data,
            read,
            created_at
        ) VALUES (
            v_organization_id,
            NEW.sender_id,
            v_notification_type,
            v_notification_title,
            v_notification_body,
            jsonb_build_object(
                'attachment_id', NEW.id,
                'file_name', NEW.file_name,
                'file_type', NEW.file_type,
                'conversation_id', v_conversation_id,
                'status', NEW.status,
                'rejected_reason', NEW.rejected_reason,
                'reviewed_by', NEW.reviewed_by,
                'reviewed_at', NEW.reviewed_at
            ),
            FALSE,
            NOW()
        );

        -- Log notification creation for debugging
        RAISE NOTICE 'Notification created: type=%, attachment_id=%, sender_id=%',
            v_notification_type, NEW.id, NEW.sender_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_attachment_status_change() IS
'Trigger function that creates push notifications when attachment status changes from pending to accepted/rejected. Includes attachment metadata and conversation context for navigation.';

-- ============================================================================
-- STEP 3: Create trigger on chat_attachments table
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_attachment_status_notification ON chat_attachments;

CREATE TRIGGER trigger_attachment_status_notification
    AFTER UPDATE ON chat_attachments
    FOR EACH ROW
    WHEN (OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected'))
    EXECUTE FUNCTION notify_attachment_status_change();

COMMENT ON TRIGGER trigger_attachment_status_notification ON chat_attachments IS
'Automatically creates notifications when admin changes attachment status from pending to accepted or rejected';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify constraint was updated
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'notifications'
        AND constraint_name = 'notifications_type_check'
    ) THEN
        RAISE NOTICE '✅ Notifications type constraint updated successfully';
    ELSE
        RAISE WARNING '❌ Notifications type constraint not found';
    END IF;
END $$;

-- Verify trigger function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'notify_attachment_status_change'
    ) THEN
        RAISE NOTICE '✅ Trigger function notify_attachment_status_change() created successfully';
    ELSE
        RAISE WARNING '❌ Trigger function not found';
    END IF;
END $$;

-- Verify trigger exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trigger_attachment_status_notification'
    ) THEN
        RAISE NOTICE '✅ Trigger trigger_attachment_status_notification created successfully';
    ELSE
        RAISE WARNING '❌ Trigger not found';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS trigger_attachment_status_notification ON chat_attachments;
DROP FUNCTION IF EXISTS notify_attachment_status_change();

-- Restore old constraint (remove document types)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY[
    'shift_swap_request'::text,
    'shift_swap_accepted'::text,
    'shift_swap_rejected'::text,
    'shift_swap_admin_approved'::text,
    'shift_swap_admin_rejected'::text,
    'shift_assigned'::text,
    'shift_reminder'::text,
    'general'::text
]));
*/
