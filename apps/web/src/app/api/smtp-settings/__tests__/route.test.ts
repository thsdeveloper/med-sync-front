/**
 * Unit Tests for SMTP Settings API Routes
 *
 * Tests GET, POST, and PATCH endpoints with various scenarios:
 * - Admin authorization enforcement
 * - Password encryption/sanitization
 * - Validation errors
 * - Success cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '../route';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/lib/encryption/smtp-encryption', () => ({
  encryptPassword: vi.fn((password: string) => `encrypted_${password}`),
}));

vi.mock('@/lib/auth/admin-check', () => ({
  checkAdminAccess: vi.fn(),
  getOrganizationIdFromBody: vi.fn((body: Record<string, unknown>) => body.organization_id as string | null),
  getOrganizationIdFromQuery: vi.fn((params: URLSearchParams) => params.get('organization_id')),
}));

import { supabase } from '@/lib/supabase';
import { encryptPassword } from '@/lib/encryption/smtp-encryption';
import { checkAdminAccess } from '@/lib/auth/admin-check';

const mockSupabase = supabase as {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
};

const mockEncryptPassword = encryptPassword as ReturnType<typeof vi.fn>;
const mockCheckAdminAccess = checkAdminAccess as ReturnType<typeof vi.fn>;

/**
 * Helper to create a mock NextRequest
 */
function createMockRequest(options: {
  method: string;
  url: string;
  body?: unknown;
}): NextRequest {
  const request = new NextRequest(options.url, {
    method: options.method,
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  return request;
}

/**
 * Sample SMTP settings data
 */
const sampleSmtpSettings = {
  id: 'smtp-123',
  organization_id: 'org-123',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: 'user@gmail.com',
  smtp_password: 'encrypted_password123',
  smtp_from_email: 'noreply@medsync.com',
  smtp_from_name: 'MedSync',
  use_tls: true,
  is_enabled: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('GET /api/smtp-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/smtp-settings?organization_id=org-123',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Não autenticado');
  });

  it('should return 400 when organization_id parameter is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/smtp-settings',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('organization_id parameter is required');
  });

  it('should return 403 when user is not an admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: false,
      error: 'Acesso negado. Apenas administradores podem realizar esta ação.',
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/smtp-settings?organization_id=org-123',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Acesso negado');
  });

  it('should return 404 when no SMTP settings found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Administrador',
      staffId: 'staff-123',
    });

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/smtp-settings?organization_id=org-123',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Nenhuma configuração SMTP encontrada');
  });

  it('should return sanitized SMTP settings (without password)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Administrador',
      staffId: 'staff-123',
    });

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: sampleSmtpSettings,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/smtp-settings?organization_id=org-123',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.smtp_password).toBeUndefined(); // Password should be sanitized
    expect(data.data.smtp_host).toBe('smtp.gmail.com');
    expect(data.data.smtp_port).toBe(587);
  });
});

describe('POST /api/smtp-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPostBody = {
    organization_id: 'org-123',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'user@gmail.com',
    smtp_password: 'password123',
    smtp_from_email: 'noreply@medsync.com',
    smtp_from_name: 'MedSync',
    use_tls: true,
    is_enabled: false,
  };

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/smtp-settings',
      body: validPostBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Não autenticado');
  });

  it('should return 400 when organization_id is missing from body', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const bodyWithoutOrgId = { ...validPostBody };
    delete (bodyWithoutOrgId as { organization_id?: string }).organization_id;

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/smtp-settings',
      body: bodyWithoutOrgId,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('organization_id é obrigatório');
  });

  it('should return 400 when validation fails (invalid port)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Administrador',
      staffId: 'staff-123',
    });

    const invalidBody = {
      ...validPostBody,
      smtp_port: 99999, // Invalid port (exceeds 65535)
    };

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/smtp-settings',
      body: invalidBody,
    });

    const response = await POST(request);
    const data = await response.json();

    // Should return 400 with validation error message
    // Schema validation is tested separately in smtp-settings.schema.test.ts
    expect(response.status).toBe(400);
    expect(data.error).toBe('Dados de entrada inválidos');
  });

  it('should encrypt password before storing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Administrador',
      staffId: 'staff-123',
    });

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { ...sampleSmtpSettings, smtp_password: 'encrypted_password123' },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    mockEncryptPassword.mockReturnValue('encrypted_password123');

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/smtp-settings',
      body: validPostBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(mockEncryptPassword).toHaveBeenCalledWith('password123');
    expect(response.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(data.data.smtp_password).toBeUndefined(); // Sanitized in response
  });

  it('should return 409 when organization already has SMTP settings', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Administrador',
      staffId: 'staff-123',
    });

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'Unique constraint violation' },
    });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/smtp-settings',
      body: validPostBody,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('já possui configurações SMTP');
  });
});

describe('PATCH /api/smtp-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPatchBody = {
    organization_id: 'org-123',
    smtp_host: 'smtp.new-host.com',
    is_enabled: true,
  };

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = createMockRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/smtp-settings',
      body: validPatchBody,
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Não autenticado');
  });

  it('should return 403 when user is not an admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: false,
      role: 'Médico',
      error: 'Acesso negado',
    });

    const request = createMockRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/smtp-settings',
      body: validPatchBody,
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Acesso negado');
  });

  it('should update only provided fields', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Administrador',
      staffId: 'staff-123',
    });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { ...sampleSmtpSettings, smtp_host: 'smtp.new-host.com', is_enabled: true },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    const request = createMockRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/smtp-settings',
      body: validPatchBody,
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data.smtp_password).toBeUndefined(); // Sanitized
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        smtp_host: 'smtp.new-host.com',
        is_enabled: true,
      })
    );
  });

  it('should encrypt password when updating it', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Dono',
      staffId: 'staff-123',
    });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: sampleSmtpSettings,
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    mockEncryptPassword.mockReturnValue('encrypted_newpassword');

    const bodyWithPassword = {
      organization_id: 'org-123',
      smtp_password: 'newPassword123',
    };

    const request = createMockRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/smtp-settings',
      body: bodyWithPassword,
    });

    const response = await PATCH(request);

    expect(mockEncryptPassword).toHaveBeenCalledWith('newPassword123');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        smtp_password: 'encrypted_newpassword',
      })
    );
  });

  it('should return 404 when SMTP settings not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Administrador',
      staffId: 'staff-123',
    });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    const request = createMockRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/smtp-settings',
      body: validPatchBody,
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Nenhuma configuração SMTP encontrada');
  });

  it('should return 400 when no fields to update', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockCheckAdminAccess.mockResolvedValue({
      isAdmin: true,
      role: 'Administrador',
      staffId: 'staff-123',
    });

    // No need to mock database since validation happens before DB call

    const emptyBody = {
      organization_id: 'org-123',
    };

    const request = createMockRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/smtp-settings',
      body: emptyBody,
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Nenhum campo para atualizar');
  });
});
