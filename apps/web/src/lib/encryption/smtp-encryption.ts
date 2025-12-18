/**
 * SMTP Password Encryption Utilities
 *
 * Provides AES-256-GCM encryption for SMTP passwords before storage.
 * Uses Node.js crypto module with initialization vectors for security.
 *
 * @module lib/encryption/smtp-encryption
 */

import crypto from 'crypto';

/**
 * Algorithm used for encryption (AES-256-GCM)
 * GCM mode provides authenticated encryption
 */
const ALGORITHM = 'aes-256-gcm';

/**
 * Length of the initialization vector (12 bytes recommended for GCM)
 */
const IV_LENGTH = 12;

/**
 * Length of the authentication tag (16 bytes)
 */
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment variable
 * Must be 32 bytes (256 bits) for AES-256
 *
 * @throws Error if SMTP_ENCRYPTION_KEY is not set or has invalid length
 */
function getEncryptionKey(): Buffer {
  const key = process.env.SMTP_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'SMTP_ENCRYPTION_KEY environment variable is not set. ' +
        'Please set it to a 32-byte (64 hex characters) encryption key.'
    );
  }

  // Convert hex string to buffer
  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error(
      `SMTP_ENCRYPTION_KEY must be 32 bytes (64 hex characters). Got ${keyBuffer.length} bytes. ` +
        'Generate a key with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"'
    );
  }

  return keyBuffer;
}

/**
 * Encrypts a password using AES-256-GCM
 *
 * The encrypted format is: iv:authTag:encryptedData (all hex encoded)
 * This allows us to store everything needed for decryption in a single string.
 *
 * @param password - The plaintext password to encrypt
 * @returns Encrypted string in format "iv:authTag:encryptedData"
 *
 * @throws Error if encryption fails or key is invalid
 *
 * @example
 * ```typescript
 * const plainPassword = 'mySecurePassword123';
 * const encrypted = encryptPassword(plainPassword);
 * // Returns something like: "a1b2c3d4e5f6g7h8i9j0:k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6:..."
 * ```
 */
export function encryptPassword(password: string): string {
  try {
    const key = getEncryptionKey();

    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the password
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine iv, authTag, and encrypted data (all as hex strings)
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Error encrypting password:', error);
    throw new Error('Falha ao criptografar senha SMTP');
  }
}

/**
 * Decrypts a password that was encrypted with encryptPassword
 *
 * @param encryptedPassword - Encrypted string in format "iv:authTag:encryptedData"
 * @returns The decrypted plaintext password
 *
 * @throws Error if decryption fails, format is invalid, or authentication fails
 *
 * @example
 * ```typescript
 * const encrypted = "a1b2c3d4e5f6g7h8i9j0:k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6:...";
 * const plainPassword = decryptPassword(encrypted);
 * // Returns: "mySecurePassword123"
 * ```
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const key = getEncryptionKey();

    // Split the encrypted data into components
    const parts = encryptedPassword.split(':');

    if (parts.length !== 3) {
      throw new Error(
        'Invalid encrypted password format. Expected format: iv:authTag:encryptedData'
      );
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}`);
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(
        `Invalid auth tag length. Expected ${AUTH_TAG_LENGTH} bytes, got ${authTag.length}`
      );
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the password
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting password:', error);
    throw new Error('Falha ao descriptografar senha SMTP');
  }
}

/**
 * Validates that a string is properly encrypted
 *
 * Checks format without actually decrypting (useful for validation)
 *
 * @param encryptedPassword - String to validate
 * @returns True if format is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = isValidEncryptedFormat("a1b2:c3d4:e5f6");
 * // Returns: true (correct format)
 *
 * const isInvalid = isValidEncryptedFormat("plaintext");
 * // Returns: false (missing colons and proper structure)
 * ```
 */
export function isValidEncryptedFormat(encryptedPassword: string): boolean {
  if (!encryptedPassword || typeof encryptedPassword !== 'string') {
    return false;
  }

  const parts = encryptedPassword.split(':');

  if (parts.length !== 3) {
    return false;
  }

  const [ivHex, authTagHex, encrypted] = parts;

  // Check if all parts are valid hex strings
  const hexRegex = /^[0-9a-f]+$/i;

  if (!hexRegex.test(ivHex) || !hexRegex.test(authTagHex) || !hexRegex.test(encrypted)) {
    return false;
  }

  // Check lengths (each hex char = 4 bits, so byte length = hex length / 2)
  const ivLength = ivHex.length / 2;
  const authTagLength = authTagHex.length / 2;

  return ivLength === IV_LENGTH && authTagLength === AUTH_TAG_LENGTH;
}

/**
 * Generates a random encryption key for development/testing
 *
 * @returns 32-byte key as hex string (64 characters)
 *
 * @example
 * ```typescript
 * const key = generateEncryptionKey();
 * console.log('SMTP_ENCRYPTION_KEY=' + key);
 * // Outputs: SMTP_ENCRYPTION_KEY=a1b2c3d4e5f6... (64 hex chars)
 * ```
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
