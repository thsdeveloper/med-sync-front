import {
  validateFileType,
  validateFileSize,
  validateAttachmentCount,
  getMimeType,
  formatFileSize,
  generateStoragePath,
  sanitizeFileName,
  getFileExtension,
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from '../attachment-utils';

describe('Mobile Attachment Utils', () => {
  describe('validateFileType', () => {
    it('should accept PDF files', () => {
      const result = validateFileType('document.pdf');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept image files', () => {
      ['image.jpg', 'image.jpeg', 'image.png', 'image.gif'].forEach((filename) => {
        const result = validateFileType(filename);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid file types', () => {
      const result = validateFileType('document.txt');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tipo de arquivo');
    });

    it('should reject files without extensions', () => {
      const result = validateFileType('document');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within 10MB limit', () => {
      const result = validateFileSize(5242880); // 5MB
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files larger than 10MB', () => {
      const result = validateFileSize(20971520); // 20MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject zero or negative sizes', () => {
      expect(validateFileSize(0).valid).toBe(false);
      expect(validateFileSize(-1).valid).toBe(false);
    });

    it('should verify max file size constant', () => {
      expect(MAX_FILE_SIZE).toBe(10485760); // 10MB in bytes
    });
  });

  describe('validateAttachmentCount', () => {
    it('should accept count within limit', () => {
      const result = validateAttachmentCount(2);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject count above limit', () => {
      const result = validateAttachmentCount(4);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('3 arquivos');
    });

    it('should verify max attachments constant', () => {
      expect(MAX_ATTACHMENTS_PER_MESSAGE).toBe(3);
    });
  });

  describe('getMimeType', () => {
    it('should return PDF mime type', () => {
      expect(getMimeType('document.pdf')).toBe('application/pdf');
    });

    it('should return image mime types', () => {
      expect(getMimeType('photo.jpg')).toBe('image/jpeg');
      expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
      expect(getMimeType('photo.png')).toBe('image/png');
      expect(getMimeType('photo.gif')).toBe('image/gif');
    });

    it('should handle uppercase extensions', () => {
      expect(getMimeType('DOCUMENT.PDF')).toBe('application/pdf');
      expect(getMimeType('PHOTO.JPG')).toBe('image/jpeg');
    });

    it('should return null for unknown types', () => {
      expect(getMimeType('document.txt')).toBeNull();
      expect(getMimeType('video.mp4')).toBeNull();
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(2048)).toBe('2.00 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(5242880)).toBe('5.00 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });

  describe('generateStoragePath', () => {
    const orgId = '123e4567-e89b-12d3-a456-426614174000';
    const conversationId = '223e4567-e89b-12d3-a456-426614174000';

    it('should generate correct storage path', () => {
      const path = generateStoragePath(orgId, conversationId, 'document.pdf');
      expect(path).toBe(`${orgId}/${conversationId}/document.pdf`);
    });

    it('should sanitize filename in path', () => {
      const path = generateStoragePath(orgId, conversationId, 'file/name.pdf');
      expect(path).not.toContain('/name.pdf');
      expect(path).toContain(`${orgId}/${conversationId}/`);
    });
  });

  describe('sanitizeFileName', () => {
    it('should preserve valid filenames', () => {
      expect(sanitizeFileName('document.pdf')).toBe('document.pdf');
      expect(sanitizeFileName('my-file_2024.jpg')).toBe('my-file_2024.jpg');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeFileName('file/name.pdf')).not.toContain('/');
      expect(sanitizeFileName('file\\name.pdf')).not.toContain('\\');
      expect(sanitizeFileName('file:name.pdf')).not.toContain(':');
    });

    it('should handle multiple spaces', () => {
      const sanitized = sanitizeFileName('my   file.pdf');
      expect(sanitized).not.toContain('   ');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFileName('  file.pdf  ')).toBe('file.pdf');
    });

    it('should handle Portuguese characters', () => {
      expect(sanitizeFileName('relatório.pdf')).toContain('relatório');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('photo.jpg')).toBe('.jpg');
    });

    it('should handle multiple dots', () => {
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
