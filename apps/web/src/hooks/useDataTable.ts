/**
 * useDataTable Hook
 *
 * A custom React hook that encapsulates common TanStack Table logic with TypeScript generics.
 * Supports both client-side and server-side data management, with built-in state management
 * for sorting, filtering, pagination, and row selection.
 *
 * @module useDataTable
 * @see https://tanstack.com/table/v8/docs/guide/introduction
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
  type Table,
} from '@tanstack/react-table';
import {
  getDefaultTableOptions,
  getServerSideTableOptions,
  getClientSideTableOptions,
  DEFAULT_PAGE_SIZE,
} from '@/config/table-config';

/**
 * Configuration options for useDataTable hook.
 *
 * @template TData - The type of data in each row
 */
export interface UseDataTableOptions<TData> {
  /** Table data array */
  data: TData[];

  /** Column definitions */
  columns: ColumnDef<TData>[];

  /** Enable server-side data management (pagination, sorting, filtering) */
  manualMode?: boolean;

  /** Total number of rows (required for server-side pagination) */
  totalRows?: number;

  /** Total number of pages (alternative to totalRows for server-side pagination) */
  pageCount?: number;

  /** Initial page size */
  initialPageSize?: number;

  /** Initial page index (0-based) */
  initialPageIndex?: number;

  /** Enable pagination (default: true) */
  enablePagination?: boolean;

  /** Enable sorting (default: true) */
  enableSorting?: boolean;

  /** Enable filtering (default: true) */
  enableFiltering?: boolean;

  /** Enable global filter/search (default: true) */
  enableGlobalFilter?: boolean;

  /** Enable row selection (default: false) */
  enableRowSelection?: boolean;

  /** Enable multi-row selection (default: true) */
  enableMultiRowSelection?: boolean;

  /** Enable column visibility toggling (default: true) */
  enableColumnVisibility?: boolean;

  /** Initial sorting state */
  initialSorting?: SortingState;

  /** Initial column filters */
  initialColumnFilters?: ColumnFiltersState;

  /** Initial global filter value */
  initialGlobalFilter?: string;

  /** Initial column visibility state */
  initialColumnVisibility?: VisibilityState;

  /** Callback when pagination state changes (for server-side pagination) */
  onPaginationChange?: (pagination: PaginationState) => void;

  /** Callback when sorting state changes (for server-side sorting) */
  onSortingChange?: (sorting: SortingState) => void;

  /** Callback when column filters change (for server-side filtering) */
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;

  /** Callback when global filter changes (for server-side search) */
  onGlobalFilterChange?: (filter: string) => void;

  /** Callback when row selection changes */
  onRowSelectionChange?: (selection: RowSelectionState) => void;

  /** Loading state (useful for server-side tables) */
  isLoading?: boolean;

  /** Error state */
  error?: Error | null;

  /** Custom row ID accessor (default: 'id') */
  getRowId?: (row: TData, index: number) => string;
}

/**
 * Return value from useDataTable hook.
 *
 * @template TData - The type of data in each row
 */
export interface UseDataTableResult<TData> {
  /** TanStack Table instance */
  table: Table<TData>;

  /** Current pagination state */
  pagination: PaginationState;

  /** Update pagination state */
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;

  /** Current sorting state */
  sorting: SortingState;

  /** Update sorting state */
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;

  /** Current column filters */
  columnFilters: ColumnFiltersState;

  /** Update column filters */
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;

  /** Current global filter */
  globalFilter: string;

  /** Update global filter */
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;

  /** Current column visibility */
  columnVisibility: VisibilityState;

  /** Update column visibility */
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;

  /** Current row selection */
  rowSelection: RowSelectionState;

  /** Update row selection */
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Total number of rows */
  totalRows: number;

  /** Total number of pages */
  pageCount: number;

  /** Reset all table state to initial values */
  resetTableState: () => void;

  /** Reset pagination to first page */
  resetPagination: () => void;

  /** Reset sorting to initial state */
  resetSorting: () => void;

  /** Reset filters to initial state */
  resetFilters: () => void;

  /** Reset row selection */
  resetRowSelection: () => void;
}

/**
 * Custom hook for managing TanStack Table state and configuration.
 * Provides a unified interface for both client-side and server-side tables.
 *
 * @template TData - The type of data in each row
 * @param options - Configuration options
 * @returns Table instance and state management utilities
 *
 * @example
 * ```tsx
 * // Client-side table
 * const { table } = useDataTable({
 *   data: users,
 *   columns: userColumns,
 * });
 *
 * // Server-side table
 * const { table, pagination, sorting } = useDataTable({
 *   data: users,
 *   columns: userColumns,
 *   manualMode: true,
 *   totalRows: totalCount,
 *   onPaginationChange: (newPagination) => {
 *     fetchUsers({ page: newPagination.pageIndex + 1, limit: newPagination.pageSize });
 *   },
 *   onSortingChange: (newSorting) => {
 *     fetchUsers({ sortBy: newSorting[0]?.id, sortOrder: newSorting[0]?.desc ? 'desc' : 'asc' });
 *   },
 * });
 * ```
 */
export function useDataTable<TData>({
  data,
  columns,
  manualMode = false,
  totalRows,
  pageCount: externalPageCount,
  initialPageSize = DEFAULT_PAGE_SIZE,
  initialPageIndex = 0,
  enablePagination = true,
  enableSorting = true,
  enableFiltering = true,
  enableGlobalFilter = true,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  enableColumnVisibility = true,
  initialSorting = [],
  initialColumnFilters = [],
  initialGlobalFilter = '',
  initialColumnVisibility = {},
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
  onGlobalFilterChange,
  onRowSelectionChange,
  isLoading = false,
  error = null,
  getRowId,
}: UseDataTableOptions<TData>): UseDataTableResult<TData> {
  // State management
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
  });

  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialColumnFilters);
  const [globalFilter, setGlobalFilter] = useState<string>(initialGlobalFilter);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Calculate page count for pagination
  const calculatedPageCount = useMemo(() => {
    if (externalPageCount !== undefined) {
      return externalPageCount;
    }
    if (totalRows !== undefined) {
      return Math.ceil(totalRows / pagination.pageSize);
    }
    return Math.ceil(data.length / pagination.pageSize);
  }, [externalPageCount, totalRows, pagination.pageSize, data.length]);

  // Calculate total rows
  const calculatedTotalRows = useMemo(() => {
    if (totalRows !== undefined) {
      return totalRows;
    }
    return data.length;
  }, [totalRows, data.length]);

  // Notify external handlers when state changes (for server-side tables)
  useEffect(() => {
    if (manualMode && onPaginationChange) {
      onPaginationChange(pagination);
    }
  }, [pagination, manualMode, onPaginationChange]);

  useEffect(() => {
    if (manualMode && onSortingChange) {
      onSortingChange(sorting);
    }
  }, [sorting, manualMode, onSortingChange]);

  useEffect(() => {
    if (manualMode && onColumnFiltersChange) {
      onColumnFiltersChange(columnFilters);
    }
  }, [columnFilters, manualMode, onColumnFiltersChange]);

  useEffect(() => {
    if (manualMode && onGlobalFilterChange) {
      onGlobalFilterChange(globalFilter);
    }
  }, [globalFilter, manualMode, onGlobalFilterChange]);

  useEffect(() => {
    if (onRowSelectionChange) {
      onRowSelectionChange(rowSelection);
    }
  }, [rowSelection, onRowSelectionChange]);

  // Select appropriate base options based on manual mode
  const baseOptions = useMemo(() => {
    return manualMode
      ? getServerSideTableOptions<TData>()
      : getClientSideTableOptions<TData>();
  }, [manualMode]);

  // Create table instance
  const table = useReactTable<TData>({
    data,
    columns,
    ...baseOptions,
    pageCount: manualMode ? calculatedPageCount : undefined,
    state: {
      pagination: enablePagination ? pagination : undefined,
      sorting: enableSorting ? sorting : undefined,
      columnFilters: enableFiltering ? columnFilters : undefined,
      globalFilter: enableGlobalFilter ? globalFilter : undefined,
      columnVisibility: enableColumnVisibility ? columnVisibility : undefined,
      rowSelection: enableRowSelection ? rowSelection : undefined,
    },
    onPaginationChange: enablePagination ? setPagination : undefined,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onGlobalFilterChange: enableGlobalFilter ? setGlobalFilter : undefined,
    onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting && !manualMode ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering && !manualMode ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination && !manualMode ? getPaginationRowModel() : undefined,
    enableRowSelection,
    enableMultiRowSelection,
    getRowId,
  });

  // Reset functions
  const resetPagination = useCallback(() => {
    setPagination({
      pageIndex: initialPageIndex,
      pageSize: initialPageSize,
    });
  }, [initialPageIndex, initialPageSize]);

  const resetSorting = useCallback(() => {
    setSorting(initialSorting);
  }, [initialSorting]);

  const resetFilters = useCallback(() => {
    setColumnFilters(initialColumnFilters);
    setGlobalFilter(initialGlobalFilter);
  }, [initialColumnFilters, initialGlobalFilter]);

  const resetRowSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const resetTableState = useCallback(() => {
    resetPagination();
    resetSorting();
    resetFilters();
    resetRowSelection();
    setColumnVisibility(initialColumnVisibility);
  }, [
    resetPagination,
    resetSorting,
    resetFilters,
    resetRowSelection,
    initialColumnVisibility,
  ]);

  return {
    table,
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    globalFilter,
    setGlobalFilter,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
    isLoading,
    error,
    totalRows: calculatedTotalRows,
    pageCount: calculatedPageCount,
    resetTableState,
    resetPagination,
    resetSorting,
    resetFilters,
    resetRowSelection,
  };
}
