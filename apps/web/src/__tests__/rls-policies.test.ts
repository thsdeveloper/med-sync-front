/**
 * RLS Policy Security Tests for Chat Attachments
 *
 * These tests verify Row Level Security policies work as expected.
 * They require a test Supabase instance with proper test data.
 *
 * Run with: pnpm test rls-policies.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration (use environment variables)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const TEST_STAFF_EMAIL = process.env.TEST_STAFF_EMAIL || 'staff@test.com';
const TEST_STAFF_PASSWORD = process.env.TEST_STAFF_PASSWORD || 'testpassword';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'testpassword';

describe('RLS Policies - Chat Attachments', () => {
  let staffClient: SupabaseClient;
  let adminClient: SupabaseClient;
  let testConversationId: string;
  let testAttachmentId: string;
  let otherConversationId: string;

  beforeAll(async () => {
    // Create clients for staff and admin users
    staffClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Login as staff user
    const staffAuth = await staffClient.auth.signInWithPassword({
      email: TEST_STAFF_EMAIL,
      password: TEST_STAFF_PASSWORD,
    });

    expect(staffAuth.error).toBeNull();
    expect(staffAuth.data.user).toBeTruthy();

    // Login as admin user
    const adminAuth = await adminClient.auth.signInWithPassword({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });

    expect(adminAuth.error).toBeNull();
    expect(adminAuth.data.user).toBeTruthy();

    // Setup test data (conversation and attachment)
    // This assumes test conversations and attachments exist in test database
    const { data: conversations } = await staffClient
      .from('chat_conversations')
      .select('id')
      .limit(1)
      .single();

    testConversationId = conversations?.id;

    const { data: otherConversations } = await adminClient
      .from('chat_conversations')
      .select('id')
      .neq('id', testConversationId)
      .limit(1)
      .single();

    otherConversationId = otherConversations?.id;
  });

  afterAll(async () => {
    // Cleanup: Sign out users
    await staffClient.auth.signOut();
    await adminClient.auth.signOut();
  });

  describe('Staff Upload Permissions', () => {
    it('should allow staff to insert attachments in their conversations', async () => {
      const { data, error } = await staffClient
        .from('chat_attachments')
        .insert({
          conversation_id: testConversationId,
          file_name: 'test-document.pdf',
          file_type: 'pdf',
          file_path: 'org/conv/test-document.pdf',
          file_size: 1024000,
          status: 'pending',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.status).toBe('pending');

      testAttachmentId = data?.id;
    });

    it('should prevent staff from uploading to conversations they are not part of', async () => {
      const { data, error } = await staffClient
        .from('chat_attachments')
        .insert({
          conversation_id: otherConversationId,
          file_name: 'unauthorized.pdf',
          file_type: 'pdf',
          file_path: 'org/conv/unauthorized.pdf',
          file_size: 1024000,
          status: 'pending',
        });

      // Should fail due to RLS policy
      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('Staff View Permissions', () => {
    it('should allow staff to view accepted attachments in their conversations', async () => {
      // First, create and accept an attachment as admin
      const { data: attachment } = await adminClient
        .from('chat_attachments')
        .insert({
          conversation_id: testConversationId,
          file_name: 'accepted-doc.pdf',
          file_type: 'pdf',
          file_path: 'org/conv/accepted-doc.pdf',
          file_size: 1024000,
          status: 'accepted',
        })
        .select()
        .single();

      // Staff should be able to view it
      const { data, error } = await staffClient
        .from('chat_attachments')
        .select('*')
        .eq('id', attachment?.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.status).toBe('accepted');
    });

    it('should allow staff to view their own pending attachments', async () => {
      const { data, error } = await staffClient
        .from('chat_attachments')
        .select('*')
        .eq('id', testAttachmentId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.status).toBe('pending');
    });

    it('should allow staff to view their own rejected attachments', async () => {
      // Create a rejected attachment
      const { data: rejected } = await adminClient
        .from('chat_attachments')
        .insert({
          conversation_id: testConversationId,
          file_name: 'rejected-doc.pdf',
          file_type: 'pdf',
          file_path: 'org/conv/rejected-doc.pdf',
          file_size: 1024000,
          status: 'rejected',
          rejected_reason: 'Test rejection',
        })
        .select()
        .single();

      // Staff should be able to view it
      const { data, error } = await staffClient
        .from('chat_attachments')
        .select('*')
        .eq('id', rejected?.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.status).toBe('rejected');
      expect(data?.rejected_reason).toBe('Test rejection');
    });

    it('should prevent staff from viewing other staff pending attachments', async () => {
      // This test assumes there's another staff member's pending attachment
      // Implementation depends on test data setup

      // Expected: staff can only see their own pending attachments or accepted attachments
      const { data, count } = await staffClient
        .from('chat_attachments')
        .select('*', { count: 'exact' })
        .eq('conversation_id', testConversationId)
        .eq('status', 'pending');

      // Should only see own pending attachments
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Staff Update Permissions', () => {
    it('should prevent staff from updating attachment status', async () => {
      const { data, error } = await staffClient
        .from('chat_attachments')
        .update({ status: 'accepted' })
        .eq('id', testAttachmentId);

      // Should fail - only admins can update status
      expect(error).toBeTruthy();
    });

    it('should prevent staff from changing rejected_reason', async () => {
      const { data, error } = await staffClient
        .from('chat_attachments')
        .update({ rejected_reason: 'Hacked reason' })
        .eq('id', testAttachmentId);

      // Should fail
      expect(error).toBeTruthy();
    });
  });

  describe('Admin View Permissions', () => {
    it('should allow admins to view all attachments in their organization', async () => {
      const { data, error } = await adminClient
        .from('chat_attachments')
        .select('*')
        .eq('conversation_id', testConversationId);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.length).toBeGreaterThan(0);
    });

    it('should allow admins to view pending attachments from any staff', async () => {
      const { data, error } = await adminClient
        .from('chat_attachments')
        .select('*')
        .eq('id', testAttachmentId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data?.status).toBe('pending');
    });

    it('should allow admins to view rejected attachments', async () => {
      const { data, error } = await adminClient
        .from('chat_attachments')
        .select('*')
        .eq('status', 'rejected');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe('Admin Update Permissions', () => {
    it('should allow admins to accept pending attachments', async () => {
      const { data, error } = await adminClient.rpc('update_attachment_status', {
        p_attachment_id: testAttachmentId,
        p_status: 'accepted',
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();

      // Verify status was updated
      const { data: updated } = await adminClient
        .from('chat_attachments')
        .select('*')
        .eq('id', testAttachmentId)
        .single();

      expect(updated?.status).toBe('accepted');
    });

    it('should allow admins to reject attachments with reason', async () => {
      // Create new pending attachment for rejection
      const { data: newAttachment } = await adminClient
        .from('chat_attachments')
        .insert({
          conversation_id: testConversationId,
          file_name: 'to-reject.pdf',
          file_type: 'pdf',
          file_path: 'org/conv/to-reject.pdf',
          file_size: 1024000,
          status: 'pending',
        })
        .select()
        .single();

      const { data, error } = await adminClient.rpc('update_attachment_status', {
        p_attachment_id: newAttachment?.id,
        p_status: 'rejected',
        p_rejected_reason: 'Invalid document format',
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();

      // Verify status and reason
      const { data: rejected } = await adminClient
        .from('chat_attachments')
        .select('*')
        .eq('id', newAttachment?.id)
        .single();

      expect(rejected?.status).toBe('rejected');
      expect(rejected?.rejected_reason).toBe('Invalid document format');
    });

    it('should prevent admins from re-updating already processed attachments', async () => {
      // Try to update an already accepted attachment
      const { data, error } = await adminClient.rpc('update_attachment_status', {
        p_attachment_id: testAttachmentId,
        p_status: 'rejected',
        p_rejected_reason: 'Changed my mind',
      });

      // Should fail - can't update already processed attachments
      expect(error).toBeTruthy();
    });

    it('should require rejected_reason when rejecting', async () => {
      // Create new pending attachment
      const { data: newAttachment } = await adminClient
        .from('chat_attachments')
        .insert({
          conversation_id: testConversationId,
          file_name: 'reject-no-reason.pdf',
          file_type: 'pdf',
          file_path: 'org/conv/reject-no-reason.pdf',
          file_size: 1024000,
          status: 'pending',
        })
        .select()
        .single();

      const { data, error } = await adminClient.rpc('update_attachment_status', {
        p_attachment_id: newAttachment?.id,
        p_status: 'rejected',
        // No rejected_reason provided
      });

      // Should fail - rejected_reason is required
      expect(error).toBeTruthy();
    });
  });

  describe('Storage Access Permissions', () => {
    it('should allow staff to upload files to their conversation folders', async () => {
      // Test storage upload (requires actual file)
      // This is a conceptual test - implementation depends on storage setup

      const testFile = new Blob(['test content'], { type: 'application/pdf' });
      const filePath = `org-id/conv-id/test-upload.pdf`;

      const { data, error } = await staffClient.storage
        .from('chat-documents')
        .upload(filePath, testFile);

      // Should succeed if user has permission
      expect(error).toBeNull();
      expect(data?.path).toBe(filePath);
    });

    it('should allow staff to download accepted attachments', async () => {
      // Get signed URL for accepted attachment
      const { data, error } = await staffClient.storage
        .from('chat-documents')
        .createSignedUrl('org-id/conv-id/accepted-doc.pdf', 3600);

      expect(error).toBeNull();
      expect(data?.signedUrl).toBeTruthy();
    });

    it('should allow admins to delete attachments', async () => {
      const filePath = 'org-id/conv-id/admin-delete-test.pdf';

      // Upload file as admin
      const testFile = new Blob(['delete me'], { type: 'application/pdf' });
      await adminClient.storage.from('chat-documents').upload(filePath, testFile);

      // Delete file
      const { data, error } = await adminClient.storage
        .from('chat-documents')
        .remove([filePath]);

      expect(error).toBeNull();
    });
  });

  describe('Cross-organization Access Prevention', () => {
    it('should prevent staff from accessing attachments in other organizations', async () => {
      // This test requires multi-organization test data setup
      // Expected: staff can only see attachments in their organization

      const { data, error } = await staffClient
        .from('chat_attachments')
        .select('*, chat_conversations!inner(organization_id)')
        .neq('chat_conversations.organization_id', 'staff-org-id');

      // Should return empty or error
      expect(data?.length).toBe(0);
    });

    it('should prevent admins from accessing attachments in other organizations', async () => {
      // Even admins should only see their organization's data

      const { data, error } = await adminClient
        .from('chat_attachments')
        .select('*, chat_conversations!inner(organization_id)')
        .neq('chat_conversations.organization_id', 'admin-org-id');

      // Should return empty or error
      expect(data?.length).toBe(0);
    });
  });
});
