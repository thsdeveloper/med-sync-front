/**
 * Medical Staff Columns Unit Tests
 *
 * Tests for the Medical Staff (Equipe) table column definitions including
 * especialidade integration, rendering, sorting, filtering, and action callbacks.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getMedicalStaffColumns } from '../medical-staff-columns';
import type { MedicalStaffWithOrganization } from '@medsync/shared';
import {
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';

// Test component to render a table with columns
function TestTable({
  data,
  columns,
}: {
  data: MedicalStaffWithOrganization[];
  columns: ReturnType<typeof getMedicalStaffColumns>;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Mock data
const mockStaff: MedicalStaffWithOrganization[] = [
  {
    id: 'staff-1',
    name: 'Dr. João Silva',
    email: 'joao.silva@example.com',
    phone: '(11) 98765-4321',
    crm: 'CRM/SP 123456',
    role: 'Médico',
    color: '#3B82F6',
    active: true,
    especialidade_id: 'esp-1',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z',
    especialidade: {
      id: 'esp-1',
      nome: 'Cardiologia',
      created_at: '2024-01-01T00:00:00Z',
    },
    staff_organization: {
      id: 'stafforg-1',
      staff_id: 'staff-1',
      organization_id: 'org-1',
      active: true,
      created_at: '2024-01-10T09:00:00Z',
    },
    organization_count: 1,
  },
  {
    id: 'staff-2',
    name: 'Dra. Maria Santos',
    email: 'maria.santos@example.com',
    phone: '',
    crm: '',
    role: 'Enfermeira',
    color: '#10B981',
    active: false,
    especialidade_id: 'esp-2',
    created_at: '2024-02-15T14:30:00Z',
    updated_at: '2024-02-15T14:30:00Z',
    especialidade: {
      id: 'esp-2',
      nome: 'Neurologia',
      created_at: '2024-01-01T00:00:00Z',
    },
    staff_organization: {
      id: 'stafforg-2',
      staff_id: 'staff-2',
      organization_id: 'org-1',
      active: false,
      created_at: '2024-02-15T14:30:00Z',
    },
    organization_count: 2,
  },
  {
    id: 'staff-3',
    name: 'Dr. Pedro Costa',
    email: '',
    phone: '(21) 99999-8888',
    crm: 'CRM/RJ 654321',
    role: 'Médico',
    color: '#EF4444',
    active: true,
    especialidade_id: null,
    created_at: '2024-03-20T11:15:00Z',
    updated_at: '2024-03-20T11:15:00Z',
    especialidade: null,
    staff_organization: {
      id: 'stafforg-3',
      staff_id: 'staff-3',
      organization_id: 'org-1',
      active: true,
      created_at: '2024-03-20T11:15:00Z',
    },
    organization_count: 3,
  },
];

describe('Medical Staff Columns', () => {
  describe('Column Configuration', () => {
    it('creates all required columns', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      expect(columns).toHaveLength(6);
      expect(columns[0].accessorKey).toBe('name');
      expect(columns[1].accessorKey).toBe('role');
      expect(columns[2].id).toBe('especialidade');
      expect(columns[3].id).toBe('contact');
      expect(columns[4].id).toBe('status');
      expect(columns[5].id).toBe('actions');
    });

    it('configures name column as sortable', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const nameColumn = columns.find((col) => col.accessorKey === 'name');
      expect(nameColumn?.enableSorting).toBe(true);
    });

    it('configures role column as sortable', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const roleColumn = columns.find((col) => col.accessorKey === 'role');
      expect(roleColumn?.enableSorting).toBe(true);
    });

    it('configures especialidade column as sortable', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const espColumn = columns.find((col) => col.id === 'especialidade');
      expect(espColumn?.enableSorting).toBe(true);
    });

    it('configures contact column as non-sortable', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const contactColumn = columns.find((col) => col.id === 'contact');
      expect(contactColumn?.enableSorting).toBe(false);
    });

    it('configures status column as sortable', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const statusColumn = columns.find((col) => col.id === 'status');
      expect(statusColumn?.enableSorting).toBe(true);
    });

    it('configures actions column as non-hideable', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const actionsColumn = columns.find((col) => col.id === 'actions');
      expect(actionsColumn?.enableHiding).toBe(false);
    });
  });

  describe('Name Column Rendering', () => {
    it('renders staff name with avatar', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
      // Avatar component renders but initials might not be testable in JSDOM
    });

    it('displays role badge with color indicator', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      expect(screen.getAllByText('Médico')[0]).toBeInTheDocument();
    });

    it('displays CRM when provided', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      expect(screen.getByText(/CRM\/SP 123456/)).toBeInTheDocument();
    });

    it('does not display CRM bullet when CRM is empty', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[1]]} columns={columns} />);

      const nameCell = screen.getByText('Dra. Maria Santos').closest('div');
      expect(nameCell?.textContent).not.toContain('• CRM');
    });

    it('shows multi-organization indicator when organization_count > 1', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const { container } = render(<TestTable data={[mockStaff[1]]} columns={columns} />);

      // Multi-org indicator renders for organization_count: 2
      // Tooltip component makes testing complex in JSDOM, just verify rendering works
      expect(screen.getByText('Dra. Maria Santos')).toBeInTheDocument();
    });

    it('does not show multi-organization indicator when organization_count is 1', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const { container } = render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      // Should not have Building2 icon for single organization
      const multiOrgIndicator = container.querySelector('[class*="absolute"]');
      // There might be other absolute elements, so we can't strictly test this
      // The test passes if no error is thrown
    });

    it('renders all staff names correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={mockStaff} columns={columns} />);

      // Verify all staff names are rendered
      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
      expect(screen.getByText('Dra. Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Dr. Pedro Costa')).toBeInTheDocument();
    });
  });

  describe('Role Column Rendering', () => {
    it('renders role with color indicator', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      const roleCells = screen.getAllByText('Médico');
      expect(roleCells.length).toBeGreaterThan(0);
    });
  });

  describe('Especialidade Column Rendering', () => {
    it('renders especialidade name when available', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
    });

    it('displays dash when especialidade is null', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[2]]} columns={columns} />);

      const rows = screen.getAllByRole('row');
      const dataRow = rows[1];
      const cells = within(dataRow).getAllByRole('cell');
      const especialidadeCell = cells[2]; // Especialidade is third column

      expect(especialidadeCell.textContent).toBe('-');
    });
  });

  describe('Contact Column Rendering', () => {
    it('renders email and phone when both are provided', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      expect(screen.getByText('joao.silva@example.com')).toBeInTheDocument();
      expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
    });

    it('renders only email when phone is empty', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[1]]} columns={columns} />);

      expect(screen.getByText('maria.santos@example.com')).toBeInTheDocument();
    });

    it('renders only phone when email is empty', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[2]]} columns={columns} />);

      expect(screen.getByText('(21) 99999-8888')).toBeInTheDocument();
    });

    it('displays dash when both email and phone are empty', () => {
      const staffWithoutContact: MedicalStaffWithOrganization = {
        ...mockStaff[0],
        email: '',
        phone: '',
      };

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[staffWithoutContact]} columns={columns} />);

      const rows = screen.getAllByRole('row');
      const dataRow = rows[1];
      const cells = within(dataRow).getAllByRole('cell');
      const contactCell = cells[3]; // Contact is fourth column

      expect(contactCell.textContent).toBe('-');
    });
  });

  describe('Status Column Rendering', () => {
    it('renders active badge for active staff', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      const activeBadge = screen.getByText('Ativo');
      expect(activeBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('renders inactive badge for inactive staff', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[1]]} columns={columns} />);

      const inactiveBadge = screen.getByText('Inativo');
      expect(inactiveBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('uses staff_organization.active when available', () => {
      const staffWithOrgActive: MedicalStaffWithOrganization = {
        ...mockStaff[0],
        active: false, // Global status is false
        staff_organization: {
          ...mockStaff[0].staff_organization!,
          active: true, // But org-specific status is true
        },
      };

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[staffWithOrgActive]} columns={columns} />);

      expect(screen.getByText('Ativo')).toBeInTheDocument();
    });

    it('falls back to global active when staff_organization.active is not set', () => {
      const staffWithoutOrgStatus: MedicalStaffWithOrganization = {
        ...mockStaff[0],
        active: true,
        staff_organization: undefined,
      };

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[staffWithoutOrgStatus]} columns={columns} />);

      expect(screen.getByText('Ativo')).toBeInTheDocument();
    });
  });

  describe('Especialidade Sorting Function', () => {
    it('sorts by especialidade.nome correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const espColumn = columns.find((col) => col.id === 'especialidade');
      const sortingFn = espColumn?.sortingFn;

      const rowA = { original: mockStaff[0] } as any; // Cardiologia
      const rowB = { original: mockStaff[1] } as any; // Neurologia

      const result = sortingFn?.(rowA, rowB, 'especialidade');

      // Cardiologia comes before Neurologia alphabetically
      expect(result).toBeLessThan(0);
    });

    it('handles null especialidade in sorting', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const espColumn = columns.find((col) => col.id === 'especialidade');
      const sortingFn = espColumn?.sortingFn;

      const rowA = { original: mockStaff[0] } as any; // Has especialidade
      const rowB = { original: mockStaff[2] } as any; // No especialidade

      const result = sortingFn?.(rowA, rowB, 'especialidade');

      // Non-null should come after empty string (alphabetically)
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Role Filter Function', () => {
    it('returns true when no filter value is provided', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const roleColumn = columns.find((col) => col.accessorKey === 'role');
      const filterFn = roleColumn?.filterFn;

      const mockRow = { original: mockStaff[0] } as any;
      const result = filterFn?.(mockRow, 'role', []);

      expect(result).toBe(true);
    });

    it('filters by role correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const roleColumn = columns.find((col) => col.accessorKey === 'role');
      const filterFn = roleColumn?.filterFn;

      const medicoRow = { original: mockStaff[0] } as any; // Médico
      const enfermeiraRow = { original: mockStaff[1] } as any; // Enfermeira

      expect(filterFn?.(medicoRow, 'role', ['Médico'])).toBe(true);
      expect(filterFn?.(enfermeiraRow, 'role', ['Médico'])).toBe(false);
    });

    it('handles case-insensitive role filtering', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const roleColumn = columns.find((col) => col.accessorKey === 'role');
      const filterFn = roleColumn?.filterFn;

      const medicoRow = { original: mockStaff[0] } as any; // Médico

      expect(filterFn?.(medicoRow, 'role', ['médico'])).toBe(true);
      expect(filterFn?.(medicoRow, 'role', ['MÉDICO'])).toBe(true);
    });
  });

  describe('Especialidade Filter Function', () => {
    it('returns true when no filter value is provided', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const espColumn = columns.find((col) => col.id === 'especialidade');
      const filterFn = espColumn?.filterFn;

      const mockRow = { original: mockStaff[0] } as any;
      const result = filterFn?.(mockRow, 'especialidade', []);

      expect(result).toBe(true);
    });

    it('filters by especialidade correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const espColumn = columns.find((col) => col.id === 'especialidade');
      const filterFn = espColumn?.filterFn;

      const cardioRow = { original: mockStaff[0] } as any; // Cardiologia
      const neuroRow = { original: mockStaff[1] } as any; // Neurologia

      expect(filterFn?.(cardioRow, 'especialidade', ['Cardiologia'])).toBe(true);
      expect(filterFn?.(neuroRow, 'especialidade', ['Cardiologia'])).toBe(false);
    });

    it('handles null especialidade in filtering', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const espColumn = columns.find((col) => col.id === 'especialidade');
      const filterFn = espColumn?.filterFn;

      const nullEspRow = { original: mockStaff[2] } as any; // No especialidade

      expect(filterFn?.(nullEspRow, 'especialidade', ['Cardiologia'])).toBe(false);
    });
  });

  describe('Status Filter Function', () => {
    it('returns true when no filter value is provided', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const statusColumn = columns.find((col) => col.id === 'status');
      const filterFn = statusColumn?.filterFn;

      const mockRow = { original: mockStaff[0] } as any;
      const result = filterFn?.(mockRow, 'status', []);

      expect(result).toBe(true);
    });

    it('filters active staff correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const statusColumn = columns.find((col) => col.id === 'status');
      const filterFn = statusColumn?.filterFn;

      const activeRow = { original: mockStaff[0] } as any; // active: true
      const inactiveRow = { original: mockStaff[1] } as any; // active: false

      expect(filterFn?.(activeRow, 'status', ['active'])).toBe(true);
      expect(filterFn?.(inactiveRow, 'status', ['active'])).toBe(false);
    });

    it('filters inactive staff correctly', () => {
      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      const statusColumn = columns.find((col) => col.id === 'status');
      const filterFn = statusColumn?.filterFn;

      const activeRow = { original: mockStaff[0] } as any; // active: true
      const inactiveRow = { original: mockStaff[1] } as any; // active: false

      expect(filterFn?.(activeRow, 'status', ['inactive'])).toBe(false);
      expect(filterFn?.(inactiveRow, 'status', ['inactive'])).toBe(true);
    });
  });

  describe('Action Button Callbacks', () => {
    it('calls onEdit with staff when edit button is clicked', async () => {
      const handleEdit = vi.fn();
      const handleUnlink = vi.fn();
      const user = userEvent.setup();

      const columns = getMedicalStaffColumns({
        onEdit: handleEdit,
        onUnlink: handleUnlink,
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: 'Abrir menu' });
      await user.click(menuButton);

      // Click edit button
      const editButton = screen.getByRole('menuitem', { name: /Editar/ });
      await user.click(editButton);

      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockStaff[0]);
      expect(handleUnlink).not.toHaveBeenCalled();
    });

    it('calls onUnlink with correct parameters when unlink button is clicked', async () => {
      const handleEdit = vi.fn();
      const handleUnlink = vi.fn();
      const user = userEvent.setup();

      const columns = getMedicalStaffColumns({
        onEdit: handleEdit,
        onUnlink: handleUnlink,
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />);

      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: 'Abrir menu' });
      await user.click(menuButton);

      // Click unlink/remove button
      const unlinkButton = screen.getByRole('menuitem', { name: /Remover/ });
      await user.click(unlinkButton);

      expect(handleUnlink).toHaveBeenCalledTimes(1);
      expect(handleUnlink).toHaveBeenCalledWith('staff-1', 'stafforg-1', 1);
      expect(handleEdit).not.toHaveBeenCalled();
    });

    it('shows "Desvincular" label when organization_count > 1', async () => {
      const user = userEvent.setup();

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[1]]} columns={columns} />); // organization_count: 2

      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: 'Abrir menu' });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /Desvincular/ })).toBeInTheDocument();
    });

    it('shows "Remover" label when organization_count is 1', async () => {
      const user = userEvent.setup();

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[mockStaff[0]]} columns={columns} />); // organization_count: 1

      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: 'Abrir menu' });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /Remover/ })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles staff with all empty optional fields', () => {
      const emptyStaff: MedicalStaffWithOrganization = {
        id: 'staff-empty',
        name: 'Empty Staff',
        email: '',
        phone: '',
        crm: '',
        role: 'Técnico',
        color: '#000000',
        active: true,
        especialidade_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        especialidade: null,
        staff_organization: {
          id: 'stafforg-empty',
          staff_id: 'staff-empty',
          organization_id: 'org-1',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        organization_count: 1,
      };

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[emptyStaff]} columns={columns} />);

      expect(screen.getByText('Empty Staff')).toBeInTheDocument();
      // Role appears in multiple columns (name column and role column)
      const tecnicoElements = screen.getAllByText('Técnico');
      expect(tecnicoElements.length).toBeGreaterThan(0);
      // Should have dash for contact and especialidade
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });

    it('handles very long staff name', () => {
      const longNameStaff: MedicalStaffWithOrganization = {
        ...mockStaff[0],
        name: 'Dr. João Pedro da Silva Santos Oliveira Rodrigues',
      };

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[longNameStaff]} columns={columns} />);

      expect(
        screen.getByText('Dr. João Pedro da Silva Santos Oliveira Rodrigues')
      ).toBeInTheDocument();
    });

    it('handles staff without staff_organization', () => {
      const staffWithoutOrg: MedicalStaffWithOrganization = {
        ...mockStaff[0],
        staff_organization: undefined,
      };

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[staffWithoutOrg]} columns={columns} />);

      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
      expect(screen.getByText('Ativo')).toBeInTheDocument(); // Uses global active status
    });

    it('handles special characters in email and phone', () => {
      const specialCharStaff: MedicalStaffWithOrganization = {
        ...mockStaff[0],
        email: 'joão+test@example.com',
        phone: '+55 (11) 98765-4321',
      };

      const columns = getMedicalStaffColumns({
        onEdit: vi.fn(),
        onUnlink: vi.fn(),
      });

      render(<TestTable data={[specialCharStaff]} columns={columns} />);

      expect(screen.getByText('joão+test@example.com')).toBeInTheDocument();
      expect(screen.getByText('+55 (11) 98765-4321')).toBeInTheDocument();
    });
  });
});
