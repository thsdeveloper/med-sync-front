/**
 * Shared Attachment Validation Utilities
 * Feature: F034 - Add attachment management API endpoints and validation
 *
 * Provides client-side validation utilities for attachment uploads.
 * These validations mirror server-side rules to provide immediate feedback.
 *
 * @module attachment-validation
 */

import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB, ALLOWED_FILE_EXTENSIONS } from '../schemas/chat.schema';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum number of attachments per message
 */
export const MAX_ATTACHMENTS_PER_MESSAGE = 3;

/**
 * Maximum uploads per hour per user (rate limit)
 */
export const MAX_UPLOADS_PER_HOUR = 10;

// Re-export constants from chat.schema for convenience
export { MAX_FILE_SIZE, MAX_FILE_SIZE_MB, ALLOWED_FILE_EXTENSIONS };

/**
 * Flattened array of all allowed file extensions
 */
const ALL_ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'] as const;

/**
 * Allowed MIME types for attachments
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
] as const;

/**
 * File type categories
 */
export type FileTypeCategory = 'pdf' | 'image';

/**
 * Mapping of MIME types to file type categories
 */
export const MIME_TO_FILE_TYPE: Record<string, FileTypeCategory> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
};

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

export interface FileValidationResult extends ValidationResult {
  fileType?: FileTypeCategory;
  fileSize?: number;
  fileName?: string;
}

// ============================================================================
// FILE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates file extension
 *
 * @param fileName - File name to validate
 * @returns ValidationResult indicating if extension is valid
 *
 * @example
 * ```ts
 * const result = validateFileExtension('document.pdf');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateFileExtension(fileName: string): ValidationResult {
  if (!fileName || fileName.trim().length === 0) {
    return {
      valid: false,
      error: 'Nome do arquivo é obrigatório',
      errorCode: 'FILENAME_REQUIRED',
    };
  }

  // Extract extension (case-insensitive)
  const extension = fileName.toLowerCase().match(/\.[^.]*$/)?.[0];

  if (!extension) {
    return {
      valid: false,
      error: 'Arquivo sem extensão',
      errorCode: 'NO_EXTENSION',
    };
  }

  if (!ALL_ALLOWED_EXTENSIONS.includes(extension as any)) {
    return {
      valid: false,
      error: `Extensão "${extension}" não permitida. Permitidos: ${ALL_ALLOWED_EXTENSIONS.join(', ')}`,
      errorCode: 'INVALID_EXTENSION',
    };
  }

  return { valid: true };
}

/**
 * Validates file size
 *
 * @param fileSize - File size in bytes
 * @returns ValidationResult indicating if size is valid
 *
 * @example
 * ```ts
 * const result = validateFileSize(5242880); // 5MB
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateFileSize(fileSize: number): ValidationResult {
  if (fileSize <= 0) {
    return {
      valid: false,
      error: 'Tamanho do arquivo inválido',
      errorCode: 'INVALID_FILE_SIZE',
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `Arquivo muito grande (${fileSizeMB}MB). Máximo: ${MAX_FILE_SIZE_MB}MB`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  return { valid: true };
}

/**
 * Validates MIME type
 *
 * @param mimeType - MIME type to validate
 * @returns ValidationResult indicating if MIME type is valid
 *
 * @example
 * ```ts
 * const result = validateMimeType('application/pdf');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateMimeType(mimeType: string): ValidationResult {
  if (!mimeType || mimeType.trim().length === 0) {
    return {
      valid: false,
      error: 'Tipo MIME é obrigatório',
      errorCode: 'MIME_TYPE_REQUIRED',
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    return {
      valid: false,
      error: `Tipo de arquivo "${mimeType}" não permitido`,
      errorCode: 'INVALID_MIME_TYPE',
    };
  }

  return { valid: true };
}

/**
 * Validates complete file metadata
 *
 * @param fileName - File name
 * @param fileSize - File size in bytes
 * @param mimeType - MIME type (optional, if not provided will derive from extension)
 * @returns FileValidationResult with validation status and extracted metadata
 *
 * @example
 * ```ts
 * const result = validateFile('document.pdf', 5242880, 'application/pdf');
 * if (result.valid) {
 *   console.log('File type:', result.fileType); // 'pdf'
 *   console.log('File size:', result.fileSize); // 5242880
 * }
 * ```
 */
export function validateFile(
  fileName: string,
  fileSize: number,
  mimeType?: string
): FileValidationResult {
  // Validate file name and extension
  const extensionResult = validateFileExtension(fileName);
  if (!extensionResult.valid) {
    return extensionResult;
  }

  // Validate file size
  const sizeResult = validateFileSize(fileSize);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  // Validate MIME type if provided
  if (mimeType) {
    const mimeResult = validateMimeType(mimeType);
    if (!mimeResult.valid) {
      return mimeResult;
    }
  }

  // Determine file type category
  let fileType: FileTypeCategory;
  if (mimeType && MIME_TO_FILE_TYPE[mimeType]) {
    fileType = MIME_TO_FILE_TYPE[mimeType];
  } else {
    // Derive from extension
    const extension = fileName.toLowerCase().match(/\.[^.]*$/)?.[0];
    fileType = extension === '.pdf' ? 'pdf' : 'image';
  }

  return {
    valid: true,
    fileType,
    fileSize,
    fileName,
  };
}

/**
 * Validates attachment count limit
 *
 * @param currentCount - Current number of attachments
 * @param additionalCount - Number of attachments to add
 * @returns ValidationResult indicating if count is within limit
 *
 * @example
 * ```ts
 * const result = validateAttachmentCount(2, 1); // 2 existing + 1 new = 3 (ok)
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateAttachmentCount(
  currentCount: number,
  additionalCount: number = 1
): ValidationResult {
  const totalCount = currentCount + additionalCount;

  if (totalCount > MAX_ATTACHMENTS_PER_MESSAGE) {
    return {
      valid: false,
      error: `Máximo ${MAX_ATTACHMENTS_PER_MESSAGE} anexos por mensagem (atual: ${currentCount}, adicionando: ${additionalCount})`,
      errorCode: 'MAX_ATTACHMENTS_EXCEEDED',
    };
  }

  return { valid: true };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 *
 * @example
 * ```ts
 * formatFileSize(1024); // '1.00 KB'
 * formatFileSize(1048576); // '1.00 MB'
 * formatFileSize(5242880, 1); // '5.0 MB'
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Extracts file extension from file name
 *
 * @param fileName - File name
 * @returns File extension (with dot) or empty string if none
 *
 * @example
 * ```ts
 * getFileExtension('document.pdf'); // '.pdf'
 * getFileExtension('image.jpg'); // '.jpg'
 * getFileExtension('noextension'); // ''
 * ```
 */
export function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().match(/\.[^.]*$/)?.[0] || '';
}

/**
 * Determines file type category from file name or MIME type
 *
 * @param fileNameOrMime - File name or MIME type
 * @returns File type category or undefined if cannot determine
 *
 * @example
 * ```ts
 * getFileType('document.pdf'); // 'pdf'
 * getFileType('image.jpg'); // 'image'
 * getFileType('application/pdf'); // 'pdf'
 * getFileType('image/png'); // 'image'
 * ```
 */
export function getFileType(fileNameOrMime: string): FileTypeCategory | undefined {
  // Check if it's a MIME type
  if (MIME_TO_FILE_TYPE[fileNameOrMime]) {
    return MIME_TO_FILE_TYPE[fileNameOrMime];
  }

  // Check file extension
  const extension = getFileExtension(fileNameOrMime);
  if (extension === '.pdf') {
    return 'pdf';
  } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(extension)) {
    return 'image';
  }

  return undefined;
}

/**
 * Sanitizes file name for storage
 * Removes special characters and spaces, preserves extension
 *
 * @param fileName - Original file name
 * @returns Sanitized file name
 *
 * @example
 * ```ts
 * sanitizeFileName('My Document (2024).pdf'); // 'my-document-2024.pdf'
 * sanitizeFileName('Imagem #1.jpg'); // 'imagem-1.jpg'
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  const extension = getFileExtension(fileName);
  const nameWithoutExt = fileName.slice(0, fileName.length - extension.length);

  // Remove special characters, replace spaces with hyphens, lowercase
  const sanitized = nameWithoutExt
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return `${sanitized}${extension}`;
}

/**
 * Generates storage path for attachment
 *
 * @param organizationId - Organization UUID
 * @param conversationId - Conversation UUID
 * @param fileName - Sanitized file name
 * @returns Storage path string
 *
 * @example
 * ```ts
 * generateStoragePath(
 *   '123e4567-e89b-12d3-a456-426614174000',
 *   '123e4567-e89b-12d3-a456-426614174001',
 *   'document.pdf'
 * );
 * // '123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174001/document.pdf'
 * ```
 */
export function generateStoragePath(
  organizationId: string,
  conversationId: string,
  fileName: string
): string {
  return `${organizationId}/${conversationId}/${fileName}`;
}

/**
 * Checks if rate limit has been exceeded
 *
 * @param uploadTimestamps - Array of upload timestamps (milliseconds)
 * @param limit - Maximum uploads per hour (default: MAX_UPLOADS_PER_HOUR)
 * @returns ValidationResult indicating if rate limit is exceeded
 *
 * @example
 * ```ts
 * const uploads = [Date.now() - 3600000, Date.now() - 1800000]; // 2 uploads in last hour
 * const result = checkRateLimit(uploads);
 * if (!result.valid) {
 *   console.error(result.error); // Rate limit exceeded
 * }
 * ```
 */
export function checkRateLimit(
  uploadTimestamps: number[],
  limit: number = MAX_UPLOADS_PER_HOUR
): ValidationResult {
  const oneHourAgo = Date.now() - 3600000; // 1 hour in milliseconds
  const recentUploads = uploadTimestamps.filter((ts) => ts > oneHourAgo);

  if (recentUploads.length >= limit) {
    return {
      valid: false,
      error: `Limite de ${limit} uploads por hora excedido (${recentUploads.length}/${limit})`,
      errorCode: 'RATE_LIMIT_EXCEEDED',
    };
  }

  return { valid: true };
}

/**
 * Gets remaining uploads for current hour
 *
 * @param uploadTimestamps - Array of upload timestamps (milliseconds)
 * @param limit - Maximum uploads per hour (default: MAX_UPLOADS_PER_HOUR)
 * @returns Number of remaining uploads
 *
 * @example
 * ```ts
 * const uploads = [Date.now() - 3600000, Date.now() - 1800000];
 * const remaining = getRemainingUploads(uploads); // 8 (10 - 2)
 * ```
 */
export function getRemainingUploads(
  uploadTimestamps: number[],
  limit: number = MAX_UPLOADS_PER_HOUR
): number {
  const oneHourAgo = Date.now() - 3600000;
  const recentUploads = uploadTimestamps.filter((ts) => ts > oneHourAgo);
  return Math.max(0, limit - recentUploads.length);
}
