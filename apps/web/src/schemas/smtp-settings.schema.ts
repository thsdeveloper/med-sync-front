/**
 * SMTP Settings Zod Validation Schema
 *
 * Validates SMTP configuration for email sending functionality.
 * Used in forms and API endpoints to ensure proper SMTP settings.
 *
 * @module schemas/smtp-settings
 */

import { z } from 'zod';

/**
 * Regex pattern for validating email addresses
 * Matches most common email formats including:
 * - Standard emails (user@domain.com)
 * - Subdomains (user@mail.domain.com)
 * - Plus addressing (user+tag@domain.com)
 * - Hyphenated domains (user@my-domain.com)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Regex pattern for validating SMTP host (domain or IP)
 * Matches:
 * - Domain names (smtp.gmail.com, mail.example.com)
 * - IPv4 addresses (192.168.1.1)
 * - Localhost
 */
const SMTP_HOST_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$|^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$/i;

/**
 * Zod schema for SMTP settings validation
 *
 * Validates all SMTP configuration fields with appropriate rules:
 * - smtp_host: Required domain or IP address
 * - smtp_port: Required number between 1-65535
 * - smtp_user: Required email format
 * - smtp_password: Required string with minimum 8 characters
 * - smtp_from_email: Required valid email format
 * - smtp_from_name: Optional string (defaults to empty string)
 * - use_tls: Boolean (defaults to true)
 * - is_enabled: Boolean (defaults to false)
 *
 * @example
 * ```typescript
 * const formData = {
 *   smtp_host: 'smtp.gmail.com',
 *   smtp_port: 587,
 *   smtp_user: 'user@gmail.com',
 *   smtp_password: 'securePassword123',
 *   smtp_from_email: 'noreply@medsync.com',
 *   smtp_from_name: 'MedSync',
 *   use_tls: true,
 *   is_enabled: true
 * };
 *
 * const result = smtpSettingsSchema.safeParse(formData);
 * if (result.success) {
 *   console.log('Valid SMTP settings:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error.errors);
 * }
 * ```
 */
export const smtpSettingsSchema = z.object({
  /**
   * SMTP server hostname or IP address
   * Must be a valid domain name or IPv4 address
   *
   * Examples: smtp.gmail.com, mail.example.com, 192.168.1.1
   */
  smtp_host: z
    .string()
    .trim()
    .min(1, 'Servidor SMTP é obrigatório')
    .regex(SMTP_HOST_REGEX, {
      message: 'Servidor SMTP deve ser um domínio válido ou endereço IP',
    }),

  /**
   * SMTP server port number
   * Must be between 1 and 65535 (valid TCP port range)
   *
   * Common ports:
   * - 25 (SMTP, unencrypted)
   * - 587 (SMTP with STARTTLS)
   * - 465 (SMTP with SSL/TLS)
   * - 2525 (Alternative SMTP port)
   */
  smtp_port: z
    .number()
    .int('Porta SMTP deve ser um número inteiro')
    .min(1, 'Porta SMTP deve ser no mínimo 1')
    .max(65535, 'Porta SMTP deve ser no máximo 65535'),

  /**
   * SMTP authentication username
   * Must be a valid email address
   *
   * Example: user@gmail.com
   */
  smtp_user: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Usuário SMTP é obrigatório')
    .email('Usuário SMTP deve ser um email válido'),

  /**
   * SMTP authentication password
   * Must be at least 8 characters for security
   *
   * Note: Passwords are encrypted at rest by Supabase
   */
  smtp_password: z
    .string()
    .min(8, 'Senha SMTP deve ter no mínimo 8 caracteres')
    .max(255, 'Senha SMTP deve ter no máximo 255 caracteres'),

  /**
   * Email address to use in "From" field
   * Must be a valid email address
   *
   * Example: noreply@medsync.com
   */
  smtp_from_email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email de origem é obrigatório')
    .email('Email de origem deve ser um email válido'),

  /**
   * Display name to use in "From" field
   * Optional string, defaults to empty string if not provided
   *
   * Example: "MedSync Notificações"
   */
  smtp_from_name: z
    .string()
    .optional()
    .default(''),

  /**
   * Whether to use TLS encryption
   * Defaults to true for security
   *
   * Recommended: true (use STARTTLS or SSL/TLS)
   */
  use_tls: z
    .boolean()
    .default(true),

  /**
   * Whether SMTP configuration is enabled
   * Defaults to false (disabled)
   *
   * When false, emails will not be sent using this configuration
   */
  is_enabled: z
    .boolean()
    .default(false),
});

/**
 * TypeScript type inferred from the SMTP settings schema
 * Use this type for form data, API requests, and component props
 *
 * @example
 * ```typescript
 * const handleSubmit = (data: SmtpSettingsFormData) => {
 *   // data is fully typed with all SMTP fields
 *   console.log(data.smtp_host);
 *   console.log(data.smtp_port);
 * };
 * ```
 */
export type SmtpSettingsFormData = z.infer<typeof smtpSettingsSchema>;

/**
 * Partial schema for updating SMTP settings
 * All fields are optional for PATCH operations
 *
 * @example
 * ```typescript
 * const partialUpdate = {
 *   is_enabled: false,
 *   use_tls: true
 * };
 *
 * const result = smtpSettingsUpdateSchema.safeParse(partialUpdate);
 * ```
 */
export const smtpSettingsUpdateSchema = smtpSettingsSchema.partial();

/**
 * TypeScript type for partial SMTP settings updates
 */
export type SmtpSettingsUpdateData = z.infer<typeof smtpSettingsUpdateSchema>;
