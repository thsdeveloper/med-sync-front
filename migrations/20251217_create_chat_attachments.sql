-- Migration: Create chat_attachments table and configure storage bucket
-- Description: Enable document attachments (PDF/images) in chat with admin review workflow
-- Author: MedSync Development Team
-- Date: 2025-12-17

-- ============================================================================
-- 1. Create chat_attachments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_attachments (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key relationships
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL REFERENCES public.medical_staff(id) ON DELETE CASCADE,

    -- File metadata
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
    file_path TEXT NOT NULL, -- Storage reference: organization_id/conversation_id/filename
    file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB

    -- Review workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    rejected_reason TEXT, -- Optional: reason for rejection
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin user who reviewed
    reviewed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. Add indexes for performance
-- ============================================================================

-- Index for finding attachments by conversation (most common query)
CREATE INDEX IF NOT EXISTS idx_chat_attachments_conversation_id
ON public.chat_attachments(conversation_id);

-- Index for finding attachments by message
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id
ON public.chat_attachments(message_id);

-- Index for finding attachments by sender
CREATE INDEX IF NOT EXISTS idx_chat_attachments_sender_id
ON public.chat_attachments(sender_id);

-- Index for filtering by status (pending review, accepted, rejected)
CREATE INDEX IF NOT EXISTS idx_chat_attachments_status
ON public.chat_attachments(status);

-- Index for finding attachments pending review
CREATE INDEX IF NOT EXISTS idx_chat_attachments_pending_review
ON public.chat_attachments(status, created_at)
WHERE status = 'pending';

-- Composite index for organization-based queries (via conversation)
CREATE INDEX IF NOT EXISTS idx_chat_attachments_conversation_status
ON public.chat_attachments(conversation_id, status);

-- ============================================================================
-- 3. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS Policies for Staff Users
-- ============================================================================

-- Policy: Staff can INSERT their own attachments
-- Staff can upload documents in conversations they participate in
CREATE POLICY "staff_insert_own_attachments"
ON public.chat_attachments
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if the authenticated user is the sender via medical_staff
    EXISTS (
        SELECT 1
        FROM public.medical_staff ms
        WHERE ms.id = sender_id
        AND ms.user_id = auth.uid()
    )
    AND
    -- Check if sender is a participant in the conversation
    EXISTS (
        SELECT 1
        FROM public.chat_participants cp
        WHERE cp.conversation_id = chat_attachments.conversation_id
        AND cp.staff_id = sender_id
    )
);

-- Policy: Staff can SELECT attachments in conversations they participate in
-- Staff can only see ACCEPTED attachments (not pending or rejected ones)
CREATE POLICY "staff_select_accepted_attachments"
ON public.chat_attachments
FOR SELECT
TO authenticated
USING (
    status = 'accepted'
    AND
    EXISTS (
        SELECT 1
        FROM public.chat_participants cp
        INNER JOIN public.medical_staff ms ON cp.staff_id = ms.id
        WHERE cp.conversation_id = chat_attachments.conversation_id
        AND ms.user_id = auth.uid()
    )
);

-- Policy: Staff can SELECT their own pending/rejected attachments
-- Staff can see status of their own uploads
CREATE POLICY "staff_select_own_attachments"
ON public.chat_attachments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.medical_staff ms
        WHERE ms.id = sender_id
        AND ms.user_id = auth.uid()
    )
);

-- ============================================================================
-- 5. RLS Policies for Admin Users
-- ============================================================================

-- Policy: Admins can SELECT all attachments in their organization
CREATE POLICY "admin_select_all_attachments"
ON public.chat_attachments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.user_organizations uo
        INNER JOIN public.chat_conversations cc ON cc.organization_id = uo.organization_id
        WHERE cc.id = chat_attachments.conversation_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('admin', 'owner')
    )
);

-- Policy: Admins can UPDATE attachment status (accept/reject)
CREATE POLICY "admin_update_attachment_status"
ON public.chat_attachments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.user_organizations uo
        INNER JOIN public.chat_conversations cc ON cc.organization_id = uo.organization_id
        WHERE cc.id = chat_attachments.conversation_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('admin', 'owner')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.user_organizations uo
        INNER JOIN public.chat_conversations cc ON cc.organization_id = uo.organization_id
        WHERE cc.id = chat_attachments.conversation_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('admin', 'owner')
    )
);

-- ============================================================================
-- 6. Add helpful comments
-- ============================================================================

COMMENT ON TABLE public.chat_attachments IS
'Document attachments for chat messages with admin review workflow. Supports PDF and image files.';

COMMENT ON COLUMN public.chat_attachments.conversation_id IS
'Foreign key to chat_conversations. Attachments belong to a conversation.';

COMMENT ON COLUMN public.chat_attachments.message_id IS
'Optional foreign key to chat_messages. Can be NULL if attachment sent separately or message deleted.';

COMMENT ON COLUMN public.chat_attachments.sender_id IS
'Foreign key to medical_staff. User who uploaded the attachment.';

COMMENT ON COLUMN public.chat_attachments.file_type IS
'Type of file: pdf or image. Used for validation and display.';

COMMENT ON COLUMN public.chat_attachments.file_path IS
'Storage path reference in format: organization_id/conversation_id/filename. Used to retrieve from storage bucket.';

COMMENT ON COLUMN public.chat_attachments.file_size IS
'File size in bytes. Maximum 10MB (10485760 bytes).';

COMMENT ON COLUMN public.chat_attachments.status IS
'Review status: pending (awaiting admin review), accepted (approved for display), rejected (not approved).';

COMMENT ON COLUMN public.chat_attachments.rejected_reason IS
'Optional explanation for why attachment was rejected by admin.';

COMMENT ON COLUMN public.chat_attachments.reviewed_by IS
'Foreign key to auth.users. Admin user who reviewed the attachment.';

COMMENT ON COLUMN public.chat_attachments.reviewed_at IS
'Timestamp when attachment was reviewed by admin.';

-- ============================================================================
-- 7. Storage bucket configuration notes
-- ============================================================================

-- IMPORTANT: Storage bucket 'chat-documents' must be created via Supabase MCP or Dashboard
-- Bucket configuration:
--   - Name: chat-documents
--   - Public: false (private bucket)
--   - File size limit: 10MB (10485760 bytes)
--   - Allowed MIME types: application/pdf, image/jpeg, image/png, image/gif
--
-- Storage policies required:
--   1. INSERT: Staff can upload to their own organization's folder
--   2. SELECT: Staff can download accepted attachments in their conversations
--   3. SELECT: Admins can download all attachments in their organization
--   4. DELETE: Admins can delete attachments in their organization
--
-- Path structure: {organization_id}/{conversation_id}/{filename}

-- ============================================================================
-- 8. Verification queries
-- ============================================================================

-- Verify table exists
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'chat_attachments';

-- Verify foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'chat_attachments';

-- Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'chat_attachments';

-- Verify policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'chat_attachments'
ORDER BY policyname;

-- Verify indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'chat_attachments'
ORDER BY indexname;

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
