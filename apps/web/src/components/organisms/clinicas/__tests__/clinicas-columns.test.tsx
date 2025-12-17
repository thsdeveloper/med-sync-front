/**
 * Clinicas Column Definitions Tests
 *
 * Unit tests for the clinicas-columns.tsx file covering all column definitions,
 * cell renderers, custom behaviors, and action handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getClinicasColumns } from '../clinicas-columns';
import { Facility } from '@medsync/shared';

// Mock date-fns to return consistent dates for testing
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'há 3 dias'),
}));

// Mock facility data
const mockFacilities: Facility[] = [
  {
    id: '1',
    name: 'Clínica São Paulo',
    type: 'clinic',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    active: true,
    organization_id: 'org-1',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Hospital das Clínicas',
    type: 'hospital',
    cnpj: '98.765.432/0001-10',
    phone: '',
    active: false,
    organization_id: 'org-1',
    created_at: '2024-02-20T14:00:00Z',
    updated_at: '2024-02-20T14:00:00Z',
  },
  {
    id: '3',
    name: 'Centro Médico ABC',
    type: 'clinic',
    cnpj: '',
    phone: '(21) 91234-5678',
    active: true,
    organization_id: 'org-1',
    created_at: '2024-03-10T08:00:00Z',
    updated_at: '2024-03-10T08:00:00Z',
  },
];

describe('getClinicasColumns', () => {
  let mockOnEdit: ReturnType<typeof vi.fn>;
  let mockOnDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnEdit = vi.fn();
    mockOnDelete = vi.fn();
  });

  describe('Column Definitions Structure', () => {
    it('returns array with 5 columns', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      expect(columns).toHaveLength(5);
    });

    it('has name column with correct accessorKey', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      expect(columns[0].accessorKey).toBe('name');
      expect(columns[0].enableSorting).toBe(true);
    });

    it('has phone column with correct accessorKey', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      expect(columns[1].accessorKey).toBe('phone');
      expect(columns[1].enableSorting).toBe(false);
    });

    it('has active status column with correct accessorKey', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      expect(columns[2].accessorKey).toBe('active');
      expect(columns[2].enableSorting).toBe(true);
    });

    it('has created_at column with correct accessorKey', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      expect(columns[3].accessorKey).toBe('created_at');
      expect(columns[3].enableSorting).toBe(true);
    });

    it('has actions column with correct id', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      expect(columns[4].id).toBe('actions');
      expect(columns[4].enableSorting).toBe(false);
      expect(columns[4].enableHiding).toBe(false);
    });
  });

  describe('Name Column Rendering', () => {
    it('renders facility name', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[0].cell!({
        row: { original: mockFacilities[0] } as any,
        column: { id: 'name' } as any,
        getValue: () => mockFacilities[0].name,
      } as any);

      const { container } = render(cellElement as React.ReactElement);
      expect(container.textContent).toContain('Clínica São Paulo');
    });

    it('renders CNPJ when present', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[0].cell!({
        row: { original: mockFacilities[0] } as any,
        column: { id: 'name' } as any,
        getValue: () => mockFacilities[0].name,
      } as any);

      const { container } = render(cellElement as React.ReactElement);
      expect(container.textContent).toContain('12.345.678/0001-90');
    });

    it('does not render CNPJ when empty', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[0].cell!({
        row: { original: mockFacilities[2] } as any,
        column: { id: 'name' } as any,
        getValue: () => mockFacilities[2].name,
      } as any);

      const { container } = render(cellElement as React.ReactElement);
      expect(container.textContent).not.toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    });

    it('shows clinic badge for clinic type', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[0].cell!({
        row: { original: mockFacilities[0] } as any,
        column: { id: 'name' } as any,
        getValue: () => mockFacilities[0].name,
      } as any);

      render(cellElement as React.ReactElement);
      expect(screen.getByText('Clínica')).toBeInTheDocument();
    });

    it('shows hospital badge for hospital type', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[0].cell!({
        row: { original: mockFacilities[1] } as any,
        column: { id: 'name' } as any,
        getValue: () => mockFacilities[1].name,
      } as any);

      render(cellElement as React.ReactElement);
      expect(screen.getByText('Hospital')).toBeInTheDocument();
    });
  });

  describe('Phone Column Rendering', () => {
    it('renders phone number when present', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[1].cell!({
        row: { original: mockFacilities[0] } as any,
        column: { id: 'phone' } as any,
        getValue: () => mockFacilities[0].phone,
      } as any);

      const { container } = render(cellElement as React.ReactElement);
      expect(container.textContent).toBe('(11) 98765-4321');
    });

    it('renders dash when phone is empty', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[1].cell!({
        row: { original: mockFacilities[1] } as any,
        column: { id: 'phone' } as any,
        getValue: () => '',
      } as any);

      const { container } = render(cellElement as React.ReactElement);
      expect(container.textContent).toBe('-');
    });
  });

  describe('Status Column Rendering', () => {
    it('renders "Ativa" badge for active facilities', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[2].cell!({
        row: { original: mockFacilities[0] } as any,
        column: { id: 'active' } as any,
        getValue: () => mockFacilities[0].active,
      } as any);

      render(cellElement as React.ReactElement);
      expect(screen.getByText('Ativa')).toBeInTheDocument();
      expect(screen.getByText('Ativa')).toHaveClass('bg-green-100');
    });

    it('renders "Inativa" badge for inactive facilities', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[2].cell!({
        row: { original: mockFacilities[1] } as any,
        column: { id: 'active' } as any,
        getValue: () => mockFacilities[1].active,
      } as any);

      render(cellElement as React.ReactElement);
      expect(screen.getByText('Inativa')).toBeInTheDocument();
      expect(screen.getByText('Inativa')).toHaveClass('bg-gray-100');
    });

    it('has custom filter function', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const statusColumn = columns[2];
      expect(statusColumn.filterFn).toBeDefined();
    });

    it('filters active facilities correctly', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const statusColumn = columns[2];
      const filterFn = statusColumn.filterFn!;

      const mockRow = { original: mockFacilities[0] } as any;
      const result = filterFn(mockRow, 'active', 'active');

      expect(result).toBe(true);
    });

    it('filters inactive facilities correctly', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const statusColumn = columns[2];
      const filterFn = statusColumn.filterFn!;

      const mockRow = { original: mockFacilities[1] } as any;
      const result = filterFn(mockRow, 'active', 'inactive');

      expect(result).toBe(true);
    });

    it('returns true when no filter value', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const statusColumn = columns[2];
      const filterFn = statusColumn.filterFn!;

      const mockRow = { original: mockFacilities[0] } as any;
      const result = filterFn(mockRow, 'active', '');

      expect(result).toBe(true);
    });
  });

  describe('Created Date Column Rendering', () => {
    it('renders relative date', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[3].cell!({
        row: { original: mockFacilities[0] } as any,
        column: { id: 'created_at' } as any,
        getValue: () => mockFacilities[0].created_at,
      } as any);

      render(cellElement as React.ReactElement);
      expect(screen.getByText('há 3 dias')).toBeInTheDocument();
    });

    it('renders absolute date in pt-BR format', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[3].cell!({
        row: { original: mockFacilities[0] } as any,
        column: { id: 'created_at' } as any,
        getValue: () => mockFacilities[0].created_at,
      } as any);

      render(cellElement as React.ReactElement);
      // Date should be formatted as DD/MM/YYYY in pt-BR
      const dateText = screen.getByText(/15\/01\/2024/);
      expect(dateText).toBeInTheDocument();
    });
  });

  describe('Actions Column', () => {
    it('renders dropdown menu trigger button', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[4].cell!({
        row: { original: mockFacilities[0] } as any,
        column: { id: 'actions' } as any,
        getValue: () => undefined,
      } as any);

      render(cellElement as React.ReactElement);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('has correct action column configuration', () => {
      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const actionsColumn = columns[4];
      expect(actionsColumn.id).toBe('actions');
      expect(actionsColumn.enableSorting).toBe(false);
      expect(actionsColumn.enableHiding).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles facility with all empty optional fields', () => {
      const emptyFacility: Facility = {
        id: '4',
        name: 'Clínica Mínima',
        type: 'clinic',
        cnpj: '',
        phone: '',
        active: true,
        organization_id: 'org-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      // Should not throw error
      expect(() => {
        columns[0].cell!({
          row: { original: emptyFacility } as any,
          column: { id: 'name' } as any,
          getValue: () => emptyFacility.name,
        } as any);
      }).not.toThrow();
    });

    it('handles facility with special characters in name', () => {
      const specialFacility: Facility = {
        ...mockFacilities[0],
        name: 'Clínica São José & Filhos Ltda.',
      };

      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[0].cell!({
        row: { original: specialFacility } as any,
        column: { id: 'name' } as any,
        getValue: () => specialFacility.name,
      } as any);

      render(cellElement as React.ReactElement);
      expect(screen.getByText('Clínica São José & Filhos Ltda.')).toBeInTheDocument();
    });

    it('handles very long facility names', () => {
      const longNameFacility: Facility = {
        ...mockFacilities[0],
        name: 'Clínica de Especialidades Médicas e Cirúrgicas São Paulo Centro de Excelência em Saúde',
      };

      const columns = getClinicasColumns({
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
      });

      const cellElement = columns[0].cell!({
        row: { original: longNameFacility } as any,
        column: { id: 'name' } as any,
        getValue: () => longNameFacility.name,
      } as any);

      render(cellElement as React.ReactElement);
      expect(screen.getByText(/Clínica de Especialidades Médicas/)).toBeInTheDocument();
    });
  });
});
