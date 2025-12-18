/**
 * SMTP Test Connection Utilities
 *
 * This module provides utilities for testing SMTP connections and sending test emails
 * using nodemailer. It includes timeout handling and comprehensive error reporting.
 *
 * @module lib/email/smtp-test
 */

import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * SMTP Configuration Interface
 */
export interface SmtpConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  use_tls: boolean;
}

/**
 * Test Email Result Interface
 */
export interface SmtpTestResult {
  success: boolean;
  message: string;
  error?: string;
  details?: unknown;
}

/**
 * Creates a nodemailer transporter with the provided SMTP configuration
 *
 * @param config - SMTP configuration object
 * @returns Configured nodemailer transporter
 *
 * @example
 * ```typescript
 * const transporter = createSmtpTransporter({
 *   smtp_host: 'smtp.gmail.com',
 *   smtp_port: 587,
 *   smtp_user: 'user@example.com',
 *   smtp_password: 'password',
 *   smtp_from_email: 'noreply@example.com',
 *   smtp_from_name: 'MedSync',
 *   use_tls: true
 * });
 * ```
 */
export function createSmtpTransporter(config: SmtpConfig): Transporter {
  const transportOptions = {
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465, // true for 465, false for other ports
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password,
    },
    // TLS options
    tls: config.use_tls ? {
      // Don't fail on invalid certs during testing
      rejectUnauthorized: false,
    } : undefined,
    // Connection timeout
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
  };

  return nodemailer.createTransport(transportOptions);
}

/**
 * Sends a test email using the provided SMTP configuration
 *
 * @param config - SMTP configuration object
 * @param timeoutMs - Maximum time to wait for email sending (default: 10000ms)
 * @returns Promise resolving to SmtpTestResult
 *
 * @example
 * ```typescript
 * const result = await sendTestEmail({
 *   smtp_host: 'smtp.gmail.com',
 *   smtp_port: 587,
 *   smtp_user: 'user@example.com',
 *   smtp_password: 'password',
 *   smtp_from_email: 'noreply@example.com',
 *   smtp_from_name: 'MedSync',
 *   use_tls: true
 * });
 *
 * if (result.success) {
 *   console.log('Email sent successfully');
 * } else {
 *   console.error('Failed to send email:', result.error);
 * }
 * ```
 */
export async function sendTestEmail(
  config: SmtpConfig,
  timeoutMs: number = 10000
): Promise<SmtpTestResult> {
  let transporter: Transporter | null = null;

  try {
    // Create transporter
    transporter = createSmtpTransporter(config);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Tempo de conexão excedido (10 segundos). Verifique suas configurações de SMTP.'));
      }, timeoutMs);
    });

    // Create email sending promise
    const sendPromise = (async () => {
      // Verify connection
      await transporter!.verify();

      // Send test email
      const info = await transporter!.sendMail({
        from: `"${config.smtp_from_name}" <${config.smtp_from_email}>`,
        to: config.smtp_from_email, // Send to the configured from email
        subject: 'Teste de Configuração SMTP - MedSync',
        text: `Este é um email de teste para verificar suas configurações de SMTP.\n\nSe você recebeu esta mensagem, suas configurações estão corretas!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Teste de Configuração SMTP</h2>
            <p>Este é um email de teste para verificar suas configurações de SMTP.</p>
            <p><strong>Se você recebeu esta mensagem, suas configurações estão corretas!</strong></p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">
              Este email foi enviado automaticamente pelo sistema MedSync para testar a configuração de SMTP.
            </p>
          </div>
        `,
      });

      return info;
    })();

    // Race between sending and timeout
    await Promise.race([sendPromise, timeoutPromise]);

    return {
      success: true,
      message: `Email de teste enviado com sucesso para ${config.smtp_from_email}`,
    };
  } catch (error) {
    // Format error message based on error type
    const errorMessage = formatSmtpError(error);

    return {
      success: false,
      message: 'Falha ao enviar email de teste',
      error: errorMessage,
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
      } : error,
    };
  } finally {
    // Close transporter connection
    if (transporter) {
      transporter.close();
    }
  }
}

/**
 * Formats SMTP errors into user-friendly messages
 *
 * @param error - Error object from nodemailer
 * @returns Formatted error message in Portuguese
 */
function formatSmtpError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Erro desconhecido ao testar conexão SMTP';
  }

  const errorMessage = error.message.toLowerCase();

  // Connection timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('tempo')) {
    return 'Tempo de conexão excedido. Verifique o host e a porta SMTP.';
  }

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('authentication') || errorMessage.includes('login')) {
    return 'Falha na autenticação. Verifique o usuário e senha SMTP.';
  }

  // Invalid credentials
  if (errorMessage.includes('invalid credentials') || errorMessage.includes('535')) {
    return 'Credenciais inválidas. Verifique o usuário e senha SMTP.';
  }

  // Connection refused
  if (errorMessage.includes('econnrefused') || errorMessage.includes('connection refused')) {
    return 'Conexão recusada. Verifique se o servidor SMTP está acessível e a porta está correta.';
  }

  // Host not found
  if (errorMessage.includes('enotfound') || errorMessage.includes('getaddrinfo')) {
    return 'Host não encontrado. Verifique o endereço do servidor SMTP.';
  }

  // Network unreachable
  if (errorMessage.includes('enetunreach') || errorMessage.includes('network')) {
    return 'Rede inacessível. Verifique sua conexão com a internet.';
  }

  // TLS/SSL errors
  if (errorMessage.includes('tls') || errorMessage.includes('ssl') || errorMessage.includes('certificate')) {
    return 'Erro de certificado TLS/SSL. Tente desabilitar TLS ou verifique as configurações de segurança.';
  }

  // SMTP protocol errors
  if (errorMessage.includes('smtp') || errorMessage.includes('protocol')) {
    return 'Erro de protocolo SMTP. Verifique as configurações de porta e TLS.';
  }

  // Generic error with original message
  return `Erro ao conectar: ${error.message}`;
}
