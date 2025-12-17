/**
 * Unit tests for Equipe (Medical Staff) page component
 *
 * Tests data fetching with especialidade integration, loading states, error states,
 * user interactions, and integration with DataTable and MedicalStaffSheet components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamPage from '../page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MedicalStaffWithOrganization } from '@medsync/shared';

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/providers/OrganizationProvider', () => ({
  useOrganization: vi.fn(),
}));

// Mock child components
vi.mock('@/components/organisms/page', () => ({
  PageHeader: ({ title, description, actions }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
      <div>{actions}</div>
    </div>
  ),
}));

vi.mock('@/components/data-table/organisms/DataTable', () => ({
  DataTable: ({ data, isLoading, emptyMessage, searchPlaceholder }: any) => (
    <div data-testid="data-table">
      {isLoading ? (
        <div data-testid="loading-state">Loading...</div>
      ) : data.length === 0 ? (
        <div data-testid="empty-state">{emptyMessage}</div>
      ) : (
        <div data-testid="table-content">
          <input placeholder={searchPlaceholder} data-testid="search-input" />
          {data.map((staff: MedicalStaffWithOrganization) => (
            <div key={staff.id} data-testid="table-row">
              {staff.name} - {staff.especialidade?.nome}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/organisms/medical-staff/MedicalStaffSheet', () => ({
  MedicalStaffSheet: ({ isOpen, onClose, staffToEdit }: any) => (
    <>
      {isOpen && (
        <div data-testid="staff-sheet">
          <h2>{staffToEdit ? 'Edit Staff' : 'New Staff'}</h2>
          <button onClick={onClose} data-testid="sheet-close">
            Close
          </button>
        </div>
      )}
    </>
  ),
}));

vi.mock('@/components/organisms/medical-staff/medical-staff-columns', () => ({
  getMedicalStaffColumns: vi.fn(() => []),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
}));

describe('Equipe (Medical Staff) Page', () => {
  let queryClient: QueryClient;
  let mockSupabaseFrom: any;
  let mockUseOrganization: any;

  const mockStaffData: MedicalStaffWithOrganization[] = [
    {
      id: 'staff-1',
      name: 'Dr. João Silva',
      email: 'joao@example.com',
      phone: '(11) 98765-4321',
      crm: 'CRM/SP 123456',
      role: 'Médico',
      color: '#3B82F6',
      active: true,
      especialidade_id: 'esp-1',
      created_at: '2025-12-15T20:00:00Z',
      updated_at: '2025-12-15T20:00:00Z',
      especialidade: {
        id: 'esp-1',
        nome: 'Cardiologia',
        created_at: '2025-12-01T00:00:00Z',
      },
      staff_organization: {
        id: 'stafforg-1',
        staff_id: 'staff-1',
        organization_id: 'org-1',
        active: true,
        created_at: '2025-12-15T20:00:00Z',
      },
      organization_count: 1,
    },
    {
      id: 'staff-2',
      name: 'Dra. Maria Santos',
      email: 'maria@example.com',
      phone: '(11) 91234-5678',
      crm: 'CRM/SP 654321',
      role: 'Médica',
      color: '#10B981',
      active: true,
      especialidade_id: 'esp-2',
      created_at: '2025-12-14T10:00:00Z',
      updated_at: '2025-12-14T10:00:00Z',
      especialidade: {
        id: 'esp-2',
        nome: 'Neurologia',
        created_at: '2025-12-01T00:00:00Z',
      },
      staff_organization: {
        id: 'stafforg-2',
        staff_id: 'staff-2',
        organization_id: 'org-1',
        active: true,
        created_at: '2025-12-14T10:00:00Z',
      },
      organization_count: 2,
    },
  ];

  const mockStaffOrgsResponse = [
    {
      id: 'stafforg-1',
      staff_id: 'staff-1',
      organization_id: 'org-1',
      active: true,
      created_at: '2025-12-15T20:00:00Z',
      medical_staff: {
        id: 'staff-1',
        name: 'Dr. João Silva',
        email: 'joao@example.com',
        phone: '(11) 98765-4321',
        crm: 'CRM/SP 123456',
        role: 'Médico',
        color: '#3B82F6',
        active: true,
        especialidade_id: 'esp-1',
        created_at: '2025-12-15T20:00:00Z',
        updated_at: '2025-12-15T20:00:00Z',
        especialidade: {
          id: 'esp-1',
          nome: 'Cardiologia',
          created_at: '2025-12-01T00:00:00Z',
        },
      },
    },
    {
      id: 'stafforg-2',
      staff_id: 'staff-2',
      organization_id: 'org-1',
      active: true,
      created_at: '2025-12-14T10:00:00Z',
      medical_staff: {
        id: 'staff-2',
        name: 'Dra. Maria Santos',
        email: 'maria@example.com',
        phone: '(11) 91234-5678',
        crm: 'CRM/SP 654321',
        role: 'Médica',
        color: '#10B981',
        active: true,
        especialidade_id: 'esp-2',
        created_at: '2025-12-14T10:00:00Z',
        updated_at: '2025-12-14T10:00:00Z',
        especialidade: {
          id: 'esp-2',
          nome: 'Neurologia',
          created_at: '2025-12-01T00:00:00Z',
        },
      },
    },
  ];

  beforeEach(() => {
    // Create fresh QueryClient
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Setup mocks
    const { supabase } = require('@/lib/supabase');
    const { useOrganization } = require('@/providers/OrganizationProvider');

    mockSupabaseFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };

    supabase.from = vi.fn(() => mockSupabaseFrom);

    mockUseOrganization = useOrganization;
    mockUseOrganization.mockReturnValue({
      activeOrganization: { id: 'org-1', name: 'Test Org' },
      loading: false,
    });

    // Mock window.confirm
    global.window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  describe('Page Header', () => {
    it('should render page title and description', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });

      renderWithProviders(<TeamPage />);

      expect(screen.getByText('Corpo Clínico')).toBeInTheDocument();
      expect(
        screen.getByText(/Gerencie os médicos, enfermeiros e técnicos vinculados/)
      ).toBeInTheDocument();
    });

    it('should render Novo Profissional button', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });

      renderWithProviders(<TeamPage />);

      expect(screen.getByText('Novo Profissional')).toBeInTheDocument();
    });

    it('should disable Novo Profissional button when loading', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: { id: 'org-1', name: 'Test Org' },
        loading: true,
      });
      mockSupabaseFrom.order.mockResolvedValue({ data: [], error: null });

      renderWithProviders(<TeamPage />);

      const button = screen.getByText('Novo Profissional').closest('button');
      expect(button).toBeDisabled();
    });

    it('should disable Novo Profissional button when no organization', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<TeamPage />);

      const button = screen.getByText('Novo Profissional').closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Data Loading States', () => {
    it('should show loading state while fetching staff', async () => {
      mockSupabaseFrom.order.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockStaffOrgsResponse, error: null }), 100);
          })
      );

      renderWithProviders(<TeamPage />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should render staff after successful fetch with especialidade data', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('table-content')).toBeInTheDocument();
        expect(screen.getByText(/Dr. João Silva - Cardiologia/)).toBeInTheDocument();
        expect(screen.getByText(/Dra. Maria Santos - Neurologia/)).toBeInTheDocument();
      });
    });

    it('should handle empty staff list', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: [], error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(
          screen.getByText(/Nenhum profissional vinculado. Cadastre ou vincule profissionais/)
        ).toBeInTheDocument();
      });
    });

    it('should handle fetch error gracefully', async () => {
      const { toast } = require('sonner');
      mockSupabaseFrom.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        // Query should throw and be caught by React Query error state
        expect(screen.queryByTestId('table-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Especialidade Integration', () => {
    it('should fetch staff with especialidade JOIN data', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(mockSupabaseFrom.select).toHaveBeenCalledWith(
          expect.stringContaining('especialidade:especialidades')
        );
      });
    });

    it('should display especialidade name for each staff member', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.getByText(/Cardiologia/)).toBeInTheDocument();
        expect(screen.getByText(/Neurologia/)).toBeInTheDocument();
      });
    });

    it('should handle staff without especialidade gracefully', async () => {
      const staffWithoutEsp = [...mockStaffOrgsResponse];
      staffWithoutEsp[0] = {
        ...staffWithoutEsp[0],
        medical_staff: {
          ...(staffWithoutEsp[0].medical_staff as any),
          especialidade_id: null,
          especialidade: null,
        },
      };

      mockSupabaseFrom.order.mockResolvedValue({ data: staffWithoutEsp, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('table-content')).toBeInTheDocument();
      });
    });
  });

  describe('No Organization State', () => {
    it('should show no organization message when no active organization', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma organização selecionada')).toBeInTheDocument();
        expect(
          screen.getByText(/Selecione ou crie uma organização no menu lateral/)
        ).toBeInTheDocument();
      });
    });

    it('should not render DataTable when no active organization', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
      });
    });
  });

  describe('MedicalStaffSheet Integration', () => {
    it('should open sheet when Novo Profissional button clicked', async () => {
      const user = userEvent.setup();
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => screen.getByText('Novo Profissional'));

      const button = screen.getByText('Novo Profissional');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('staff-sheet')).toBeInTheDocument();
        expect(screen.getByText('New Staff')).toBeInTheDocument();
      });
    });

    it('should close sheet when close button clicked', async () => {
      const user = userEvent.setup();
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => screen.getByText('Novo Profissional'));

      // Open sheet
      await user.click(screen.getByText('Novo Profissional'));
      await waitFor(() => screen.getByTestId('staff-sheet'));

      // Close sheet
      await user.click(screen.getByTestId('sheet-close'));

      await waitFor(() => {
        expect(screen.queryByTestId('staff-sheet')).not.toBeInTheDocument();
      });
    });

    it('should not render sheet when no organization selected', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('staff-sheet')).not.toBeInTheDocument();
      });
    });
  });

  describe('Unlink Functionality', () => {
    it('should call unlink mutation for staff with multiple organizations', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 2, error: null });
      mockSupabaseFrom.eq.mockResolvedValue({ data: null, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      const { getMedicalStaffColumns } = require('@/components/organisms/medical-staff/medical-staff-columns');
      const columnsMock = getMedicalStaffColumns as any;
      const onUnlinkHandler = columnsMock.mock.calls[0]?.[0]?.onUnlink;

      if (onUnlinkHandler) {
        await onUnlinkHandler('staff-2', 'stafforg-2', 2);

        await waitFor(() => {
          const { toast } = require('sonner');
          expect(toast.success).toHaveBeenCalledWith('Profissional desvinculado com sucesso.');
        });
      }
    });

    it('should delete staff record when unlinking from only organization', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });
      mockSupabaseFrom.eq.mockResolvedValue({ data: null, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      const { getMedicalStaffColumns } = require('@/components/organisms/medical-staff/medical-staff-columns');
      const columnsMock = getMedicalStaffColumns as any;
      const onUnlinkHandler = columnsMock.mock.calls[0]?.[0]?.onUnlink;

      if (onUnlinkHandler) {
        await onUnlinkHandler('staff-1', 'stafforg-1', 1);

        await waitFor(() => {
          const { toast } = require('sonner');
          expect(toast.success).toHaveBeenCalledWith('Profissional removido com sucesso.');
        });
      }
    });

    it('should handle unlink error gracefully', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });
      mockSupabaseFrom.eq.mockResolvedValue({ data: null, error: { message: 'Delete failed' } });

      renderWithProviders(<TeamPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      const { getMedicalStaffColumns } = require('@/components/organisms/medical-staff/medical-staff-columns');
      const columnsMock = getMedicalStaffColumns as any;
      const onUnlinkHandler = columnsMock.mock.calls[0]?.[0]?.onUnlink;

      if (onUnlinkHandler) {
        await onUnlinkHandler('staff-1', 'stafforg-1', 1);

        await waitFor(() => {
          const { toast } = require('sonner');
          expect(toast.error).toHaveBeenCalledWith('Erro ao desvincular profissional.');
        });
      }
    });

    it('should not unlink when user cancels confirmation', async () => {
      global.window.confirm = vi.fn(() => false);
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      const { getMedicalStaffColumns } = require('@/components/organisms/medical-staff/medical-staff-columns');
      const columnsMock = getMedicalStaffColumns as any;
      const onUnlinkHandler = columnsMock.mock.calls[0]?.[0]?.onUnlink;

      if (onUnlinkHandler) {
        await onUnlinkHandler('staff-1', 'stafforg-1', 1);

        // Delete should not be called
        expect(mockSupabaseFrom.delete).not.toHaveBeenCalled();
      }
    });
  });

  describe('DataTable Configuration', () => {
    it('should configure DataTable with correct search placeholder', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Buscar por nome, função, especialidade ou CRM/);
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should pass correct props to DataTable', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      const { DataTable } = require('@/components/data-table/organisms/DataTable');
      const dataTableMock = DataTable as any;

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(dataTableMock).toHaveBeenCalledWith(
          expect.objectContaining({
            searchColumn: 'name',
            enablePagination: true,
            enableSorting: true,
            enableFiltering: true,
            pageSize: 10,
            showToolbar: true,
          }),
          expect.anything()
        );
      });
    });
  });

  describe('React Query Integration', () => {
    it('should use correct query key', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const staffQuery = queries.find((q) =>
          JSON.stringify(q.queryKey).includes('medical-staff')
        );
        expect(staffQuery?.queryKey).toEqual(['medical-staff', 'org-1']);
      });
    });

    it('should not fetch when organizationId is null', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(mockSupabaseFrom.select).not.toHaveBeenCalled();
      });
    });

    it('should not fetch when organization is loading', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: { id: 'org-1', name: 'Test Org' },
        loading: true,
      });

      renderWithProviders(<TeamPage />);

      // Wait a bit to ensure no fetch happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSupabaseFrom.select).not.toHaveBeenCalled();
    });

    it('should refetch data after successful create/update', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      // Get initial call count
      const initialCallCount = mockSupabaseFrom.select.mock.calls.length;

      // Simulate onSuccess callback
      const { MedicalStaffSheet } = require('@/components/organisms/medical-staff/MedicalStaffSheet');
      const sheetMock = MedicalStaffSheet as any;
      const onSuccessHandler = sheetMock.mock.calls[0]?.[0]?.onSuccess;

      if (onSuccessHandler) {
        onSuccessHandler();

        await waitFor(() => {
          expect(mockSupabaseFrom.select.mock.calls.length).toBeGreaterThan(initialCallCount);
        });
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null medical_staff in response', async () => {
      const invalidResponse = [
        {
          id: 'stafforg-1',
          staff_id: 'staff-1',
          organization_id: 'org-1',
          active: true,
          created_at: '2025-12-15T20:00:00Z',
          medical_staff: null,
        },
      ];

      mockSupabaseFrom.order.mockResolvedValue({ data: invalidResponse, error: null });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });

    it('should handle organization change', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      mockSupabaseFrom.select.mockResolvedValue({ count: 1, error: null });

      const { rerender } = renderWithProviders(<TeamPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      // Change organization
      mockUseOrganization.mockReturnValue({
        activeOrganization: { id: 'org-2', name: 'Another Org' },
        loading: false,
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <TeamPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const staffQuery = queries.find(
          (q) => JSON.stringify(q.queryKey).includes('medical-staff') && JSON.stringify(q.queryKey).includes('org-2')
        );
        expect(staffQuery).toBeDefined();
      });
    });

    it('should count organization links for each staff member', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockStaffOrgsResponse, error: null });
      
      // Mock different counts for different staff
      let callCount = 0;
      mockSupabaseFrom.select.mockImplementation(() => {
        callCount++;
        const count = callCount === 1 ? 1 : 2; // First call: 1 org, second call: 2 orgs
        return Promise.resolve({ count, error: null });
      });

      renderWithProviders(<TeamPage />);

      await waitFor(() => {
        expect(screen.getByTestId('table-content')).toBeInTheDocument();
      });

      // Verify count query was called for each staff member
      const countQueries = mockSupabaseFrom.select.mock.calls.filter((call: any[]) =>
        call[0]?.includes('count')
      );
      expect(countQueries.length).toBeGreaterThan(0);
    });
  });
});
