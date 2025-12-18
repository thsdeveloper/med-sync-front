/**
 * ColumnHeader Molecule Component Tests
 *
 * Unit tests for the ColumnHeader molecule component covering sorting functionality,
 * sort indicators, click handlers, and various column configurations.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnHeader } from '../ColumnHeader';
import type { Column } from '@tanstack/react-table';

// Mock column helper
const createMockColumn = (overrides: Partial<Column<any, any>> = {}): Column<any, any> => {
  return {
    getCanSort: vi.fn().mockReturnValue(true),
    getIsSorted: vi.fn().mockReturnValue(false),
    toggleSorting: vi.fn(),
    ...overrides,
  } as unknown as Column<any, any>;
};

describe('ColumnHeader', () => {
  describe('Rendering - Sortable Column', () => {
    it('renders title for sortable column', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="Name" />);

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('renders as a button for sortable column', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="Status" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Status');
    });

    it('shows default sort icon when not sorted', () => {
      const column = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Email" />);

      expect(screen.getByLabelText('Clique para ordenar')).toBeInTheDocument();
    });

    it('applies ghost variant to button', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="Column" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ghost');
    });
  });

  describe('Rendering - Non-Sortable Column', () => {
    it('renders title for non-sortable column', () => {
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Actions" />);

      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders as a div for non-sortable column', () => {
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Actions" />);

      // Should not render as button
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      const header = screen.getByText('Actions');
      expect(header.tagName).not.toBe('BUTTON');
    });

    it('applies font-medium class to non-sortable column', () => {
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="ID" />);

      const header = screen.getByText('ID');
      expect(header).toHaveClass('font-medium');
    });

    it('does not show sort icon for non-sortable column', () => {
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Actions" />);

      expect(screen.queryByLabelText('Clique para ordenar')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Ordenado crescente')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Ordenado decrescente')).not.toBeInTheDocument();
    });
  });

  describe('Sort States', () => {
    it('shows ascending arrow when sorted ascending', () => {
      const column = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue('asc'),
      });

      render(<ColumnHeader column={column} title="Name" />);

      expect(screen.getByLabelText('Ordenado crescente')).toBeInTheDocument();
      expect(screen.queryByLabelText('Ordenado decrescente')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Clique para ordenar')).not.toBeInTheDocument();
    });

    it('shows descending arrow when sorted descending', () => {
      const column = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue('desc'),
      });

      render(<ColumnHeader column={column} title="Name" />);

      expect(screen.getByLabelText('Ordenado decrescente')).toBeInTheDocument();
      expect(screen.queryByLabelText('Ordenado crescente')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Clique para ordenar')).not.toBeInTheDocument();
    });

    it('shows default arrows when not sorted', () => {
      const column = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Name" />);

      expect(screen.getByLabelText('Clique para ordenar')).toBeInTheDocument();
      expect(screen.queryByLabelText('Ordenado crescente')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Ordenado decrescente')).not.toBeInTheDocument();
    });
  });

  describe('Sort Toggle Interaction', () => {
    it('calls toggleSorting when clicked', async () => {
      const toggleSorting = vi.fn();
      const column = createMockColumn({
        toggleSorting,
        getIsSorted: vi.fn().mockReturnValue(false),
      });

      const user = userEvent.setup();
      render(<ColumnHeader column={column} title="Name" />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(toggleSorting).toHaveBeenCalledTimes(1);
    });

    it('toggles from unsorted to ascending', async () => {
      const toggleSorting = vi.fn();
      const column = createMockColumn({
        toggleSorting,
        getIsSorted: vi.fn().mockReturnValue(false),
      });

      const user = userEvent.setup();
      render(<ColumnHeader column={column} title="Name" />);

      const button = screen.getByRole('button');
      await user.click(button);

      // When unsorted (false), should call toggleSorting(false) to sort ascending
      expect(toggleSorting).toHaveBeenCalledWith(false);
    });

    it('toggles from ascending to descending', async () => {
      const toggleSorting = vi.fn();
      const column = createMockColumn({
        toggleSorting,
        getIsSorted: vi.fn().mockReturnValue('asc'),
      });

      const user = userEvent.setup();
      render(<ColumnHeader column={column} title="Name" />);

      const button = screen.getByRole('button');
      await user.click(button);

      // When sorted ascending ('asc'), should call toggleSorting(true) to sort descending
      expect(toggleSorting).toHaveBeenCalledWith(true);
    });

    it('handles multiple clicks', async () => {
      const toggleSorting = vi.fn();
      const column = createMockColumn({
        toggleSorting,
        getIsSorted: vi.fn().mockReturnValue(false),
      });

      const user = userEvent.setup();
      render(<ColumnHeader column={column} title="Name" />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(toggleSorting).toHaveBeenCalledTimes(3);
    });

    it('does not call toggleSorting for non-sortable column', async () => {
      const toggleSorting = vi.fn();
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
        toggleSorting,
      });

      const user = userEvent.setup();
      render(<ColumnHeader column={column} title="Actions" />);

      const header = screen.getByText('Actions');
      await user.click(header);

      expect(toggleSorting).not.toHaveBeenCalled();
    });
  });

  describe('Alignment', () => {
    it('applies left alignment by default for sortable column', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="Name" />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('mx-auto');
      expect(button).not.toHaveClass('ml-auto');
    });

    it('applies center alignment when align="center" for sortable column', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="Status" align="center" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('mx-auto');
    });

    it('applies right alignment when align="right" for sortable column', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="Actions" align="right" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ml-auto');
    });

    it('applies left alignment by default for non-sortable column', () => {
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="ID" />);

      const header = screen.getByText('ID');
      expect(header).not.toHaveClass('text-center');
      expect(header).not.toHaveClass('text-right');
    });

    it('applies center alignment when align="center" for non-sortable column', () => {
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Status" align="center" />);

      const header = screen.getByText('Status');
      expect(header).toHaveClass('text-center');
    });

    it('applies right alignment when align="right" for non-sortable column', () => {
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Actions" align="right" />);

      const header = screen.getByText('Actions');
      expect(header).toHaveClass('text-right');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to sortable column', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="Name" className="w-64" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-64');
    });

    it('applies custom className to non-sortable column', () => {
      const column = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Actions" className="w-24" />);

      const header = screen.getByText('Actions');
      expect(header).toHaveClass('w-24');
    });

    it('combines custom className with alignment class', () => {
      const column = createMockColumn();
      render(
        <ColumnHeader
          column={column}
          title="Status"
          align="center"
          className="font-bold"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('mx-auto');
      expect(button).toHaveClass('font-bold');
    });
  });

  describe('Accessibility', () => {
    it('has accessible sort indicators', () => {
      const column = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue(false),
      });

      render(<ColumnHeader column={column} title="Name" />);

      const icon = screen.getByLabelText('Clique para ordenar');
      expect(icon).toBeInTheDocument();
    });

    it('has accessible ascending sort indicator', () => {
      const column = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue('asc'),
      });

      render(<ColumnHeader column={column} title="Name" />);

      const icon = screen.getByLabelText('Ordenado crescente');
      expect(icon).toBeInTheDocument();
    });

    it('has accessible descending sort indicator', () => {
      const column = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue('desc'),
      });

      render(<ColumnHeader column={column} title="Name" />);

      const icon = screen.getByLabelText('Ordenado decrescente');
      expect(icon).toBeInTheDocument();
    });

    it('button is keyboard accessible', async () => {
      const toggleSorting = vi.fn();
      const column = createMockColumn({
        toggleSorting,
      });

      const user = userEvent.setup();
      render(<ColumnHeader column={column} title="Name" />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(toggleSorting).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long column titles', () => {
      const column = createMockColumn();
      const longTitle = 'A'.repeat(100);
      render(<ColumnHeader column={column} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      const column = createMockColumn();
      const specialTitle = '<>&"\'`';
      render(<ColumnHeader column={column} title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('handles emoji in title', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="=� Data" />);

      expect(screen.getByText('=� Data')).toBeInTheDocument();
    });

    it('handles empty title', () => {
      const column = createMockColumn();
      render(<ColumnHeader column={column} title="" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles rapid clicks without errors', async () => {
      const toggleSorting = vi.fn();
      const column = createMockColumn({
        toggleSorting,
      });

      const user = userEvent.setup();
      render(<ColumnHeader column={column} title="Name" />);

      const button = screen.getByRole('button');
      await user.tripleClick(button);

      expect(toggleSorting).toHaveBeenCalled();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('accepts generic type parameters', () => {
      interface TestData {
        id: number;
        name: string;
      }

      const column = createMockColumn() as Column<TestData, string>;
      render(<ColumnHeader<TestData, string> column={column} title="Name" />);

      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  describe('Integration with TanStack Table', () => {
    it('respects column sort capability', () => {
      const sortableColumn = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(true),
      });

      const nonSortableColumn = createMockColumn({
        getCanSort: vi.fn().mockReturnValue(false),
      });

      const { rerender } = render(
        <ColumnHeader column={sortableColumn} title="Sortable" />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(<ColumnHeader column={nonSortableColumn} title="Non-Sortable" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('reflects column sort state changes', () => {
      const column = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue(false),
      });

      const { rerender } = render(<ColumnHeader column={column} title="Name" />);
      expect(screen.getByLabelText('Clique para ordenar')).toBeInTheDocument();

      // Simulate sort state change
      const ascColumn = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue('asc'),
      });

      rerender(<ColumnHeader column={ascColumn} title="Name" />);
      expect(screen.getByLabelText('Ordenado crescente')).toBeInTheDocument();

      // Simulate another sort state change
      const descColumn = createMockColumn({
        getIsSorted: vi.fn().mockReturnValue('desc'),
      });

      rerender(<ColumnHeader column={descColumn} title="Name" />);
      expect(screen.getByLabelText('Ordenado decrescente')).toBeInTheDocument();
    });
  });
});
