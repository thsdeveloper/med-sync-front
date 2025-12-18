import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMedicalStaffById,
  getMedicalStaffByIds,
  type MedicalStaffDetailView,
} from '../medical-staff-queries';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient<Database>;

  return mockClient;
};

describe('getMedicalStaffById', () => {
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('Successful queries', () => {
    it('should return complete medical staff details for valid ID', async () => {
      const staffId = 'staff-123';
      const organizationId = 'org-456';

      // Mock medical_staff query
      const mockStaffData = {
        id: staffId,
        name: 'Dr. João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        cpf: '12345678901',
        active: true,
        color: '#3B82F6',
        avatar_url: null,
        auth_email: 'joao@example.com',
        user_id: 'user-789',
        crm: '12345-SP',
        registro_numero: '12345',
        registro_categoria: 'Médico',
        registro_uf: 'SP',
        especialidade_id: 'esp-001',
        profissao_id: 'prof-001',
        organization_id: organizationId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        especialidade: {
          id: 'esp-001',
          nome: 'Cardiologia',
          created_at: '2024-01-01T00:00:00Z',
        },
        profissao: {
          id: 'prof-001',
          nome: 'Médico',
          conselho_id: 'conselho-001',
          categorias_disponiveis: ['CRM'],
          conselho: {
            id: 'conselho-001',
            sigla: 'CRM',
            nome: 'Conselho Regional de Medicina',
          },
        },
      };

      const mockOrgLinks = [
        {
          id: 'link-001',
          organization_id: organizationId,
          staff_id: staffId,
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          organization: {
            id: organizationId,
            name: 'Hospital ABC',
          },
        },
      ];

      const mockShifts = [
        {
          id: 'shift-001',
          start_time: '2024-01-15T08:00:00Z',
          end_time: '2024-01-15T16:00:00Z',
          status: 'completed',
          notes: 'Regular shift',
          facility_id: 'facility-001',
          sector_id: 'sector-001',
          facility: {
            id: 'facility-001',
            name: 'Unidade Central',
            type: 'hospital',
            active: true,
            phone: '1133334444',
            cnpj: '12345678000190',
          },
        },
      ];

      // Mock chain for medical_staff query
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockStaffData,
            error: null,
          }),
        }),
      });

      // Mock chain for staff_organizations query
      const orgSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockOrgLinks,
          error: null,
        }),
      });

      // Mock chain for shifts query
      const shiftsSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockShifts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Setup mock implementation
      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'medical_staff') {
          return { select: selectMock };
        }
        if (table === 'staff_organizations') {
          return { select: orgSelectMock };
        }
        if (table === 'shifts') {
          return { select: shiftsSelectMock };
        }
        return {};
      });

      const result = await getMedicalStaffById(
        mockSupabase,
        staffId,
        organizationId
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(staffId);
      expect(result?.name).toBe('Dr. João Silva');
      expect(result?.email).toBe('joao@example.com');
      expect(result?.especialidade?.nome).toBe('Cardiologia');
      expect(result?.profissao?.nome).toBe('Médico');
      expect(result?.facilities).toHaveLength(1);
      expect(result?.facilities[0].name).toBe('Unidade Central');
      expect(result?.recentShifts).toHaveLength(1);
      expect(result?.organizations).toHaveLength(1);
    });

    it('should handle medical staff without specialty', async () => {
      const staffId = 'staff-123';
      const organizationId = 'org-456';

      const mockStaffData = {
        id: staffId,
        name: 'Dr. Maria Santos',
        email: 'maria@example.com',
        phone: null,
        cpf: null,
        active: true,
        color: '#3B82F6',
        avatar_url: null,
        auth_email: null,
        user_id: null,
        crm: null,
        registro_numero: '54321',
        registro_categoria: null,
        registro_uf: 'RJ',
        especialidade_id: null,
        profissao_id: 'prof-002',
        organization_id: organizationId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        especialidade: null,
        profissao: {
          id: 'prof-002',
          nome: 'Enfermeiro',
          conselho_id: 'conselho-002',
          categorias_disponiveis: ['COREN'],
          conselho: {
            id: 'conselho-002',
            sigla: 'COREN',
            nome: 'Conselho Regional de Enfermagem',
          },
        },
      };

      const mockOrgLinks = [
        {
          id: 'link-002',
          organization_id: organizationId,
          staff_id: staffId,
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          organization: {
            id: organizationId,
            name: 'Clínica XYZ',
          },
        },
      ];

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockStaffData,
            error: null,
          }),
        }),
      });

      const orgSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockOrgLinks,
          error: null,
        }),
      });

      const shiftsSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'medical_staff') return { select: selectMock };
        if (table === 'staff_organizations') return { select: orgSelectMock };
        if (table === 'shifts') return { select: shiftsSelectMock };
        return {};
      });

      const result = await getMedicalStaffById(
        mockSupabase,
        staffId,
        organizationId
      );

      expect(result).not.toBeNull();
      expect(result?.especialidade).toBeNull();
      expect(result?.profissao?.nome).toBe('Enfermeiro');
      expect(result?.facilities).toHaveLength(0);
      expect(result?.recentShifts).toHaveLength(0);
    });

    it('should limit recent shifts to 10', async () => {
      const staffId = 'staff-123';
      const organizationId = 'org-456';

      const mockStaffData = {
        id: staffId,
        name: 'Dr. Pedro Costa',
        email: 'pedro@example.com',
        phone: null,
        cpf: null,
        active: true,
        color: '#3B82F6',
        avatar_url: null,
        auth_email: null,
        user_id: null,
        crm: null,
        registro_numero: '99999',
        registro_categoria: null,
        registro_uf: 'MG',
        especialidade_id: 'esp-002',
        profissao_id: 'prof-001',
        organization_id: organizationId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        especialidade: {
          id: 'esp-002',
          nome: 'Neurologia',
          created_at: '2024-01-01T00:00:00Z',
        },
        profissao: {
          id: 'prof-001',
          nome: 'Médico',
          conselho_id: 'conselho-001',
          categorias_disponiveis: ['CRM'],
          conselho: {
            id: 'conselho-001',
            sigla: 'CRM',
            nome: 'Conselho Regional de Medicina',
          },
        },
      };

      const mockOrgLinks = [
        {
          id: 'link-003',
          organization_id: organizationId,
          staff_id: staffId,
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          organization: {
            id: organizationId,
            name: 'Hospital DEF',
          },
        },
      ];

      // Create 15 mock shifts
      const mockShifts = Array.from({ length: 15 }, (_, i) => ({
        id: `shift-${i}`,
        start_time: `2024-01-${15 - i}T08:00:00Z`,
        end_time: `2024-01-${15 - i}T16:00:00Z`,
        status: 'completed',
        notes: `Shift ${i}`,
        facility_id: 'facility-001',
        sector_id: 'sector-001',
        facility: {
          id: 'facility-001',
          name: 'Unidade Principal',
          type: 'hospital',
          active: true,
          phone: '1133334444',
          cnpj: '12345678000190',
        },
      }));

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockStaffData,
            error: null,
          }),
        }),
      });

      const orgSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockOrgLinks,
          error: null,
        }),
      });

      const shiftsSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockShifts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'medical_staff') return { select: selectMock };
        if (table === 'staff_organizations') return { select: orgSelectMock };
        if (table === 'shifts') return { select: shiftsSelectMock };
        return {};
      });

      const result = await getMedicalStaffById(
        mockSupabase,
        staffId,
        organizationId
      );

      expect(result).not.toBeNull();
      expect(result?.recentShifts).toHaveLength(10);
    });
  });

  describe('Organization boundary enforcement (RLS)', () => {
    it('should return null when staff does not belong to requested organization', async () => {
      const staffId = 'staff-123';
      const organizationId = 'org-456';
      const differentOrgId = 'org-999';

      const mockStaffData = {
        id: staffId,
        name: 'Dr. Ana Paula',
        email: 'ana@example.com',
        phone: null,
        cpf: null,
        active: true,
        color: '#3B82F6',
        avatar_url: null,
        auth_email: null,
        user_id: null,
        crm: null,
        registro_numero: '11111',
        registro_categoria: null,
        registro_uf: 'SP',
        especialidade_id: null,
        profissao_id: 'prof-001',
        organization_id: differentOrgId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        especialidade: null,
        profissao: null,
      };

      // Staff belongs to a different organization
      const mockOrgLinks = [
        {
          id: 'link-004',
          organization_id: differentOrgId,
          staff_id: staffId,
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          organization: {
            id: differentOrgId,
            name: 'Another Hospital',
          },
        },
      ];

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockStaffData,
            error: null,
          }),
        }),
      });

      const orgSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockOrgLinks,
          error: null,
        }),
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'medical_staff') return { select: selectMock };
        if (table === 'staff_organizations') return { select: orgSelectMock };
        return {};
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await getMedicalStaffById(
        mockSupabase,
        staffId,
        organizationId
      );

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should allow access when staff belongs to multiple organizations including requested one', async () => {
      const staffId = 'staff-123';
      const organizationId = 'org-456';

      const mockStaffData = {
        id: staffId,
        name: 'Dr. Carlos Eduardo',
        email: 'carlos@example.com',
        phone: null,
        cpf: null,
        active: true,
        color: '#3B82F6',
        avatar_url: null,
        auth_email: null,
        user_id: null,
        crm: null,
        registro_numero: '22222',
        registro_categoria: null,
        registro_uf: 'RJ',
        especialidade_id: 'esp-003',
        profissao_id: 'prof-001',
        organization_id: organizationId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        especialidade: {
          id: 'esp-003',
          nome: 'Pediatria',
          created_at: '2024-01-01T00:00:00Z',
        },
        profissao: {
          id: 'prof-001',
          nome: 'Médico',
          conselho_id: 'conselho-001',
          categorias_disponiveis: ['CRM'],
          conselho: {
            id: 'conselho-001',
            sigla: 'CRM',
            nome: 'Conselho Regional de Medicina',
          },
        },
      };

      // Staff belongs to multiple organizations
      const mockOrgLinks = [
        {
          id: 'link-005',
          organization_id: organizationId,
          staff_id: staffId,
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          organization: {
            id: organizationId,
            name: 'Hospital ABC',
          },
        },
        {
          id: 'link-006',
          organization_id: 'org-999',
          staff_id: staffId,
          active: true,
          created_at: '2024-01-02T00:00:00Z',
          organization: {
            id: 'org-999',
            name: 'Hospital XYZ',
          },
        },
      ];

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockStaffData,
            error: null,
          }),
        }),
      });

      const orgSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockOrgLinks,
          error: null,
        }),
      });

      const shiftsSelectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'medical_staff') return { select: selectMock };
        if (table === 'staff_organizations') return { select: orgSelectMock };
        if (table === 'shifts') return { select: shiftsSelectMock };
        return {};
      });

      const result = await getMedicalStaffById(
        mockSupabase,
        staffId,
        organizationId
      );

      expect(result).not.toBeNull();
      expect(result?.organizations).toHaveLength(2);
    });
  });

  describe('Error handling', () => {
    it('should return null when medical staff not found', async () => {
      const staffId = 'nonexistent-staff';
      const organizationId = 'org-456';

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found', code: 'PGRST116' },
          }),
        }),
      });

      (mockSupabase.from as any).mockImplementation(() => ({
        select: selectMock,
      }));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getMedicalStaffById(
        mockSupabase,
        staffId,
        organizationId
      );

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle database errors gracefully', async () => {
      const staffId = 'staff-123';
      const organizationId = 'org-456';

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      (mockSupabase.from as any).mockImplementation(() => ({
        select: selectMock,
      }));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getMedicalStaffById(
        mockSupabase,
        staffId,
        organizationId
      );

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('getMedicalStaffByIds', () => {
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it('should return array of medical staff details for valid IDs', async () => {
    const staffIds = ['staff-1', 'staff-2'];
    const organizationId = 'org-456';

    const createMockData = (id: string, name: string) => ({
      id,
      name,
      email: `${name.toLowerCase()}@example.com`,
      phone: null,
      cpf: null,
      active: true,
      color: '#3B82F6',
      avatar_url: null,
      auth_email: null,
      user_id: null,
      crm: null,
      registro_numero: '12345',
      registro_categoria: null,
      registro_uf: 'SP',
      especialidade_id: null,
      profissao_id: null,
      organization_id: organizationId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      especialidade: null,
      profissao: null,
    });

    let callCount = 0;
    const mockStaffDataArray = [
      createMockData('staff-1', 'Dr. A'),
      createMockData('staff-2', 'Dr. B'),
    ];

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockImplementation(() => {
          const data = mockStaffDataArray[callCount];
          callCount++;
          return Promise.resolve({ data, error: null });
        }),
      }),
    });

    const orgSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((_field: string, staffId: string) => {
        return Promise.resolve({
          data: [
            {
              id: `link-${staffId}`,
              organization_id: organizationId,
              staff_id: staffId,
              active: true,
              created_at: '2024-01-01T00:00:00Z',
              organization: {
                id: organizationId,
                name: 'Hospital ABC',
              },
            },
          ],
          error: null,
        });
      }),
    });

    const shiftsSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === 'medical_staff') return { select: selectMock };
      if (table === 'staff_organizations') return { select: orgSelectMock };
      if (table === 'shifts') return { select: shiftsSelectMock };
      return {};
    });

    const result = await getMedicalStaffByIds(
      mockSupabase,
      staffIds,
      organizationId
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('staff-1');
    expect(result[1].id).toBe('staff-2');
  });

  it('should filter out null results for inaccessible staff', async () => {
    const staffIds = ['staff-1', 'staff-2', 'staff-3'];
    const organizationId = 'org-456';

    // Staff-2 will be inaccessible (different org)
    const createMockData = (id: string, name: string, orgId: string) => ({
      id,
      name,
      email: `${name.toLowerCase()}@example.com`,
      phone: null,
      cpf: null,
      active: true,
      color: '#3B82F6',
      avatar_url: null,
      auth_email: null,
      user_id: null,
      crm: null,
      registro_numero: '12345',
      registro_categoria: null,
      registro_uf: 'SP',
      especialidade_id: null,
      profissao_id: null,
      organization_id: orgId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      especialidade: null,
      profissao: null,
    });

    let callCount = 0;
    const mockStaffDataArray = [
      createMockData('staff-1', 'Dr. A', organizationId),
      createMockData('staff-2', 'Dr. B', 'org-999'), // Different org
      createMockData('staff-3', 'Dr. C', organizationId),
    ];

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockImplementation(() => {
          const data = mockStaffDataArray[callCount];
          callCount++;
          return Promise.resolve({ data, error: null });
        }),
      }),
    });

    let orgCallCount = 0;
    const orgSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((_field: string, staffId: string) => {
        const staffData = mockStaffDataArray[orgCallCount];
        orgCallCount++;
        return Promise.resolve({
          data: [
            {
              id: `link-${staffId}`,
              organization_id: staffData.organization_id,
              staff_id: staffId,
              active: true,
              created_at: '2024-01-01T00:00:00Z',
              organization: {
                id: staffData.organization_id,
                name: 'Hospital ABC',
              },
            },
          ],
          error: null,
        });
      }),
    });

    const shiftsSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === 'medical_staff') return { select: selectMock };
      if (table === 'staff_organizations') return { select: orgSelectMock };
      if (table === 'shifts') return { select: shiftsSelectMock };
      return {};
    });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getMedicalStaffByIds(
      mockSupabase,
      staffIds,
      organizationId
    );

    // Should only return 2 results (staff-1 and staff-3, excluding staff-2)
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('staff-1');
    expect(result[1].id).toBe('staff-3');

    consoleWarnSpy.mockRestore();
  });
});
