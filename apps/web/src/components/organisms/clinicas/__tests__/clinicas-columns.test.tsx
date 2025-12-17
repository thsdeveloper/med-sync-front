/**
 * Unit tests for Clínicas table column definitions
 *
 * Tests column structure, rendering, sorting, filtering, and action callbacks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getClinicasColumns } from '../clinicas-columns';
import type { Facility } from '@medsync/shared';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Building2: () => <div data-testid="building-icon">BuildingIcon</div>,
  Hospital: () => <div data-testid="hospital-icon">HospitalIcon</div>,
  Phone: () => <div data-testid="phone-icon">PhoneIcon</div>,
  MoreHorizontal: () => <div data-testid="more-icon">MoreIcon</div>,
  Edit: () => <div data-testid="edit-icon">EditIcon</div>,
  Trash2: () => <div data-testid="trash-icon">TrashIcon</div>,
  ArrowUpDown: () => <div data-testid="sort-icon">SortIcon</div>,
  ChevronDown: () => <div data-testid="chevron-down">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up">ChevronUp</div>,
  ChevronsUpDown: () => <div data-testid="chevrons-updown">ChevronsUpDown</div>,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => '3 dias atrás'),
}));

vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

describe('Clínicas Column Definitions', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockFacility: Facility = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    organization_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Clínica Teste',
    type: 'clinic',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    active: true,
    created_at: '2025-12-15T20:00:00Z',
    updated_at: '2025-12-15T20:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Column Structure', () => {
    it('should create correct number of columns', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });

      // Should have: name, phone, status, created_at, actions
      expect(columns).toHaveLength(5);
    });

    it('should have correct column accessorKeys', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });

      expect(columns[0].accessorKey).toBe('name');
      expect(columns[1].accessorKey).toBe('phone');
      expect(columns[2].accessorKey).toBe('active');
      expect(columns[3].accessorKey).toBe('created_at');
      expect(columns[4].id).toBe('actions');
    });

    it('should have correct column headers', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });

      expect(columns[0].header).toBeDefined();
      expect(columns[1].header).toBe('Contato');
      expect(columns[2].header).toBeDefined();
      expect(columns[3].header).toBeDefined();
      expect(columns[4].header).toBeDefined();
    });

    it('should configure sortable columns correctly', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });

      // Name column should be sortable
      expect(columns[0].enableSorting).toBe(true);

      // Phone column should not be sortable
      expect(columns[1].enableSorting).toBe(false);

      // Status column should be sortable
      expect(columns[2].enableSorting).toBe(true);

      // Created_at column should be sortable
      expect(columns[3].enableSorting).toBe(true);

      // Actions column should not be sortable
      expect(columns[4].enableSorting).toBe(false);
    });
  });

  describe('Name Column Rendering', () => {
    it('should render facility name', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const nameColumn = columns[0];

      const { container } = render(
        <div>
          {nameColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    });

    it('should render clinic icon for clinic type', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const nameColumn = columns[0];

      render(
        <div>
          {nameColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      expect(screen.getByTestId('building-icon')).toBeInTheDocument();
    });

    it('should render hospital icon for hospital type', () => {
      const hospital = { ...mockFacility, type: 'hospital' as const };
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const nameColumn = columns[0];

      render(
        <div>
          {nameColumn.cell!({ row: { original: hospital } } as any)}
        </div>
      );

      expect(screen.getByTestId('hospital-icon')).toBeInTheDocument();
    });

    it('should render CNPJ when available', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const nameColumn = columns[0];

      render(
        <div>
          {nameColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      expect(screen.getByText(/12\.345\.678\/0001-90/)).toBeInTheDocument();
    });

    it('should handle missing CNPJ gracefully', () => {
      const facilityWithoutCNPJ = { ...mockFacility, cnpj: null };
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const nameColumn = columns[0];

      const { container } = render(
        <div>
          {nameColumn.cell!({ row: { original: facilityWithoutCNPJ } } as any)}
        </div>
      );

      // Should still render the name
      expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
      // CNPJ should not be present
      expect(container.textContent).not.toContain('12.345.678');
    });
  });

  describe('Phone Column Rendering', () => {
    it('should render phone number when available', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const phoneColumn = columns[1];

      render(
        <div>
          {phoneColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    });

    it('should render dash when phone is null', () => {
      const facilityWithoutPhone = { ...mockFacility, phone: null };
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const phoneColumn = columns[1];

      render(
        <div>
          {phoneColumn.cell!({ row: { original: facilityWithoutPhone } } as any)}
        </div>
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash when phone is empty string', () => {
      const facilityWithEmptyPhone = { ...mockFacility, phone: '' };
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const phoneColumn = columns[1];

      render(
        <div>
          {phoneColumn.cell!({ row: { original: facilityWithEmptyPhone } } as any)}
        </div>
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Status Column Rendering', () => {
    it('should render active status badge', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const statusColumn = columns[2];

      render(
        <div>
          {statusColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      expect(screen.getByText('Ativa')).toBeInTheDocument();
    });

    it('should render inactive status badge', () => {
      const inactiveFacility = { ...mockFacility, active: false };
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const statusColumn = columns[2];

      render(
        <div>
          {statusColumn.cell!({ row: { original: inactiveFacility } } as any)}
        </div>
      );

      expect(screen.getByText('Inativa')).toBeInTheDocument();
    });

    it('should configure status column with filter function', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const statusColumn = columns[2];

      expect(statusColumn.filterFn).toBeDefined();
      expect(typeof statusColumn.filterFn).toBe('function');
    });

    it('should filter active facilities correctly', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const statusColumn = columns[2];
      const filterFn = statusColumn.filterFn as Function;

      const result = filterFn({ original: mockFacility } as any, 'active', 'active');
      expect(result).toBe(true);
    });

    it('should filter inactive facilities correctly', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const statusColumn = columns[2];
      const filterFn = statusColumn.filterFn as Function;

      const inactiveFacility = { ...mockFacility, active: false };
      const result = filterFn({ original: inactiveFacility } as any, 'active', 'inactive');
      expect(result).toBe(true);
    });
  });

  describe('Created At Column Rendering', () => {
    it('should render relative date', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const createdAtColumn = columns[3];

      render(
        <div>
          {createdAtColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      expect(screen.getByText('3 dias atrás')).toBeInTheDocument();
    });

    it('should render absolute date', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const createdAtColumn = columns[3];

      render(
        <div>
          {createdAtColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      // Check for Brazilian date format (15/12/2025)
      expect(screen.getByText(/15\/12\/2025/)).toBeInTheDocument();
    });
  });

  describe('Actions Column', () => {
    it('should render actions dropdown trigger', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const actionsColumn = columns[4];

      render(
        <div>
          {actionsColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      expect(screen.getByTestId('more-icon')).toBeInTheDocument();
    });

    it('should call onEdit when edit action clicked', async () => {
      const user = userEvent.setup();
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const actionsColumn = columns[4];

      render(
        <div>
          {actionsColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      // Find and click the edit button (first menu item)
      const editButton = screen.getByText('Editar');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockFacility);
    });

    it('should call onDelete when delete action clicked', async () => {
      const user = userEvent.setup();
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const actionsColumn = columns[4];

      render(
        <div>
          {actionsColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      // Find and click the delete button (second menu item)
      const deleteButton = screen.getByText('Excluir');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(mockFacility.id);
    });

    it('should render edit and delete icons', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const actionsColumn = columns[4];

      render(
        <div>
          {actionsColumn.cell!({ row: { original: mockFacility } } as any)}
        </div>
      );

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('should not allow hiding actions column', () => {
      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const actionsColumn = columns[4];

      expect(actionsColumn.enableHiding).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle facility with all null optional fields', () => {
      const minimalFacility: Facility = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        organization_id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Clínica Mínima',
        type: 'clinic',
        cnpj: null,
        phone: null,
        active: true,
        created_at: '2025-12-15T20:00:00Z',
        updated_at: '2025-12-15T20:00:00Z',
      };

      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });

      // Should not throw error
      expect(() => {
        render(
          <div>
            {columns[0].cell!({ row: { original: minimalFacility } } as any)}
            {columns[1].cell!({ row: { original: minimalFacility } } as any)}
            {columns[2].cell!({ row: { original: minimalFacility } } as any)}
            {columns[3].cell!({ row: { original: minimalFacility } } as any)}
            {columns[4].cell!({ row: { original: minimalFacility } } as any)}
          </div>
        );
      }).not.toThrow();
    });

    it('should handle very long facility name', () => {
      const longNameFacility = {
        ...mockFacility,
        name: 'Clínica de Especialidades Médicas e Cirúrgicas Avançadas do Brasil Ltda',
      };

      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const nameColumn = columns[0];

      render(
        <div>
          {nameColumn.cell!({ row: { original: longNameFacility } } as any)}
        </div>
      );

      expect(
        screen.getByText('Clínica de Especialidades Médicas e Cirúrgicas Avançadas do Brasil Ltda')
      ).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      const specialCharsFacility = {
        ...mockFacility,
        name: 'Clínica São José - Unidade Centro & Cia.',
      };

      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const nameColumn = columns[0];

      render(
        <div>
          {nameColumn.cell!({ row: { original: specialCharsFacility } } as any)}
        </div>
      );

      expect(screen.getByText('Clínica São José - Unidade Centro & Cia.')).toBeInTheDocument();
    });

    it('should handle invalid date gracefully', () => {
      const invalidDateFacility = {
        ...mockFacility,
        created_at: 'invalid-date',
      };

      const columns = getClinicasColumns({ onEdit: mockOnEdit, onDelete: mockOnDelete });
      const createdAtColumn = columns[3];

      // Should not throw error even with invalid date
      expect(() => {
        render(
          <div>
            {createdAtColumn.cell!({ row: { original: invalidDateFacility } } as any)}
          </div>
        );
      }).not.toThrow();
    });
  });
});
