/**
 * Unit tests for Clínicas page component
 *
 * Tests data fetching, loading states, error states, user interactions,
 * and integration with DataTable and FacilitySheet components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClinicsPage from '../page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Facility } from '@medsync/shared';

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

// Mock child components to simplify testing
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
          {data.map((facility: Facility) => (
            <div key={facility.id} data-testid="table-row">
              {facility.name}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/organisms/facilities/FacilitySheet', () => ({
  FacilitySheet: ({ isOpen, onClose, facilityToEdit }: any) => (
    <>
      {isOpen && (
        <div data-testid="facility-sheet">
          <h2>{facilityToEdit ? 'Edit Facility' : 'New Facility'}</h2>
          <button onClick={onClose} data-testid="sheet-close">
            Close
          </button>
        </div>
      )}
    </>
  ),
}));

vi.mock('@/components/organisms/clinicas/clinicas-columns', () => ({
  getClinicasColumns: vi.fn(() => []),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Building2: () => <div data-testid="building-icon">Building</div>,
}));

describe('Clínicas Page', () => {
  let queryClient: QueryClient;
  let mockSupabaseFrom: any;
  let mockUseOrganization: any;

  const mockFacilities: Facility[] = [
    {
      id: '1',
      organization_id: 'org-1',
      name: 'Clínica Central',
      type: 'clinic',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 98765-4321',
      active: true,
      created_at: '2025-12-15T20:00:00Z',
      updated_at: '2025-12-15T20:00:00Z',
    },
    {
      id: '2',
      organization_id: 'org-1',
      name: 'Hospital São Paulo',
      type: 'hospital',
      cnpj: '98.765.432/0001-10',
      phone: '(11) 91234-5678',
      active: true,
      created_at: '2025-12-14T10:00:00Z',
      updated_at: '2025-12-14T10:00:00Z',
    },
  ];

  beforeEach(() => {
    // Create a fresh QueryClient for each test
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
      mockSupabaseFrom.order.mockResolvedValue({ data: [], error: null });

      renderWithProviders(<ClinicsPage />);

      expect(screen.getByText('Clínicas e Hospitais')).toBeInTheDocument();
      expect(
        screen.getByText('Gerencie as unidades de saúde vinculadas à sua organização.')
      ).toBeInTheDocument();
    });

    it('should render Nova Unidade button', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: [], error: null });

      renderWithProviders(<ClinicsPage />);

      expect(screen.getByText('Nova Unidade')).toBeInTheDocument();
    });

    it('should disable Nova Unidade button when loading', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: { id: 'org-1', name: 'Test Org' },
        loading: true,
      });
      mockSupabaseFrom.order.mockResolvedValue({ data: [], error: null });

      renderWithProviders(<ClinicsPage />);

      const button = screen.getByText('Nova Unidade').closest('button');
      expect(button).toBeDisabled();
    });

    it('should disable Nova Unidade button when no organization', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<ClinicsPage />);

      const button = screen.getByText('Nova Unidade').closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Data Loading States', () => {
    it('should show loading state while fetching facilities', async () => {
      mockSupabaseFrom.order.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockFacilities, error: null }), 100);
          })
      );

      renderWithProviders(<ClinicsPage />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should render facilities after successful fetch', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('table-content')).toBeInTheDocument();
        expect(screen.getByText('Clínica Central')).toBeInTheDocument();
        expect(screen.getByText('Hospital São Paulo')).toBeInTheDocument();
      });
    });

    it('should handle empty facilities list', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: [], error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(
          screen.getByText(/Nenhuma unidade cadastrada. Comece cadastrando suas clínicas e hospitais./)
        ).toBeInTheDocument();
      });
    });

    it('should handle fetch error gracefully', async () => {
      const { toast } = require('sonner');
      mockSupabaseFrom.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao carregar dados das unidades.');
      });
    });
  });

  describe('No Organization State', () => {
    it('should show no organization message when no active organization', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<ClinicsPage />);

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

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
      });
    });
  });

  describe('FacilitySheet Integration', () => {
    it('should open sheet when Nova Unidade button clicked', async () => {
      const user = userEvent.setup();
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => screen.getByText('Nova Unidade'));

      const button = screen.getByText('Nova Unidade');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('facility-sheet')).toBeInTheDocument();
        expect(screen.getByText('New Facility')).toBeInTheDocument();
      });
    });

    it('should close sheet when close button clicked', async () => {
      const user = userEvent.setup();
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => screen.getByText('Nova Unidade'));

      // Open sheet
      await user.click(screen.getByText('Nova Unidade'));

      await waitFor(() => screen.getByTestId('facility-sheet'));

      // Close sheet
      await user.click(screen.getByTestId('sheet-close'));

      await waitFor(() => {
        expect(screen.queryByTestId('facility-sheet')).not.toBeInTheDocument();
      });
    });

    it('should not render sheet when no organization selected', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('facility-sheet')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should call delete mutation when delete confirmed', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });
      mockSupabaseFrom.eq.mockResolvedValue({ data: null, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      // Simulate delete action by accessing the component's handler
      // In real scenario, this would be triggered by action menu click
      const { getClinicasColumns } = require('@/components/organisms/clinicas/clinicas-columns');
      const columnsMock = getClinicasColumns as any;
      const onDeleteHandler = columnsMock.mock.calls[0]?.[0]?.onDelete;

      if (onDeleteHandler) {
        await onDeleteHandler('1');

        await waitFor(() => {
          const { toast } = require('sonner');
          expect(toast.success).toHaveBeenCalledWith('Unidade removida com sucesso.');
        });
      }
    });

    it('should handle delete error gracefully', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });
      mockSupabaseFrom.eq.mockResolvedValue({ data: null, error: { message: 'Delete failed' } });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      const { getClinicasColumns } = require('@/components/organisms/clinicas/clinicas-columns');
      const columnsMock = getClinicasColumns as any;
      const onDeleteHandler = columnsMock.mock.calls[0]?.[0]?.onDelete;

      if (onDeleteHandler) {
        await onDeleteHandler('1');

        await waitFor(() => {
          const { toast } = require('sonner');
          expect(toast.error).toHaveBeenCalledWith('Erro ao excluir unidade.');
        });
      }
    });

    it('should not delete when user cancels confirmation', async () => {
      global.window.confirm = vi.fn(() => false);
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      const { getClinicasColumns } = require('@/components/organisms/clinicas/clinicas-columns');
      const columnsMock = getClinicasColumns as any;
      const onDeleteHandler = columnsMock.mock.calls[0]?.[0]?.onDelete;

      if (onDeleteHandler) {
        await onDeleteHandler('1');

        // Delete should not be called
        expect(mockSupabaseFrom.delete).not.toHaveBeenCalled();
      }
    });
  });

  describe('DataTable Configuration', () => {
    it('should configure DataTable with correct search placeholder', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar por nome...');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should pass correct props to DataTable', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      const { DataTable } = require('@/components/data-table/organisms/DataTable');
      const dataTableMock = DataTable as any;

      renderWithProviders(<ClinicsPage />);

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
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const facilityQuery = queries.find((q) =>
          JSON.stringify(q.queryKey).includes('facilities')
        );
        expect(facilityQuery?.queryKey).toEqual(['facilities', 'org-1']);
      });
    });

    it('should not fetch when organizationId is null', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        expect(mockSupabaseFrom.select).not.toHaveBeenCalled();
      });
    });

    it('should not fetch when organization is loading', async () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: { id: 'org-1', name: 'Test Org' },
        loading: true,
      });

      renderWithProviders(<ClinicsPage />);

      // Wait a bit to ensure no fetch happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSupabaseFrom.select).not.toHaveBeenCalled();
    });

    it('should refetch data after successful create/update', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      // Get initial call count
      const initialCallCount = mockSupabaseFrom.select.mock.calls.length;

      // Simulate onSuccess callback
      const { FacilitySheet } = require('@/components/organisms/facilities/FacilitySheet');
      const sheetMock = FacilitySheet as any;
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
    it('should handle null data from Supabase', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: null, error: null });

      renderWithProviders(<ClinicsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });

    it('should handle organization change', async () => {
      mockSupabaseFrom.order.mockResolvedValue({ data: mockFacilities, error: null });

      const { rerender } = renderWithProviders(<ClinicsPage />);

      await waitFor(() => screen.getByTestId('table-content'));

      // Change organization
      mockUseOrganization.mockReturnValue({
        activeOrganization: { id: 'org-2', name: 'Another Org' },
        loading: false,
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <ClinicsPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const facilityQuery = queries.find(
          (q) => JSON.stringify(q.queryKey).includes('facilities') && JSON.stringify(q.queryKey).includes('org-2')
        );
        expect(facilityQuery).toBeDefined();
      });
    });
  });
});
