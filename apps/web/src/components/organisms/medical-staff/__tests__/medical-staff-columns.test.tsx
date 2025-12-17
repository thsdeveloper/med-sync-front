/**
 * Medical Staff Column Definitions Tests
 *
 * Unit tests for the medical-staff-columns.tsx file covering all column definitions,
 * cell renderers, especialidade integration, custom behaviors, and action handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getMedicalStaffColumns } from '../medical-staff-columns';
import { MedicalStaffWithOrganization } from '@medsync/shared';
import type { DataTableColumn } from '@/components/data-table/types';

// Mock data
const mockStaff: MedicalStaffWithOrganization[] = [
  {
    id: '1',
    name: 'Dr. João Silva',
    email: 'joao@example.com',
    phone: '(11) 98765-4321',
    crm: 'CRM/SP 123456',
    especialidade_id: 'esp-1',
    role: 'Médico',
    color: '#3B82F6',
    active: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    especialidade: {
      id: 'esp-1',
      nome: 'Cardiologia',
      created_at: '2024-01-01T00:00:00Z',
    },
    staff_organization: {
      id: 'so-1',
      staff_id: '1',
      organization_id: 'org-1',
      active: true,
      created_at: '2024-01-15T10:30:00Z',
    },
    organization_count: 1,
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    email: '',
    phone: '',
    crm: '',
    especialidade_id: 'esp-2',
    role: 'Enfermeira',
    color: '#10B981',
    active: false,
    created_at: '2024-02-20T14:00:00Z',
    updated_at: '2024-02-20T14:00:00Z',
    especialidade: {
      id: 'esp-2',
      nome: 'Anestesiologia',
      created_at: '2024-01-01T00:00:00Z',
    },
    staff_organization: {
      id: 'so-2',
      staff_id: '2',
      organization_id: 'org-1',
      active: false,
      created_at: '2024-02-20T14:00:00Z',
    },
    organization_count: 3,
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos@example.com',
    phone: '(21) 91234-5678',
    crm: 'CRM/RJ 789012',
    especialidade_id: null,
    role: 'Técnico de Enfermagem',
    color: '#F59E0B',
    active: true,
    created_at: '2024-03-10T08:00:00Z',
    updated_at: '2024-03-10T08:00:00Z',
    especialidade: null,
    staff_organization: {
      id: 'so-3',
      staff_id: '3',
      organization_id: 'org-1',
      active: true,
      created_at: '2024-03-10T08:00:00Z',
    },
    organization_count: 1,
  },
];

// Helper to render columns
function renderTable(
  data: MedicalStaffWithOrganization[],
  columns: DataTableColumn<MedicalStaffWithOrganization>[]
) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  data.forEach((rowData) => {
    const tr = document.createElement('tr');
    columns.forEach((col) => {
      const td = document.createElement('td');
      if (col.cell) {
        const cellElement = col.cell({
          row: { original: rowData } as any,
          column: { id: col.accessorKey as string || col.id || '' } as any,
          getValue: () => {
            const key = col.accessorKey as string;
            return key ? (rowData as any)[key] : undefined;
          },
        } as any);
        const { container } = render(cellElement as React.ReactElement);
        td.innerHTML = container.innerHTML;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  document.body.appendChild(table);

  return { table, cleanup: () => document.body.removeChild(table) };
}

describe('getMedicalStaffColumns', () => {
  let mockOnEdit: ReturnType<typeof vi.fn>;
  let mockOnUnlink: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnEdit = vi.fn();
    mockOnUnlink = vi.fn();
  });

  describe('Column Definitions Structure', () => {
    it('returns array with 6 columns', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      expect(columns).toHaveLength(6);
    });

    it('has name column with correct accessorKey', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      expect(columns[0].accessorKey).toBe('name');
      expect(columns[0].enableSorting).toBe(true);
    });

    it('has role column with correct accessorKey', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      expect(columns[1].accessorKey).toBe('role');
      expect(columns[1].enableSorting).toBe(true);
    });

    it('has especialidade column with correct id', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      expect(columns[2].id).toBe('especialidade');
      expect(columns[2].accessorKey).toBe('especialidade.nome');
      expect(columns[2].enableSorting).toBe(true);
    });

    it('has contact column with correct id', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      expect(columns[3].id).toBe('contact');
      expect(columns[3].enableSorting).toBe(false);
    });

    it('has status column with correct id', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      expect(columns[4].id).toBe('status');
      expect(columns[4].enableSorting).toBe(true);
    });

    it('has actions column with correct id', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      expect(columns[5].id).toBe('actions');
      expect(columns[5].enableSorting).toBe(false);
      expect(columns[5].enableHiding).toBe(false);
    });
  });

  describe('Name Column Rendering', () => {
    it('renders staff member name', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
      cleanup();
    });

    it('renders avatar with initials', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      // Avatar should contain initials "DJ" for "Dr. João"
      expect(screen.getByText('DJ')).toBeInTheDocument();
      cleanup();
    });

    it('renders role badge with color indicator', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      expect(screen.getByText(/Médico/)).toBeInTheDocument();
      cleanup();
    });

    it('renders CRM when present', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      expect(screen.getByText(/CRM\/SP 123456/)).toBeInTheDocument();
      cleanup();
    });

    it('does not render CRM when not present', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[1]], columns);

      expect(screen.queryByText(/CRM/)).not.toBeInTheDocument();
      cleanup();
    });

    it('shows multi-organization indicator for staff in multiple orgs', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[1]], columns);

      // Staff member 1 is in 3 organizations
      expect(screen.getByText(/Vinculado a 3 organizações/)).toBeInTheDocument();
      cleanup();
    });

    it('does not show multi-organization indicator for staff in single org', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      expect(screen.queryByText(/Vinculado a/)).not.toBeInTheDocument();
      cleanup();
    });
  });

  describe('Role Column Rendering', () => {
    it('renders role text', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      const roleCells = screen.getAllByText('Médico');
      expect(roleCells.length).toBeGreaterThan(0);
      cleanup();
    });

    it('has custom filter function', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const roleColumn = columns[1];
      expect(roleColumn.filterFn).toBeDefined();
    });

    it('filters by role correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const roleColumn = columns[1];
      const filterFn = roleColumn.filterFn!;

      const mockRow = { original: mockStaff[0] } as any;
      const result = filterFn(mockRow, 'role', ['médico']);

      expect(result).toBe(true);
    });
  });

  describe('Especialidade Column Rendering', () => {
    it('renders especialidade name when present', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
      cleanup();
    });

    it('renders dash when especialidade is null', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const cellContent = columns[2].cell!({
        row: { original: mockStaff[2] } as any,
        column: { id: 'especialidade' } as any,
        getValue: () => null,
      } as any);

      const { container } = render(cellContent as React.ReactElement);
      expect(container.textContent).toBe('-');
    });

    it('has custom sorting function', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const especialidadeColumn = columns[2];
      expect(especialidadeColumn.sortingFn).toBeDefined();
    });

    it('sorts by especialidade name correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const especialidadeColumn = columns[2];
      const sortingFn = especialidadeColumn.sortingFn!;

      const rowA = { original: mockStaff[0] } as any;
      const rowB = { original: mockStaff[1] } as any;

      // Anestesiologia comes before Cardiologia
      const result = sortingFn(rowA, rowB, 'especialidade');
      expect(result).toBeGreaterThan(0);
    });

    it('has custom filter function', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const especialidadeColumn = columns[2];
      expect(especialidadeColumn.filterFn).toBeDefined();
    });

    it('filters by especialidade correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const especialidadeColumn = columns[2];
      const filterFn = especialidadeColumn.filterFn!;

      const mockRow = { original: mockStaff[0] } as any;
      const result = filterFn(mockRow, 'especialidade', ['cardiologia']);

      expect(result).toBe(true);
    });
  });

  describe('Contact Column Rendering', () => {
    it('renders email when present', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      expect(screen.getByText('joao@example.com')).toBeInTheDocument();
      cleanup();
    });

    it('renders phone when present', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
      cleanup();
    });

    it('renders dash when both email and phone are empty', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const cellContent = columns[3].cell!({
        row: { original: mockStaff[1] } as any,
        column: { id: 'contact' } as any,
        getValue: () => '',
      } as any);

      const { container } = render(cellContent as React.ReactElement);
      expect(container.textContent).toBe('-');
    });
  });

  describe('Status Column Rendering', () => {
    it('renders "Ativo" badge for active staff', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      expect(screen.getByText('Ativo')).toBeInTheDocument();
      expect(screen.getByText('Ativo')).toHaveClass('bg-green-100');
      cleanup();
    });

    it('renders "Inativo" badge for inactive staff', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[1]], columns);

      expect(screen.getByText('Inativo')).toBeInTheDocument();
      expect(screen.getByText('Inativo')).toHaveClass('bg-gray-100');
      cleanup();
    });

    it('has custom filter function', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const statusColumn = columns[4];
      expect(statusColumn.filterFn).toBeDefined();
    });

    it('filters active staff correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });

      const statusColumn = columns[4];
      const filterFn = statusColumn.filterFn!;

      const mockRow = { original: mockStaff[0] } as any;
      const result = filterFn(mockRow, 'status', ['active']);

      expect(result).toBe(true);
    });

    it('uses staff_organization active status when present', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[1]], columns);

      // mockStaff[1] has staff_organization.active = false
      expect(screen.getByText('Inativo')).toBeInTheDocument();
      cleanup();
    });
  });

  describe('Actions Column', () => {
    it('renders dropdown menu trigger button', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      const buttons = screen.getAllByRole('button');
      const menuButton = buttons.find((btn) => btn.getAttribute('aria-haspopup') === 'menu');
      expect(menuButton).toBeInTheDocument();
      cleanup();
    });

    it('calls onEdit when edit menu item is clicked', async () => {
      const user = userEvent.setup();
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      const buttons = screen.getAllByRole('button');
      const menuButton = buttons.find((btn) => btn.getAttribute('aria-haspopup') === 'menu');
      if (menuButton) {
        await user.click(menuButton);
      }

      const editOption = await screen.findByText('Editar');
      await user.click(editOption);

      expect(mockOnEdit).toHaveBeenCalledWith(mockStaff[0]);
      cleanup();
    });

    it('calls onUnlink when unlink menu item is clicked', async () => {
      const user = userEvent.setup();
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      const buttons = screen.getAllByRole('button');
      const menuButton = buttons.find((btn) => btn.getAttribute('aria-haspopup') === 'menu');
      if (menuButton) {
        await user.click(menuButton);
      }

      const unlinkOption = await screen.findByText('Remover');
      await user.click(unlinkOption);

      expect(mockOnUnlink).toHaveBeenCalledWith(
        mockStaff[0].id,
        mockStaff[0].staff_organization!.id,
        mockStaff[0].organization_count
      );
      cleanup();
    });

    it('shows "Desvincular" for staff in multiple organizations', async () => {
      const user = userEvent.setup();
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[1]], columns);

      const buttons = screen.getAllByRole('button');
      const menuButton = buttons.find((btn) => btn.getAttribute('aria-haspopup') === 'menu');
      if (menuButton) {
        await user.click(menuButton);
      }

      expect(await screen.findByText('Desvincular')).toBeInTheDocument();
      cleanup();
    });

    it('shows "Remover" for staff in single organization', async () => {
      const user = userEvent.setup();
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[0]], columns);

      const buttons = screen.getAllByRole('button');
      const menuButton = buttons.find((btn) => btn.getAttribute('aria-haspopup') === 'menu');
      if (menuButton) {
        await user.click(menuButton);
      }

      expect(await screen.findByText('Remover')).toBeInTheDocument();
      cleanup();
    });
  });

  describe('Edge Cases', () => {
    it('handles staff with no especialidade', () => {
      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([mockStaff[2]], columns);

      expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
      cleanup();
    });

    it('handles staff with long names', () => {
      const longNameStaff: MedicalStaffWithOrganization = {
        ...mockStaff[0],
        name: 'Dr. João Pedro da Silva Santos de Oliveira Júnior',
      };

      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([longNameStaff], columns);

      expect(screen.getByText(/Dr. João Pedro/)).toBeInTheDocument();
      cleanup();
    });

    it('handles staff with special characters in name', () => {
      const specialNameStaff: MedicalStaffWithOrganization = {
        ...mockStaff[0],
        name: 'Dra. María José Muñoz',
      };

      const columns = getMedicalStaffColumns({
        onEdit: mockOnEdit,
        onUnlink: mockOnUnlink,
      });
      const { cleanup } = renderTable([specialNameStaff], columns);

      expect(screen.getByText('Dra. María José Muñoz')).toBeInTheDocument();
      cleanup();
    });
  });
});
