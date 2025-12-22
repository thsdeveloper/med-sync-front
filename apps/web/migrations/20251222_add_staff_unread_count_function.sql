-- Migration: Add function to get total unread message count for a staff member
-- Created: 2025-12-22
-- Description: Function to get total unread count for a staff member across all conversations

-- Function to get total unread count for a staff member across all conversations
CREATE OR REPLACE FUNCTION get_staff_total_unread_count(p_staff_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_unread INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0) INTO v_total_unread
  FROM (
    SELECT
      cp.conversation_id,
      COUNT(cm.id) AS unread_count
    FROM chat_participants cp
    LEFT JOIN chat_messages cm ON cm.conversation_id = cp.conversation_id
      AND cm.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp)
      AND cm.sender_id IS DISTINCT FROM p_staff_id
      AND (cm.admin_sender_id IS NOT NULL OR cm.sender_id IS NOT NULL)
    WHERE cp.staff_id = p_staff_id
    GROUP BY cp.conversation_id
  ) sub;

  RETURN v_total_unread;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION get_staff_total_unread_count(UUID) IS
  'Returns the total count of unread messages across all conversations for a given staff member';
