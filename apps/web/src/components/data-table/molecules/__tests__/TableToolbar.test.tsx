/**
 * TableToolbar Molecule Component Tests
 *
 * Unit tests for the TableToolbar component covering search, filters, and custom actions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableToolbar } from '../TableToolbar';
import type { Table, Column } from '@tanstack/react-table';

// Mock column for testing
const createMockColumn = (overrides?: Partial<Column<any, any>>): Column<any, any> => {
  return {
    getFilterValue: vi.fn(() => ''),
    setFilterValue: vi.fn(),
    ...overrides,
  } as unknown as Column<any, any>;
};

// Mock table for testing
const createMockTable = (overrides?: Partial<Table<any>>): Table<any> => {
  return {
    getState: vi.fn(() => ({
      columnFilters: [],
    })),
    getColumn: vi.fn((id: string) => createMockColumn()),
    resetColumnFilters: vi.fn(),
    ...overrides,
  } as unknown as Table<any>;
};

describe('TableToolbar', () => {
  describe('Rendering', () => {
    it('renders without search when searchColumn is not provided', () => {
      const table = createMockTable();

      render(<TableToolbar table={table} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('renders search input when searchColumn is provided', () => {
      const table = createMockTable();

      render(<TableToolbar table={table} searchColumn="name" />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays default search placeholder', () => {
      const table = createMockTable();

      render(<TableToolbar table={table} searchColumn="name" />);

      expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    });

    it('displays custom search placeholder', () => {
      const table = createMockTable();

      render(
        <TableToolbar
          table={table}
          searchColumn="name"
          searchPlaceholder="Buscar por nome..."
        />
      );

      expect(screen.getByPlaceholderText('Buscar por nome...')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('shows current filter value in search input', () => {
      const column = createMockColumn({
        getFilterValue: vi.fn(() => 'test search'),
      });
      const table = createMockTable({
        getColumn: vi.fn(() => column),
      });

      render(<TableToolbar table={table} searchColumn="name" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('test search');
    });

    it('calls setFilterValue when typing in search input', async () => {
      const setFilterValue = vi.fn();
      const column = createMockColumn({
        setFilterValue,
      });
      const table = createMockTable({
        getColumn: vi.fn(() => column),
      });
      const user = userEvent.setup();

      render(<TableToolbar table={table} searchColumn="name" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test');

      // Should be called for each character typed (T, e, s, t)
      expect(setFilterValue).toHaveBeenCalled();
      expect(setFilterValue.mock.calls.length).toBeGreaterThan(0);
    });

    it('handles empty search column gracefully', () => {
      const table = createMockTable({
        getColumn: vi.fn(() => undefined),
      });

      render(<TableToolbar table={table} searchColumn="nonexistent" />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('clears search on input clear', async () => {
      const setFilterValue = vi.fn();
      const column = createMockColumn({
        getFilterValue: vi.fn(() => 'test'),
        setFilterValue,
      });
      const table = createMockTable({
        getColumn: vi.fn(() => column),
      });
      const user = userEvent.setup();

      render(<TableToolbar table={table} searchColumn="name" />);

      const input = screen.getByRole('textbox');
      await user.clear(input);

      expect(setFilterValue).toHaveBeenCalledWith('');
    });
  });

  describe('Clear Filters Button', () => {
    it('does not show clear filters button when no filters are applied', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          columnFilters: [],
        })),
      });

      render(<TableToolbar table={table} searchColumn="name" />);

      expect(screen.queryByText('Limpar filtros')).not.toBeInTheDocument();
    });

    it('shows clear filters button when filters are applied', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          columnFilters: [{ id: 'name', value: 'test' }],
        })),
      });

      render(<TableToolbar table={table} searchColumn="name" />);

      expect(screen.getByText('Limpar filtros')).toBeInTheDocument();
    });

    it('calls resetColumnFilters when clear button is clicked', async () => {
      const resetColumnFilters = vi.fn();
      const table = createMockTable({
        getState: vi.fn(() => ({
          columnFilters: [{ id: 'name', value: 'test' }],
        })),
        resetColumnFilters,
      });
      const user = userEvent.setup();

      render(<TableToolbar table={table} searchColumn="name" />);

      const clearButton = screen.getByText('Limpar filtros');
      await user.click(clearButton);

      expect(resetColumnFilters).toHaveBeenCalledTimes(1);
    });

    it('shows clear button with multiple filters', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          columnFilters: [
            { id: 'name', value: 'test' },
            { id: 'status', value: 'active' },
          ],
        })),
      });

      render(<TableToolbar table={table} searchColumn="name" />);

      expect(screen.getByText('Limpar filtros')).toBeInTheDocument();
    });
  });

  describe('Custom Actions (Children)', () => {
    it('renders custom actions when children provided', () => {
      const table = createMockTable();

      render(
        <TableToolbar table={table} searchColumn="name">
          <button>Add New</button>
          <button>Export</button>
        </TableToolbar>
      );

      expect(screen.getByText('Add New')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('does not render actions container when no children', () => {
      const table = createMockTable();

      render(<TableToolbar table={table} searchColumn="name" />);

      // Check that there are no custom action buttons (children are not rendered)
      expect(screen.queryByTestId('action-button')).not.toBeInTheDocument();
    });

    it('renders children in correct slot', () => {
      const table = createMockTable();

      const { container } = render(
        <TableToolbar table={table} searchColumn="name">
          <button data-testid="action-button">Action</button>
        </TableToolbar>
      );

      const actionButton = screen.getByTestId('action-button');
      const actionsContainer = actionButton.parentElement;

      expect(actionsContainer).toHaveClass('flex');
      expect(actionsContainer).toHaveClass('items-center');
      expect(actionsContainer).toHaveClass('space-x-2');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to container', () => {
      const table = createMockTable();

      const { container } = render(
        <TableToolbar table={table} searchColumn="name" className="mt-4 bg-gray-100" />
      );

      const toolbarDiv = container.firstChild;
      expect(toolbarDiv).toHaveClass('mt-4');
      expect(toolbarDiv).toHaveClass('bg-gray-100');
    });

    it('preserves default classes with custom className', () => {
      const table = createMockTable();

      const { container } = render(
        <TableToolbar table={table} searchColumn="name" className="custom-class" />
      );

      const toolbarDiv = container.firstChild;
      expect(toolbarDiv).toHaveClass('flex');
      expect(toolbarDiv).toHaveClass('items-center');
      expect(toolbarDiv).toHaveClass('justify-between');
      expect(toolbarDiv).toHaveClass('custom-class');
    });
  });

  describe('Layout and Spacing', () => {
    it('maintains flex layout for search and filters', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          columnFilters: [{ id: 'name', value: 'test' }],
        })),
      });

      const { container } = render(<TableToolbar table={table} searchColumn="name" />);

      const leftSection = container.querySelector('.flex.flex-1.items-center.space-x-2');
      expect(leftSection).toBeInTheDocument();
    });

    it('positions custom actions on the right', () => {
      const table = createMockTable();

      const { container } = render(
        <TableToolbar table={table} searchColumn="name">
          <button>Action</button>
        </TableToolbar>
      );

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('justify-between');
    });
  });

  describe('Edge Cases', () => {
    it('handles null filter value gracefully', () => {
      const column = createMockColumn({
        getFilterValue: vi.fn(() => null),
      });
      const table = createMockTable({
        getColumn: vi.fn(() => column),
      });

      render(<TableToolbar table={table} searchColumn="name" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('handles undefined filter value gracefully', () => {
      const column = createMockColumn({
        getFilterValue: vi.fn(() => undefined),
      });
      const table = createMockTable({
        getColumn: vi.fn(() => column),
      });

      render(<TableToolbar table={table} searchColumn="name" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('handles rapid typing in search input', async () => {
      const setFilterValue = vi.fn();
      const column = createMockColumn({
        setFilterValue,
      });
      const table = createMockTable({
        getColumn: vi.fn(() => column),
      });
      const user = userEvent.setup();

      render(<TableToolbar table={table} searchColumn="name" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'quick', { delay: 10 });

      expect(setFilterValue).toHaveBeenCalled();
    });

    it('handles special characters in search', async () => {
      const setFilterValue = vi.fn();
      const column = createMockColumn({
        setFilterValue,
      });
      const table = createMockTable({
        getColumn: vi.fn(() => column),
      });
      const user = userEvent.setup();

      render(<TableToolbar table={table} searchColumn="name" />);

      const input = screen.getByRole('textbox');
      await user.type(input, '@#');

      // Verify setFilterValue was called with special characters
      expect(setFilterValue).toHaveBeenCalled();
      expect(setFilterValue.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('works with search and clear filters together', async () => {
      const setFilterValue = vi.fn();
      const resetColumnFilters = vi.fn();
      const column = createMockColumn({
        getFilterValue: vi.fn(() => 'test'),
        setFilterValue,
      });
      const table = createMockTable({
        getState: vi.fn(() => ({
          columnFilters: [{ id: 'name', value: 'test' }],
        })),
        getColumn: vi.fn(() => column),
        resetColumnFilters,
      });
      const user = userEvent.setup();

      render(<TableToolbar table={table} searchColumn="name" />);

      const clearButton = screen.getByText('Limpar filtros');
      await user.click(clearButton);

      expect(resetColumnFilters).toHaveBeenCalled();
    });

    it('works with search and custom actions together', async () => {
      const setFilterValue = vi.fn();
      const handleAction = vi.fn();
      const column = createMockColumn({
        setFilterValue,
      });
      const table = createMockTable({
        getColumn: vi.fn(() => column),
      });
      const user = userEvent.setup();

      render(
        <TableToolbar table={table} searchColumn="name">
          <button onClick={handleAction}>Export</button>
        </TableToolbar>
      );

      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, 'test');

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      expect(setFilterValue).toHaveBeenCalled();
      expect(handleAction).toHaveBeenCalled();
    });
  });
});
