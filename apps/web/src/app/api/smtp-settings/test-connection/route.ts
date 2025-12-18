/**
 * SMTP Test Connection API Endpoint
 *
 * POST /api/smtp-settings/test-connection
 *
 * Tests SMTP connection by sending a test email using provided credentials.
 * Validates configuration, establishes connection, and sends test email with 10s timeout.
 *
 * @module api/smtp-settings/test-connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { smtpSettingsSchema } from '@/schemas/smtp-settings.schema';
import { sendTestEmail } from '@/lib/email/smtp-test';

/**
 * POST /api/smtp-settings/test-connection
 *
 * Tests SMTP connection and sends a test email
 *
 * @param request - Next.js request object
 * @returns JSON response with success status and message
 *
 * @example
 * ```typescript
 * // Request body
 * {
 *   "smtp_host": "smtp.gmail.com",
 *   "smtp_port": 587,
 *   "smtp_user": "user@example.com",
 *   "smtp_password": "password",
 *   "smtp_from_email": "noreply@example.com",
 *   "smtp_from_name": "MedSync",
 *   "use_tls": true,
 *   "is_enabled": false
 * }
 *
 * // Success response
 * {
 *   "success": true,
 *   "message": "Email de teste enviado com sucesso para noreply@example.com"
 * }
 *
 * // Error response
 * {
 *   "success": false,
 *   "message": "Falha ao enviar email de teste",
 *   "error": "Falha na autenticação. Verifique o usuário e senha SMTP."
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body with Zod schema
    const validationResult = smtpSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dados de configuração inválidos',
          error: 'Validação falhou',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Extract validated data
    const config = validationResult.data;

    // Send test email with 10 second timeout
    const result = await sendTestEmail(config, 10000);

    // Return appropriate response based on result
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in SMTP test connection:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
