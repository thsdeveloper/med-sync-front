/**
 * Attachment Utility Functions
 *
 * Provides helper functions for file attachment handling in the chat system.
 * Includes validation, formatting, MIME type detection, and storage path generation.
 */

import { FileType } from '@medsync/shared';

/**
 * File validation constants
 */
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
export const ALLOWED_PDF_EXTENSIONS = ['.pdf'];
export const MAX_FILE_SIZE = 10485760; // 10MB in bytes
export const MAX_FILE_SIZE_MB = 10;
export const MAX_ATTACHMENTS_PER_MESSAGE = 3;

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  pdf: ['application/pdf'],
};

/**
 * Selected file interface
 */
export interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  type: FileType;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Detects file type from MIME type or file extension
 */
export function detectFileType(mimeType: string, fileName: string): FileType | null {
  // Check MIME type first
  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) {
    return 'image';
  }
  if (ALLOWED_MIME_TYPES.pdf.includes(mimeType)) {
    return 'pdf';
  }

  // Fallback to extension check
  const extension = getFileExtension(fileName).toLowerCase();
  if (ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return 'image';
  }
  if (ALLOWED_PDF_EXTENSIONS.includes(extension)) {
    return 'pdf';
  }

  return null;
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot);
}

/**
 * Validates a single file
 */
export function validateFile(file: SelectedFile): ValidationResult {
  // Check file type
  if (!file.type) {
    return {
      isValid: false,
      error: 'Tipo de arquivo não suportado. Use apenas imagens (JPG, PNG, GIF) ou PDFs.',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Arquivo muito grande. O tamanho máximo é ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  // Validate file extension
  const extension = getFileExtension(file.name).toLowerCase();
  const allowedExtensions =
    file.type === 'image' ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_PDF_EXTENSIONS;

  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Extensão de arquivo não permitida: ${extension}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates multiple files
 */
export function validateFiles(files: SelectedFile[]): ValidationResult {
  // Check file count
  if (files.length === 0) {
    return {
      isValid: false,
      error: 'Nenhum arquivo selecionado.',
    };
  }

  if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    return {
      isValid: false,
      error: `Você pode enviar no máximo ${MAX_ATTACHMENTS_PER_MESSAGE} arquivos por mensagem.`,
    };
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

/**
 * Formats file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Generates storage path for file upload
 *
 * Path structure: {organization_id}/{conversation_id}/{timestamp}_{filename}
 */
export function generateStoragePath(
  organizationId: string,
  conversationId: string,
  fileName: string
): string {
  // Add timestamp to filename to ensure uniqueness
  const timestamp = Date.now();
  const extension = getFileExtension(fileName);
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));

  // Sanitize filename (remove special characters)
  const sanitizedName = nameWithoutExtension.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueFileName = `${timestamp}_${sanitizedName}${extension}`;

  return `${organizationId}/${conversationId}/${uniqueFileName}`;
}

/**
 * Gets file icon name based on file type
 */
export function getFileIconName(fileType: FileType): string {
  switch (fileType) {
    case 'pdf':
      return 'document-text';
    case 'image':
      return 'image';
    default:
      return 'document';
  }
}

/**
 * Sanitizes filename for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  const extension = getFileExtension(fileName);
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));

  // Replace special characters with underscores
  const sanitized = nameWithoutExtension
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .trim();

  return `${sanitized}${extension}`;
}

/**
 * Extracts filename from storage path
 */
export function getFileNameFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

/**
 * Checks if file is an image
 */
export function isImageFile(fileType: FileType): boolean {
  return fileType === 'image';
}

/**
 * Checks if file is a PDF
 */
export function isPdfFile(fileType: FileType): boolean {
  return fileType === 'pdf';
}
