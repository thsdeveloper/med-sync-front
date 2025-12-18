/**
 * Unit tests for SMTP Test Connection API endpoint
 *
 * Tests the POST /api/smtp-settings/test-connection endpoint
 *
 * @module api/smtp-settings/test-connection/__tests__
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as smtpTest from '@/lib/email/smtp-test';

// Mock the smtp-test module
vi.mock('@/lib/email/smtp-test');

describe('POST /api/smtp-settings/test-connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validSmtpConfig = {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'user@example.com',
    smtp_password: 'password123',
    smtp_from_email: 'noreply@example.com',
    smtp_from_name: 'MedSync',
    use_tls: true,
    is_enabled: false,
  };

  describe('Successful Email Sending', () => {
    it('should return success when test email is sent successfully', async () => {
      // Mock successful email sending
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: true,
        message: 'Email de teste enviado com sucesso para noreply@example.com',
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Email de teste enviado com sucesso');
      expect(smtpTest.sendTestEmail).toHaveBeenCalledWith(validSmtpConfig, 10000);
    });

    it('should call sendTestEmail with 10 second timeout', async () => {
      // Mock successful email sending
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: true,
        message: 'Email de teste enviado com sucesso',
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      // Call endpoint
      await POST(request);

      // Verify timeout parameter
      expect(smtpTest.sendTestEmail).toHaveBeenCalledWith(
        expect.any(Object),
        10000 // 10 second timeout
      );
    });
  });

  describe('Connection Failures', () => {
    it('should return error when authentication fails', async () => {
      // Mock authentication failure
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: 'Falha na autenticação. Verifique o usuário e senha SMTP.',
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('autenticação');
    });

    it('should return error when connection times out', async () => {
      // Mock timeout error
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: 'Tempo de conexão excedido (10 segundos). Verifique suas configurações de SMTP.',
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tempo de conexão excedido');
    });

    it('should return error when host is not found', async () => {
      // Mock host not found error
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: 'Host não encontrado. Verifique o endereço do servidor SMTP.',
      });

      // Create request with invalid host
      const invalidConfig = { ...validSmtpConfig, smtp_host: 'invalid.host.example' };
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(invalidConfig),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Host não encontrado');
    });

    it('should return error when connection is refused', async () => {
      // Mock connection refused error
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: 'Conexão recusada. Verifique se o servidor SMTP está acessível e a porta está correta.',
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Conexão recusada');
    });

    it('should return error when TLS/SSL fails', async () => {
      // Mock TLS/SSL error
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: 'Erro de certificado TLS/SSL. Tente desabilitar TLS ou verifique as configurações de segurança.',
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('TLS/SSL');
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 when smtp_host is missing', async () => {
      const invalidConfig = { ...validSmtpConfig, smtp_host: undefined };

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(invalidConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Dados de configuração inválidos');
      expect(data.error).toBe('Validação falhou');
    });

    it('should return 400 when smtp_port is out of range', async () => {
      const invalidConfig = { ...validSmtpConfig, smtp_port: 70000 };

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(invalidConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Dados de configuração inválidos');
    });

    it('should return 400 when smtp_user is not a valid email', async () => {
      const invalidConfig = { ...validSmtpConfig, smtp_user: 'not-an-email' };

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(invalidConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Dados de configuração inválidos');
    });

    it('should return 400 when smtp_password is too short', async () => {
      const invalidConfig = { ...validSmtpConfig, smtp_password: 'short' };

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(invalidConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Dados de configuração inválidos');
    });

    it('should return 400 when smtp_from_email is not a valid email', async () => {
      const invalidConfig = { ...validSmtpConfig, smtp_from_email: 'invalid-email' };

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(invalidConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Dados de configuração inválidos');
    });

    it('should return 400 when request body is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Dados de configuração inválidos');
    });

    it('should return 400 when request body is malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: 'not-json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Timeout Enforcement', () => {
    it('should enforce 10 second timeout on connection', async () => {
      // Mock timeout scenario
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: 'Tempo de conexão excedido (10 segundos). Verifique suas configurações de SMTP.',
      });

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('10 segundos');
      expect(smtpTest.sendTestEmail).toHaveBeenCalledWith(validSmtpConfig, 10000);
    });
  });

  describe('Error Details', () => {
    it('should return detailed error information', async () => {
      const errorDetails = {
        name: 'Error',
        message: 'Invalid login: 535 5.7.8 Authentication failed',
      };

      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: 'Falha na autenticação. Verifique o usuário e senha SMTP.',
        details: errorDetails,
      });

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Falha ao enviar email de teste');
      expect(data.error).toBeTruthy();
    });

    it('should not expose sensitive credentials in error messages', async () => {
      vi.mocked(smtpTest.sendTestEmail).mockResolvedValue({
        success: false,
        message: 'Falha ao enviar email de teste',
        error: 'Falha na autenticação. Verifique o usuário e senha SMTP.',
      });

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      // Ensure password is not in response
      const responseText = JSON.stringify(data);
      expect(responseText).not.toContain(validSmtpConfig.smtp_password);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(smtpTest.sendTestEmail).mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Erro interno do servidor');
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(smtpTest.sendTestEmail).mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/smtp-settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(validSmtpConfig),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
