import { describe, it, expect } from 'vitest';
import {
  ATTACHMENT_STATUS,
  FILE_TYPE,
  uploadAttachmentSchema,
  updateAttachmentStatusSchema,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB,
} from '../chat.schema';
import { NOTIFICATION_TYPES, isDocumentNotification } from '../notification.schema';

describe('Chat Attachment Schemas', () => {
  describe('AttachmentStatus enum', () => {
    it('should have correct status values', () => {
      expect(ATTACHMENT_STATUS).toContain('pending');
      expect(ATTACHMENT_STATUS).toContain('accepted');
      expect(ATTACHMENT_STATUS).toContain('rejected');
    });
  });

  describe('FileType enum', () => {
    it('should have correct file type values', () => {
      expect(FILE_TYPE).toContain('pdf');
      expect(FILE_TYPE).toContain('image');
    });
  });

  describe('Constants', () => {
    it('should have correct file size limits', () => {
      expect(MAX_FILE_SIZE).toBe(10485760); // 10MB in bytes
      expect(MAX_FILE_SIZE_MB).toBe(10);
    });

    it('should have correct allowed file extensions', () => {
      const allExtensions = [...ALLOWED_FILE_EXTENSIONS.pdf, ...ALLOWED_FILE_EXTENSIONS.image];
      expect(allExtensions).toContain('.pdf');
      expect(allExtensions).toContain('.jpg');
      expect(allExtensions).toContain('.jpeg');
      expect(allExtensions).toContain('.png');
      expect(allExtensions).toContain('.gif');
    });
  });

  describe('uploadAttachmentSchema', () => {
    const validData = {
      conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      message_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      file_name: 'document.pdf',
      file_type: 'pdf' as const,
      file_size: 1024000, // 1MB
    };

    it('should validate correct upload data', () => {
      const result = uploadAttachmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept null message_id', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        message_id: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid conversation_id format', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        conversation_id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid message_id format', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        message_id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject file_name longer than 255 characters', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        file_name: 'a'.repeat(256) + '.pdf',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty file_name', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        file_name: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject file_name without valid extension', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        file_name: 'document.txt',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all allowed image extensions', () => {
      const extensions = ['.jpg', '.jpeg', '.png', '.gif'];
      extensions.forEach((ext) => {
        const result = uploadAttachmentSchema.safeParse({
          ...validData,
          file_name: `image${ext}`,
          file_type: 'image',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid file_type', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        file_type: 'video',
      });
      expect(result.success).toBe(false);
    });

    it('should reject file_size larger than 10MB', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        file_size: 10485761, // 10MB + 1 byte
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative file_size', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        file_size: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero file_size', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        file_size: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer file_size', () => {
      const result = uploadAttachmentSchema.safeParse({
        ...validData,
        file_size: 1024.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateAttachmentStatusSchema', () => {
    const validAcceptData = {
      attachment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'accepted' as const,
    };

    const validRejectData = {
      attachment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'rejected' as const,
      rejected_reason: 'Invalid document',
    };

    it('should validate accept status without rejected_reason', () => {
      const result = updateAttachmentStatusSchema.safeParse(validAcceptData);
      expect(result.success).toBe(true);
    });

    it('should validate reject status with rejected_reason', () => {
      const result = updateAttachmentStatusSchema.safeParse(validRejectData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid attachment_id format', () => {
      const result = updateAttachmentStatusSchema.safeParse({
        ...validAcceptData,
        attachment_id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject pending status', () => {
      const result = updateAttachmentStatusSchema.safeParse({
        attachment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = updateAttachmentStatusSchema.safeParse({
        attachment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'processing',
      });
      expect(result.success).toBe(false);
    });

    it('should require rejected_reason when status is rejected', () => {
      const result = updateAttachmentStatusSchema.safeParse({
        attachment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'rejected',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty rejected_reason when status is rejected', () => {
      const result = updateAttachmentStatusSchema.safeParse({
        attachment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'rejected',
        rejected_reason: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject rejected_reason longer than 500 characters', () => {
      const result = updateAttachmentStatusSchema.safeParse({
        attachment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'rejected',
        rejected_reason: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept rejected_reason up to 500 characters', () => {
      const result = updateAttachmentStatusSchema.safeParse({
        attachment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'rejected',
        rejected_reason: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Notification integration', () => {
    it('should include document notification types', () => {
      expect(NOTIFICATION_TYPES).toContain('document_accepted');
      expect(NOTIFICATION_TYPES).toContain('document_rejected');
    });

    it('should correctly identify document notifications', () => {
      expect(isDocumentNotification('document_accepted')).toBe(true);
      expect(isDocumentNotification('document_rejected')).toBe(true);
      expect(isDocumentNotification('shift_assigned')).toBe(false);
      expect(isDocumentNotification('schedule_updated')).toBe(false);
    });
  });
});
