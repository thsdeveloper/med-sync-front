/**
 * useDataTable Hook Tests
 *
 * Comprehensive unit tests for the useDataTable hook covering client-side and server-side modes,
 * state management, and various configurations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDataTable } from '../useDataTable';
import type { ColumnDef } from '@tanstack/react-table';

// Test data types
interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Mock data
const mockUsers: TestUser[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Manager' },
  { id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'User' },
];

// Basic columns
const columns: ColumnDef<TestUser>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    enableSorting: true,
  },
];

describe('useDataTable', () => {
  describe('Initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      expect(result.current.table).toBeDefined();
      expect(result.current.pagination).toEqual({
        pageIndex: 0,
        pageSize: 10,
      });
      expect(result.current.sorting).toEqual([]);
      expect(result.current.columnFilters).toEqual([]);
      expect(result.current.globalFilter).toBe('');
      expect(result.current.columnVisibility).toEqual({});
      expect(result.current.rowSelection).toEqual({});
    });

    it('initializes with custom page size', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialPageSize: 20,
        })
      );

      expect(result.current.pagination.pageSize).toBe(20);
    });

    it('initializes with custom page index', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialPageIndex: 2,
        })
      );

      expect(result.current.pagination.pageIndex).toBe(2);
    });

    it('initializes with custom sorting', () => {
      const initialSorting = [{ id: 'name', desc: false }];
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialSorting,
        })
      );

      expect(result.current.sorting).toEqual(initialSorting);
    });

    it('initializes with custom filters', () => {
      const initialFilters = [{ id: 'role', value: 'Admin' }];
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialColumnFilters: initialFilters,
        })
      );

      expect(result.current.columnFilters).toEqual(initialFilters);
    });

    it('initializes with global filter', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialGlobalFilter: 'search term',
        })
      );

      expect(result.current.globalFilter).toBe('search term');
    });

    it('initializes with column visibility', () => {
      const visibility = { email: false };
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialColumnVisibility: visibility,
        })
      );

      expect(result.current.columnVisibility).toEqual(visibility);
    });
  });

  describe('Client-side Mode', () => {
    it('calculates total rows from data length', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      expect(result.current.totalRows).toBe(mockUsers.length);
    });

    it('calculates page count correctly', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialPageSize: 2,
        })
      );

      expect(result.current.pageCount).toBe(3); // 5 users / 2 per page = 3 pages
    });

    it('updates table when data changes', () => {
      const { result, rerender } = renderHook(
        ({ data }) => useDataTable({ data, columns }),
        { initialProps: { data: mockUsers } }
      );

      const newData = [mockUsers[0], mockUsers[1]];
      rerender({ data: newData });

      expect(result.current.totalRows).toBe(2);
    });
  });

  describe('Server-side Mode', () => {
    it('uses provided totalRows in manual mode', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          manualMode: true,
          totalRows: 100,
        })
      );

      expect(result.current.totalRows).toBe(100);
    });

    it('uses provided pageCount in manual mode', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          manualMode: true,
          pageCount: 10,
        })
      );

      expect(result.current.pageCount).toBe(10);
    });

    it('calls onPaginationChange when pagination changes in manual mode', () => {
      const onPaginationChange = vi.fn();

      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          manualMode: true,
          onPaginationChange,
        })
      );

      act(() => {
        result.current.setPagination({ pageIndex: 1, pageSize: 10 });
      });

      expect(onPaginationChange).toHaveBeenCalledWith({
        pageIndex: 1,
        pageSize: 10,
      });
    });

    it('calls onSortingChange when sorting changes in manual mode', () => {
      const onSortingChange = vi.fn();

      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          manualMode: true,
          onSortingChange,
        })
      );

      act(() => {
        result.current.setSorting([{ id: 'name', desc: false }]);
      });

      expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
    });

    it('calls onColumnFiltersChange when filters change in manual mode', () => {
      const onColumnFiltersChange = vi.fn();

      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          manualMode: true,
          onColumnFiltersChange,
        })
      );

      act(() => {
        result.current.setColumnFilters([{ id: 'role', value: 'Admin' }]);
      });

      expect(onColumnFiltersChange).toHaveBeenCalledWith([
        { id: 'role', value: 'Admin' },
      ]);
    });

    it('calls onGlobalFilterChange when global filter changes in manual mode', () => {
      const onGlobalFilterChange = vi.fn();

      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          manualMode: true,
          onGlobalFilterChange,
        })
      );

      act(() => {
        result.current.setGlobalFilter('search');
      });

      expect(onGlobalFilterChange).toHaveBeenCalledWith('search');
    });

    it('does not call callbacks in client-side mode', () => {
      const onPaginationChange = vi.fn();
      const onSortingChange = vi.fn();

      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          manualMode: false,
          onPaginationChange,
          onSortingChange,
        })
      );

      act(() => {
        result.current.setPagination({ pageIndex: 1, pageSize: 10 });
        result.current.setSorting([{ id: 'name', desc: false }]);
      });

      // Should not be called in client-side mode
      expect(onPaginationChange).not.toHaveBeenCalled();
      expect(onSortingChange).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('updates pagination state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      act(() => {
        result.current.setPagination({ pageIndex: 2, pageSize: 20 });
      });

      expect(result.current.pagination).toEqual({
        pageIndex: 2,
        pageSize: 20,
      });
    });

    it('updates sorting state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      act(() => {
        result.current.setSorting([{ id: 'name', desc: true }]);
      });

      expect(result.current.sorting).toEqual([{ id: 'name', desc: true }]);
    });

    it('updates column filters state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      act(() => {
        result.current.setColumnFilters([{ id: 'role', value: 'Admin' }]);
      });

      expect(result.current.columnFilters).toEqual([{ id: 'role', value: 'Admin' }]);
    });

    it('updates global filter state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      act(() => {
        result.current.setGlobalFilter('test search');
      });

      expect(result.current.globalFilter).toBe('test search');
    });

    it('updates column visibility state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      act(() => {
        result.current.setColumnVisibility({ email: false });
      });

      expect(result.current.columnVisibility).toEqual({ email: false });
    });

    it('updates row selection state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableRowSelection: true,
        })
      );

      act(() => {
        result.current.setRowSelection({ '1': true, '2': true });
      });

      expect(result.current.rowSelection).toEqual({ '1': true, '2': true });
    });
  });

  describe('Reset Functions', () => {
    it('resets pagination to initial values', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialPageIndex: 0,
          initialPageSize: 10,
        })
      );

      act(() => {
        result.current.setPagination({ pageIndex: 5, pageSize: 50 });
      });

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.pagination).toEqual({
        pageIndex: 0,
        pageSize: 10,
      });
    });

    it('resets sorting to initial values', () => {
      const initialSorting = [{ id: 'name', desc: false }];
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialSorting,
        })
      );

      act(() => {
        result.current.setSorting([{ id: 'email', desc: true }]);
      });

      act(() => {
        result.current.resetSorting();
      });

      expect(result.current.sorting).toEqual(initialSorting);
    });

    it('resets filters to initial values', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      act(() => {
        result.current.setColumnFilters([{ id: 'role', value: 'Admin' }]);
        result.current.setGlobalFilter('search');
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.columnFilters).toEqual([]);
      expect(result.current.globalFilter).toBe('');
    });

    it('resets row selection', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableRowSelection: true,
        })
      );

      act(() => {
        result.current.setRowSelection({ '1': true, '2': true });
      });

      act(() => {
        result.current.resetRowSelection();
      });

      expect(result.current.rowSelection).toEqual({});
    });

    it('resets all table state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableRowSelection: true,
        })
      );

      act(() => {
        result.current.setPagination({ pageIndex: 2, pageSize: 20 });
        result.current.setSorting([{ id: 'name', desc: true }]);
        result.current.setColumnFilters([{ id: 'role', value: 'Admin' }]);
        result.current.setGlobalFilter('search');
        result.current.setColumnVisibility({ email: false });
        result.current.setRowSelection({ '1': true });
      });

      act(() => {
        result.current.resetTableState();
      });

      expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 10 });
      expect(result.current.sorting).toEqual([]);
      expect(result.current.columnFilters).toEqual([]);
      expect(result.current.globalFilter).toBe('');
      expect(result.current.columnVisibility).toEqual({});
      expect(result.current.rowSelection).toEqual({});
    });
  });

  describe('Feature Toggles', () => {
    it('disables pagination when enablePagination=false', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enablePagination: false,
        })
      );

      expect(result.current.table.getState().pagination).toBeUndefined();
    });

    it('disables sorting when enableSorting=false', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableSorting: false,
        })
      );

      expect(result.current.table.getState().sorting).toBeUndefined();
    });

    it('disables filtering when enableFiltering=false', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableFiltering: false,
        })
      );

      expect(result.current.table.getState().columnFilters).toBeUndefined();
    });

    it('disables global filter when enableGlobalFilter=false', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableGlobalFilter: false,
        })
      );

      expect(result.current.table.getState().globalFilter).toBeUndefined();
    });

    it('enables row selection when enableRowSelection=true', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableRowSelection: true,
        })
      );

      expect(result.current.table.getState().rowSelection).toBeDefined();
    });
  });

  describe('Loading and Error States', () => {
    it('passes through isLoading state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          isLoading: true,
        })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it('passes through error state', () => {
      const error = new Error('Test error');
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          error,
        })
      );

      expect(result.current.error).toBe(error);
    });

    it('defaults to isLoading=false', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      expect(result.current.isLoading).toBe(false);
    });

    it('defaults to error=null', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
        })
      );

      expect(result.current.error).toBe(null);
    });
  });

  describe('Custom Row ID', () => {
    it('uses custom getRowId function', () => {
      const getRowId = (row: TestUser) => row.id;
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          getRowId,
          enableRowSelection: true,
        })
      );

      // Table should use custom row IDs for selection
      act(() => {
        result.current.setRowSelection({ '1': true });
      });

      expect(result.current.rowSelection).toEqual({ '1': true });
    });
  });

  describe('Callbacks', () => {
    it('calls onRowSelectionChange when selection changes', () => {
      const onRowSelectionChange = vi.fn();

      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableRowSelection: true,
          onRowSelectionChange,
        })
      );

      act(() => {
        result.current.setRowSelection({ '1': true });
      });

      expect(onRowSelectionChange).toHaveBeenCalledWith({ '1': true });
    });

    it('calls onRowSelectionChange in both client and server modes', () => {
      const onRowSelectionChange = vi.fn();

      const { result: clientResult } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          enableRowSelection: true,
          onRowSelectionChange,
        })
      );

      act(() => {
        clientResult.current.setRowSelection({ '1': true });
      });

      expect(onRowSelectionChange).toHaveBeenCalledWith({ '1': true });

      onRowSelectionChange.mockClear();

      const { result: serverResult } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          manualMode: true,
          enableRowSelection: true,
          onRowSelectionChange,
        })
      );

      act(() => {
        serverResult.current.setRowSelection({ '2': true });
      });

      expect(onRowSelectionChange).toHaveBeenCalledWith({ '2': true });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty data array', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: [],
          columns,
        })
      );

      expect(result.current.totalRows).toBe(0);
      expect(result.current.pageCount).toBe(0);
    });

    it('handles single item in data', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: [mockUsers[0]],
          columns,
        })
      );

      expect(result.current.totalRows).toBe(1);
      expect(result.current.pageCount).toBe(1);
    });

    it('handles large datasets', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'User',
      }));

      const { result } = renderHook(() =>
        useDataTable({
          data: largeData,
          columns,
          initialPageSize: 100,
        })
      );

      expect(result.current.totalRows).toBe(10000);
      expect(result.current.pageCount).toBe(100);
    });

    it('recalculates page count when page size changes', () => {
      const { result } = renderHook(() =>
        useDataTable({
          data: mockUsers,
          columns,
          initialPageSize: 2,
        })
      );

      expect(result.current.pageCount).toBe(3);

      act(() => {
        result.current.setPagination({ pageIndex: 0, pageSize: 5 });
      });

      expect(result.current.pageCount).toBe(1);
    });
  });
});
