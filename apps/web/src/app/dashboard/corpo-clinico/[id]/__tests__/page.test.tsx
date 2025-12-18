import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MedicalStaffDetailPage from '../page';
import type { MedicalStaffDetailView } from '@/lib/supabase/medical-staff-queries';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock OrganizationProvider
const mockUseOrganization = vi.fn();
vi.mock('@/providers/OrganizationProvider', () => ({
  useOrganization: () => mockUseOrganization(),
}));

// Mock useMedicalStaffDetail hook
const mockUseMedicalStaffDetail = vi.fn();
vi.mock('@/hooks/useMedicalStaffDetail', () => ({
  useMedicalStaffDetail: (staffId: string, orgId: string | null, options?: any) =>
    mockUseMedicalStaffDetail(staffId, orgId, options),
}));

// Mock child components
vi.mock('@/components/atoms/MedicalStaffHeader', () => ({
  MedicalStaffHeader: ({ name, specialty, status, size }: any) => (
    <div data-testid="medical-staff-header">
      <span data-testid="staff-name">{name}</span>
      <span data-testid="staff-specialty">{specialty}</span>
      <span data-testid="staff-status">{status}</span>
      <span data-testid="header-size">{size}</span>
    </div>
  ),
}));

vi.mock('@/components/molecules/MedicalStaffInfoCard', () => ({
  MedicalStaffInfoCard: ({ sections, loading, title }: any) => (
    <div data-testid="medical-staff-info-card">
      {loading ? (
        <div data-testid="info-card-loading">Loading...</div>
      ) : (
        <>
          <span data-testid="info-card-title">{title}</span>
          <div data-testid="info-sections-count">{sections.length}</div>
        </>
      )}
    </div>
  ),
}));

vi.mock('@/components/molecules/MedicalStaffShiftHistory', () => ({
  MedicalStaffShiftHistory: ({ shifts, loading }: any) => (
    <div data-testid="medical-staff-shift-history">
      {loading ? (
        <div data-testid="shift-history-loading">Loading...</div>
      ) : (
        <div data-testid="shift-count">{shifts.length}</div>
      )}
    </div>
  ),
}));

vi.mock('@/components/organisms/MedicalStaffPerformanceMetrics', () => ({
  MedicalStaffPerformanceMetrics: ({ shifts, loading }: any) => (
    <div data-testid="medical-staff-performance-metrics">
      {loading ? (
        <div data-testid="performance-loading">Loading...</div>
      ) : (
        <div data-testid="performance-shift-count">{shifts.length}</div>
      )}
    </div>
  ),
}));

// Sample medical staff data
const mockStaffData: MedicalStaffDetailView = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Dr. João Silva',
  email: 'joao.silva@example.com',
  phone: '(11) 98765-4321',
  cpf: '123.456.789-00',
  avatar_url: 'https://example.com/avatar.jpg',
  active: true,
  crm: '123456-SP',
  registro_numero: '123456',
  registro_uf: 'SP',
  registro_categoria: 'CRM',
  color: '#3b82f6',
  especialidade: {
    id: 'esp-1',
    nome: 'Cardiologia',
    created_at: '2024-01-01T00:00:00Z',
  },
  profissao: {
    id: 'prof-1',
    nome: 'Médico',
    conselho_id: 'cons-1',
    created_at: '2024-01-01T00:00:00Z',
    conselho: {
      id: 'cons-1',
      nome_completo: 'Conselho Regional de Medicina',
      sigla: 'CRM',
      regex_validacao: '^[0-9]{6}-[A-Z]{2}$',
      created_at: '2024-01-01T00:00:00Z',
    },
  },
  facilities: [
    {
      id: 'fac-1',
      name: 'Hospital Central',
    },
  ],
  recentShifts: [
    {
      id: 'shift-1',
      start_time: '2024-01-15T08:00:00Z',
      end_time: '2024-01-15T18:00:00Z',
      status: 'completed',
      facility: {
        id: 'fac-1',
        name: 'Hospital Central',
      },
    },
    {
      id: 'shift-2',
      start_time: '2024-01-10T08:00:00Z',
      end_time: '2024-01-10T18:00:00Z',
      status: 'completed',
      facility: {
        id: 'fac-1',
        name: 'Hospital Central',
      },
    },
  ],
  organizations: [
    {
      organization_id: 'org-1',
      organization_name: 'MedSync',
    },
  ],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('MedicalStaffDetailPage', () => {
  const defaultParams = { params: { id: '123e4567-e89b-12d3-a456-426614174000' } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrganization.mockReturnValue({
      activeOrganization: { id: 'org-1', name: 'Test Org' },
      loading: false,
    });
    mockUseMedicalStaffDetail.mockReturnValue({
      data: mockStaffData,
      isLoading: false,
      error: null,
    });
  });

  describe('Page Rendering', () => {
    it('should render page container with correct testid', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);
      expect(screen.getByTestId('medical-staff-detail-page')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveTextContent('Voltar');
    });

    it('should render all component sections when data loaded', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.getByTestId('medical-staff-header')).toBeInTheDocument();
      expect(screen.getByTestId('medical-staff-info-card')).toBeInTheDocument();
      expect(screen.getByTestId('medical-staff-shift-history')).toBeInTheDocument();
      expect(screen.getByTestId('medical-staff-performance-metrics')).toBeInTheDocument();
    });
  });

  describe('Back Button Navigation', () => {
    it('should navigate to /dashboard/corpo-clinico when back button clicked', async () => {
      const user = userEvent.setup();
      render(<MedicalStaffDetailPage {...defaultParams} />);

      const backButton = screen.getByTestId('back-button');
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/corpo-clinico');
    });

    it('should disable back button during loading', () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: { id: 'org-1', name: 'Test Org' },
        loading: true,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton when organization is loading', () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: true,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should show loading skeleton when staff data is loading', () => {
      mockUseMedicalStaffDetail.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should pass loading prop to all child components during load', () => {
      mockUseMedicalStaffDetail.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.getByTestId('info-card-loading')).toBeInTheDocument();
      expect(screen.getByTestId('shift-history-loading')).toBeInTheDocument();
      expect(screen.getByTestId('performance-loading')).toBeInTheDocument();
    });

    it('should not show header component during loading', () => {
      mockUseMedicalStaffDetail.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.queryByTestId('medical-staff-header')).not.toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error message when staff data is null', () => {
      mockUseMedicalStaffDetail.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Profissional não encontrado')).toBeInTheDocument();
    });

    it('should show error message when fetch fails', () => {
      mockUseMedicalStaffDetail.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('should show back button in error state', () => {
      mockUseMedicalStaffDetail.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      const backButtons = screen.getAllByTestId('back-button');
      expect(backButtons.length).toBeGreaterThan(0);
    });

    it('should not show component sections in error state', () => {
      mockUseMedicalStaffDetail.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.queryByTestId('medical-staff-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('medical-staff-info-card')).not.toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('should pass correct header props to MedicalStaffHeader', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);

      const header = screen.getByTestId('medical-staff-header');
      expect(within(header).getByTestId('staff-name')).toHaveTextContent('Dr. João Silva');
      expect(within(header).getByTestId('staff-specialty')).toHaveTextContent('Cardiologia');
      expect(within(header).getByTestId('staff-status')).toHaveTextContent('active');
      expect(within(header).getByTestId('header-size')).toHaveTextContent('lg');
    });

    it('should map active=false to offline status', () => {
      const inactiveStaff = { ...mockStaffData, active: false };
      mockUseMedicalStaffDetail.mockReturnValue({
        data: inactiveStaff,
        isLoading: false,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      const header = screen.getByTestId('medical-staff-header');
      expect(within(header).getByTestId('staff-status')).toHaveTextContent('offline');
    });

    it('should create 3 info sections from staff data', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);

      const infoCard = screen.getByTestId('medical-staff-info-card');
      expect(within(infoCard).getByTestId('info-sections-count')).toHaveTextContent('3');
    });

    it('should pass correct title to info card', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);

      const infoCard = screen.getByTestId('medical-staff-info-card');
      expect(within(infoCard).getByTestId('info-card-title')).toHaveTextContent(
        'Informações do Profissional'
      );
    });

    it('should transform recent shifts to shift history format', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);

      const shiftHistory = screen.getByTestId('medical-staff-shift-history');
      expect(within(shiftHistory).getByTestId('shift-count')).toHaveTextContent('2');
    });

    it('should transform recent shifts to performance metrics format', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);

      const performanceMetrics = screen.getByTestId('medical-staff-performance-metrics');
      expect(within(performanceMetrics).getByTestId('performance-shift-count')).toHaveTextContent('2');
    });
  });

  describe('Hook Integration', () => {
    it('should call useMedicalStaffDetail with correct parameters', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(mockUseMedicalStaffDetail).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'org-1',
        { enabled: true }
      );
    });

    it('should disable hook when activeOrganization is null', () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: null,
        loading: false,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(mockUseMedicalStaffDetail).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        { enabled: false }
      );
    });

    it('should disable hook when organization is loading', () => {
      mockUseOrganization.mockReturnValue({
        activeOrganization: { id: 'org-1', name: 'Test Org' },
        loading: true,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(mockUseMedicalStaffDetail).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'org-1',
        { enabled: false }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null specialty gracefully', () => {
      const staffWithoutSpecialty = {
        ...mockStaffData,
        especialidade: null,
      };
      mockUseMedicalStaffDetail.mockReturnValue({
        data: staffWithoutSpecialty,
        isLoading: false,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      const header = screen.getByTestId('medical-staff-header');
      expect(within(header).getByTestId('staff-specialty')).toBeEmptyDOMElement();
    });

    it('should handle empty recent shifts array', () => {
      const staffWithoutShifts = {
        ...mockStaffData,
        recentShifts: [],
      };
      mockUseMedicalStaffDetail.mockReturnValue({
        data: staffWithoutShifts,
        isLoading: false,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      const shiftHistory = screen.getByTestId('medical-staff-shift-history');
      expect(within(shiftHistory).getByTestId('shift-count')).toHaveTextContent('0');
    });

    it('should handle null avatar_url', () => {
      const staffWithoutAvatar = {
        ...mockStaffData,
        avatar_url: null,
      };
      mockUseMedicalStaffDetail.mockReturnValue({
        data: staffWithoutAvatar,
        isLoading: false,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.getByTestId('medical-staff-header')).toBeInTheDocument();
    });

    it('should handle missing optional fields (email, phone, cpf)', () => {
      const staffWithMissingFields = {
        ...mockStaffData,
        email: null,
        phone: null,
        cpf: null,
      };
      mockUseMedicalStaffDetail.mockReturnValue({
        data: staffWithMissingFields,
        isLoading: false,
        error: null,
      });

      render(<MedicalStaffDetailPage {...defaultParams} />);

      expect(screen.getByTestId('medical-staff-info-card')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render grid layout structure', () => {
      render(<MedicalStaffDetailPage {...defaultParams} />);

      const container = screen.getByTestId('medical-staff-detail-page');
      expect(container).toBeInTheDocument();

      // Check that all components are rendered (grid structure handled by CSS)
      expect(screen.getByTestId('medical-staff-info-card')).toBeInTheDocument();
      expect(screen.getByTestId('medical-staff-shift-history')).toBeInTheDocument();
      expect(screen.getByTestId('medical-staff-performance-metrics')).toBeInTheDocument();
    });
  });
});
