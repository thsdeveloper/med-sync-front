import { describe, it, expect } from 'vitest';
import {
  validateFileExtension,
  validateFileSize,
  validateMimeType,
  validateFile,
  validateAttachmentCount,
  checkRateLimit,
  formatFileSize,
  sanitizeFileName,
  generateStoragePath,
  getFileType,
  getFileExtension,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_UPLOADS_PER_HOUR,
} from '../attachment-validation';

describe('Attachment Validation Utilities', () => {
  describe('validateFileExtension', () => {
    it('should accept valid PDF extension', () => {
      expect(validateFileExtension('document.pdf')).toBe(true);
      expect(validateFileExtension('Document.PDF')).toBe(true);
    });

    it('should accept valid image extensions', () => {
      expect(validateFileExtension('image.jpg')).toBe(true);
      expect(validateFileExtension('image.jpeg')).toBe(true);
      expect(validateFileExtension('image.png')).toBe(true);
      expect(validateFileExtension('image.gif')).toBe(true);
    });

    it('should reject invalid extensions', () => {
      expect(validateFileExtension('document.txt')).toBe(false);
      expect(validateFileExtension('video.mp4')).toBe(false);
      expect(validateFileExtension('archive.zip')).toBe(false);
    });

    it('should reject files without extensions', () => {
      expect(validateFileExtension('document')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within 10MB limit', () => {
      expect(validateFileSize(1024)).toBe(true); // 1KB
      expect(validateFileSize(1048576)).toBe(true); // 1MB
      expect(validateFileSize(10485760)).toBe(true); // 10MB exactly
    });

    it('should reject files larger than 10MB', () => {
      expect(validateFileSize(10485761)).toBe(false); // 10MB + 1 byte
      expect(validateFileSize(20971520)).toBe(false); // 20MB
    });

    it('should reject zero or negative sizes', () => {
      expect(validateFileSize(0)).toBe(false);
      expect(validateFileSize(-1)).toBe(false);
    });
  });

  describe('validateMimeType', () => {
    it('should accept PDF mime type', () => {
      expect(validateMimeType('application/pdf')).toBe(true);
    });

    it('should accept image mime types', () => {
      expect(validateMimeType('image/jpeg')).toBe(true);
      expect(validateMimeType('image/jpg')).toBe(true);
      expect(validateMimeType('image/png')).toBe(true);
      expect(validateMimeType('image/gif')).toBe(true);
    });

    it('should reject invalid mime types', () => {
      expect(validateMimeType('text/plain')).toBe(false);
      expect(validateMimeType('video/mp4')).toBe(false);
      expect(validateMimeType('application/zip')).toBe(false);
    });
  });

  describe('validateFile', () => {
    const validFile = {
      name: 'document.pdf',
      size: 1048576, // 1MB
      type: 'application/pdf',
    };

    it('should validate correct file', () => {
      const result = validateFile(validFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file with invalid extension', () => {
      const result = validateFile({
        ...validFile,
        name: 'document.txt',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('extension');
    });

    it('should reject file with invalid size', () => {
      const result = validateFile({
        ...validFile,
        size: 20971520, // 20MB
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('size');
    });

    it('should reject file with invalid mime type', () => {
      const result = validateFile({
        ...validFile,
        type: 'text/plain',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('type');
    });
  });

  describe('validateAttachmentCount', () => {
    it('should accept count within limit', () => {
      expect(validateAttachmentCount(0)).toBe(true);
      expect(validateAttachmentCount(1)).toBe(true);
      expect(validateAttachmentCount(2)).toBe(true);
      expect(validateAttachmentCount(3)).toBe(true);
    });

    it('should reject count above limit', () => {
      expect(validateAttachmentCount(4)).toBe(false);
      expect(validateAttachmentCount(10)).toBe(false);
    });

    it('should verify max attachments constant', () => {
      expect(MAX_ATTACHMENTS_PER_MESSAGE).toBe(3);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow uploads within rate limit', () => {
      const result = checkRateLimit(5, 10);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('should block uploads at rate limit', () => {
      const result = checkRateLimit(10, 10);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should block uploads over rate limit', () => {
      const result = checkRateLimit(15, 10);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should verify max uploads constant', () => {
      expect(MAX_UPLOADS_PER_HOUR).toBe(10);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(2048)).toBe('2.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(5242880)).toBe('5.00 MB');
      expect(formatFileSize(10485760)).toBe('10.00 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
      expect(formatFileSize(2147483648)).toBe('2.00 GB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });

  describe('sanitizeFileName', () => {
    it('should preserve valid filenames', () => {
      expect(sanitizeFileName('document.pdf')).toBe('document.pdf');
      expect(sanitizeFileName('my-file_2024.jpg')).toBe('my-file_2024.jpg');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeFileName('file/name.pdf')).toBe('filename.pdf');
      expect(sanitizeFileName('file\\name.pdf')).toBe('filename.pdf');
      expect(sanitizeFileName('file:name.pdf')).toBe('filename.pdf');
    });

    it('should handle multiple spaces', () => {
      expect(sanitizeFileName('my   file.pdf')).toBe('my file.pdf');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFileName('  file.pdf  ')).toBe('file.pdf');
    });

    it('should handle Portuguese characters', () => {
      expect(sanitizeFileName('arquivo_médico.pdf')).toBe('arquivo_médico.pdf');
      expect(sanitizeFileName('relatório_2024.pdf')).toBe('relatório_2024.pdf');
    });
  });

  describe('generateStoragePath', () => {
    const orgId = '123e4567-e89b-12d3-a456-426614174000';
    const conversationId = '223e4567-e89b-12d3-a456-426614174000';
    const fileName = 'document.pdf';

    it('should generate correct storage path', () => {
      const path = generateStoragePath(orgId, conversationId, fileName);
      expect(path).toBe(`${orgId}/${conversationId}/document.pdf`);
    });

    it('should sanitize filename in path', () => {
      const path = generateStoragePath(orgId, conversationId, 'file/name.pdf');
      expect(path).toBe(`${orgId}/${conversationId}/filename.pdf`);
    });
  });

  describe('getFileType', () => {
    it('should detect PDF files', () => {
      expect(getFileType('document.pdf')).toBe('pdf');
    });

    it('should detect image files', () => {
      expect(getFileType('photo.jpg')).toBe('image');
      expect(getFileType('photo.jpeg')).toBe('image');
      expect(getFileType('photo.png')).toBe('image');
      expect(getFileType('photo.gif')).toBe('image');
    });

    it('should handle uppercase extensions', () => {
      expect(getFileType('DOCUMENT.PDF')).toBe('pdf');
      expect(getFileType('PHOTO.JPG')).toBe('image');
    });

    it('should return null for unknown types', () => {
      expect(getFileType('document.txt')).toBeNull();
      expect(getFileType('video.mp4')).toBeNull();
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('photo.jpg')).toBe('.jpg');
    });

    it('should handle multiple dots in filename', () => {
      expect(getFileExtension('my.document.pdf')).toBe('.pdf');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('DOCUMENT.PDF')).toBe('.pdf');
    });

    it('should return empty string for no extension', () => {
      expect(getFileExtension('document')).toBe('');
    });
  });
});
