/**
 * TablePagination Molecule Component Tests
 *
 * Unit tests for the TablePagination component covering page navigation, page size selection,
 * and pagination state display.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TablePagination } from '../TablePagination';
import type { Table, PaginationState } from '@tanstack/react-table';

// Mock table helper
const createMockTable = (overrides?: Partial<Table<any>>): Table<any> => {
  const defaultPagination: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
  };

  return {
    getState: vi.fn(() => ({
      pagination: defaultPagination,
    })),
    getPageCount: vi.fn(() => 5),
    getFilteredRowModel: vi.fn(() => ({
      rows: Array.from({ length: 50 }, (_, i) => ({ id: i })),
    })),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    setPageSize: vi.fn(),
    getCanPreviousPage: vi.fn(() => false),
    getCanNextPage: vi.fn(() => true),
    ...overrides,
  } as unknown as Table<any>;
};

describe('TablePagination', () => {
  describe('Rendering', () => {
    it('renders pagination controls', () => {
      const table = createMockTable();
      render(<TablePagination table={table} />);

      // Use regex to match Portuguese text with special characters
      expect(screen.getByText(/Linhas por/i)).toBeInTheDocument();
      expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
    });

    it('displays current page information', () => {
      const table = createMockTable();
      render(<TablePagination table={table} />);

      // Check for page number display
      expect(screen.getByText(/1/)).toBeInTheDocument();
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });

    it('displays row range information', () => {
      const table = createMockTable();
      render(<TablePagination table={table} />);

      expect(screen.getByText(/Mostrando 1 a 10 de 50/)).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      const table = createMockTable();
      render(<TablePagination table={table} />);

      // Use aria-labels to find buttons
      expect(screen.getByLabelText(/anterior/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pr.xima/i)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const table = createMockTable();
      const { container } = render(
        <TablePagination table={table} className="custom-class" />
      );

      const paginationDiv = container.firstChild;
      expect(paginationDiv).toHaveClass('custom-class');
      expect(paginationDiv).toHaveClass('flex');
    });
  });

  describe('Page Navigation', () => {
    it('disables previous button on first page', () => {
      const table = createMockTable({
        getCanPreviousPage: vi.fn(() => false),
      });

      render(<TablePagination table={table} />);

      const prevButton = screen.getByLabelText(/anterior/i);
      expect(prevButton).toBeDisabled();
    });

    it('enables previous button when not on first page', () => {
      const table = createMockTable({
        getCanPreviousPage: vi.fn(() => true),
        getState: vi.fn(() => ({
          pagination: { pageIndex: 1, pageSize: 10 },
        })),
      });

      render(<TablePagination table={table} />);

      const prevButton = screen.getByLabelText(/anterior/i);
      expect(prevButton).not.toBeDisabled();
    });

    it('disables next button on last page', () => {
      const table = createMockTable({
        getCanNextPage: vi.fn(() => false),
      });

      render(<TablePagination table={table} />);

      const nextButton = screen.getByLabelText(/pr.xima/i);
      expect(nextButton).toBeDisabled();
    });

    it('enables next button when not on last page', () => {
      const table = createMockTable({
        getCanNextPage: vi.fn(() => true),
      });

      render(<TablePagination table={table} />);

      const nextButton = screen.getByLabelText(/pr.xima/i);
      expect(nextButton).not.toBeDisabled();
    });

    it('calls previousPage when previous button clicked', async () => {
      const previousPage = vi.fn();
      const table = createMockTable({
        previousPage,
        getCanPreviousPage: vi.fn(() => true),
      });

      const user = userEvent.setup();
      render(<TablePagination table={table} />);

      const prevButton = screen.getByLabelText(/anterior/i);
      await user.click(prevButton);

      expect(previousPage).toHaveBeenCalledTimes(1);
    });

    it('calls nextPage when next button clicked', async () => {
      const nextPage = vi.fn();
      const table = createMockTable({
        nextPage,
        getCanNextPage: vi.fn(() => true),
      });

      const user = userEvent.setup();
      render(<TablePagination table={table} />);

      const nextButton = screen.getByLabelText(/pr.xima/i);
      await user.click(nextButton);

      expect(nextPage).toHaveBeenCalledTimes(1);
    });

    it('updates page range display for different pages', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          pagination: { pageIndex: 2, pageSize: 10 },
        })),
      });

      render(<TablePagination table={table} />);

      expect(screen.getByText(/Mostrando 21 a 30 de 50/)).toBeInTheDocument();
    });

    it('handles last page with partial rows correctly', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          pagination: { pageIndex: 4, pageSize: 10 },
        })),
        getFilteredRowModel: vi.fn(() => ({
          rows: Array.from({ length: 45 }, (_, i) => ({ id: i })),
        })),
      });

      render(<TablePagination table={table} />);

      // Last page shows rows 41-45
      expect(screen.getByText(/Mostrando 41 a 45 de 45/)).toBeInTheDocument();
    });
  });

  describe('Page Size Selection', () => {
    it('displays page size selector', () => {
      const table = createMockTable();
      render(<TablePagination table={table} />);

      // The Select component renders with combobox role
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows current page size in select', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          pagination: { pageIndex: 0, pageSize: 20 },
        })),
      });

      render(<TablePagination table={table} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('20');
    });

    it('updates row range when page size changes', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          pagination: { pageIndex: 0, pageSize: 20 },
        })),
      });

      render(<TablePagination table={table} />);

      // With page size 20, first page shows 1-20
      expect(screen.getByText(/Mostrando 1 a 20 de 50/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty message when no rows', () => {
      const table = createMockTable({
        getFilteredRowModel: vi.fn(() => ({
          rows: [],
        })),
        getPageCount: vi.fn(() => 0),
      });

      render(<TablePagination table={table} />);

      expect(screen.getByText(/Nenhuma linha encontrada/)).toBeInTheDocument();
    });

    it('disables navigation buttons when no rows', () => {
      const table = createMockTable({
        getFilteredRowModel: vi.fn(() => ({
          rows: [],
        })),
        getPageCount: vi.fn(() => 0),
        getCanPreviousPage: vi.fn(() => false),
        getCanNextPage: vi.fn(() => false),
      });

      render(<TablePagination table={table} />);

      expect(screen.getByLabelText(/anterior/i)).toBeDisabled();
      expect(screen.getByLabelText(/pr.xima/i)).toBeDisabled();
    });
  });

  describe('Single Page', () => {
    it('shows correct pagination for single page with few rows', () => {
      const table = createMockTable({
        getFilteredRowModel: vi.fn(() => ({
          rows: Array.from({ length: 5 }, (_, i) => ({ id: i })),
        })),
        getPageCount: vi.fn(() => 1),
        getCanPreviousPage: vi.fn(() => false),
        getCanNextPage: vi.fn(() => false),
      });

      render(<TablePagination table={table} />);

      expect(screen.getByText(/Mostrando 1 a 5 de 5/)).toBeInTheDocument();
      expect(screen.getByLabelText(/anterior/i)).toBeDisabled();
      expect(screen.getByLabelText(/pr.xima/i)).toBeDisabled();
    });

    it('shows correct pagination for exactly one page of rows', () => {
      const table = createMockTable({
        getFilteredRowModel: vi.fn(() => ({
          rows: Array.from({ length: 10 }, (_, i) => ({ id: i })),
        })),
        getPageCount: vi.fn(() => 1),
      });

      render(<TablePagination table={table} />);

      expect(screen.getByText(/Mostrando 1 a 10 de 10/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very large row counts', () => {
      const table = createMockTable({
        getFilteredRowModel: vi.fn(() => ({
          rows: Array.from({ length: 10000 }, (_, i) => ({ id: i })),
        })),
        getPageCount: vi.fn(() => 1000),
      });

      render(<TablePagination table={table} />);

      expect(screen.getByText(/Mostrando 1 a 10 de 10000/)).toBeInTheDocument();
    });

    it('handles different page sizes correctly', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          pagination: { pageIndex: 0, pageSize: 30 },
        })),
        getPageCount: vi.fn(() => 2),
      });

      render(<TablePagination table={table} />);

      expect(screen.getByText(/Mostrando 1 a 30 de 50/)).toBeInTheDocument();
    });

    it('calculates end row correctly when it exceeds total rows', () => {
      const table = createMockTable({
        getFilteredRowModel: vi.fn(() => ({
          rows: Array.from({ length: 23 }, (_, i) => ({ id: i })),
        })),
        getState: vi.fn(() => ({
          pagination: { pageIndex: 2, pageSize: 10 },
        })),
        getPageCount: vi.fn(() => 3),
      });

      render(<TablePagination table={table} />);

      // Last page: should show 21 to 23, not 21 to 30
      expect(screen.getByText(/Mostrando 21 a 23 de 23/)).toBeInTheDocument();
    });

    it('handles rapid button clicks without errors', async () => {
      const nextPage = vi.fn();
      const table = createMockTable({
        nextPage,
        getCanNextPage: vi.fn(() => true),
      });

      const user = userEvent.setup();
      render(<TablePagination table={table} />);

      const nextButton = screen.getByLabelText(/pr.xima/i);
      await user.tripleClick(nextButton);

      // Should be called at least once
      expect(nextPage).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has accessible navigation button labels', () => {
      const table = createMockTable();
      render(<TablePagination table={table} />);

      expect(screen.getByLabelText(/anterior/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pr.xima/i)).toBeInTheDocument();
    });

    it('navigation buttons are keyboard accessible', async () => {
      const nextPage = vi.fn();
      const table = createMockTable({
        nextPage,
        getCanNextPage: vi.fn(() => true),
      });

      const user = userEvent.setup();
      render(<TablePagination table={table} />);

      const nextButton = screen.getByLabelText(/pr.xima/i);
      nextButton.focus();
      expect(nextButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(nextPage).toHaveBeenCalled();
    });

    it('page size selector is keyboard accessible', async () => {
      const table = createMockTable();
      const user = userEvent.setup();

      render(<TablePagination table={table} />);

      const select = screen.getByRole('combobox');
      select.focus();
      expect(select).toHaveFocus();
    });
  });

  describe('Integration with TanStack Table', () => {
    it('responds to pagination state changes from table', () => {
      const table = createMockTable({
        getState: vi.fn(() => ({
          pagination: { pageIndex: 3, pageSize: 10 },
        })),
      });

      const { rerender } = render(<TablePagination table={table} />);
      expect(screen.getByText(/Mostrando 31 a 40 de 50/)).toBeInTheDocument();

      // Simulate state change
      const updatedTable = createMockTable({
        getState: vi.fn(() => ({
          pagination: { pageIndex: 1, pageSize: 10 },
        })),
      });

      rerender(<TablePagination table={updatedTable} />);
      expect(screen.getByText(/Mostrando 11 a 20 de 50/)).toBeInTheDocument();
    });

    it('reflects filtered row changes', () => {
      const table = createMockTable({
        getFilteredRowModel: vi.fn(() => ({
          rows: Array.from({ length: 25 }, (_, i) => ({ id: i })),
        })),
        getPageCount: vi.fn(() => 3),
      });

      render(<TablePagination table={table} />);
      expect(screen.getByText(/Mostrando 1 a 10 de 25/)).toBeInTheDocument();
    });
  });

  describe('Custom Page Size Options', () => {
    it('renders with custom page size options', () => {
      const table = createMockTable();
      render(<TablePagination table={table} pageSizeOptions={[5, 15, 25, 50]} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('defaults to standard options when not provided', () => {
      const table = createMockTable();
      render(<TablePagination table={table} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
