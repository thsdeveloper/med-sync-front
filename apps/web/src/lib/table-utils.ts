/**
 * Table Utilities for TanStack Table Integration
 *
 * This module provides utility functions and helpers for working with TanStack Table v8.
 * It includes column helpers, state management utilities, and common table operations.
 *
 * @module table-utils
 * @see https://tanstack.com/table/v8/docs/guide/introduction
 */

import { createColumnHelper as tanstackCreateColumnHelper, type ColumnDef } from '@tanstack/react-table';

/**
 * Table State Configuration
 * Defines the structure for table state management including sorting, filtering, and pagination.
 */
export interface TableState {
  /** Current page index (0-based) */
  pageIndex: number;
  /** Number of rows per page */
  pageSize: number;
  /** Current sorting configuration */
  sorting: SortingState;
  /** Current filter values */
  columnFilters: ColumnFilter[];
  /** Global filter value (search across all columns) */
  globalFilter: string;
  /** Row selection state (row IDs mapped to boolean) */
  rowSelection: Record<string, boolean>;
}

/**
 * Sorting State - array of column sorts
 */
export type SortingState = Array<{
  /** Column ID to sort by */
  id: string;
  /** Sort direction */
  desc: boolean;
}>;

/**
 * Column Filter Configuration
 */
export interface ColumnFilter {
  /** Column ID to filter */
  id: string;
  /** Filter value */
  value: unknown;
}

/**
 * Pagination Configuration
 */
export interface PaginationState {
  /** Current page index (0-based) */
  pageIndex: number;
  /** Number of rows per page */
  pageSize: number;
}

/**
 * Creates a type-safe column helper for defining table columns.
 * This is a wrapper around TanStack Table's createColumnHelper with better TypeScript inference.
 *
 * @template TData - The type of data in each row
 * @returns A column helper instance for creating column definitions
 *
 * @example
 * ```tsx
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * const columnHelper = createColumnHelper<User>();
 *
 * const columns = [
 *   columnHelper.accessor('name', {
 *     header: 'Name',
 *     cell: info => info.getValue(),
 *   }),
 *   columnHelper.accessor('email', {
 *     header: 'Email',
 *   }),
 * ];
 * ```
 */
export function createColumnHelper<TData>() {
  return tanstackCreateColumnHelper<TData>();
}

/**
 * Returns default table state configuration.
 * Use this as a starting point for table state management.
 *
 * @param overrides - Optional state overrides
 * @returns Default table state object
 *
 * @example
 * ```tsx
 * const [tableState, setTableState] = useState(
 *   getDefaultTableState({ pageSize: 25 })
 * );
 * ```
 */
export function getDefaultTableState(
  overrides?: Partial<TableState>
): TableState {
  return {
    pageIndex: 0,
    pageSize: 10,
    sorting: [],
    columnFilters: [],
    globalFilter: '',
    rowSelection: {},
    ...overrides,
  };
}

/**
 * Returns default pagination state.
 *
 * @param overrides - Optional pagination overrides
 * @returns Default pagination state object
 */
export function getDefaultPaginationState(
  overrides?: Partial<PaginationState>
): PaginationState {
  return {
    pageIndex: 0,
    pageSize: 10,
    ...overrides,
  };
}

/**
 * Calculates the range of items being displayed (e.g., "1-10 of 100").
 * Useful for displaying pagination information to users.
 *
 * @param pageIndex - Current page index (0-based)
 * @param pageSize - Number of rows per page
 * @param totalRows - Total number of rows
 * @returns Object with start, end, and total values
 *
 * @example
 * ```tsx
 * const range = getPaginationRange(0, 10, 50);
 * // { start: 1, end: 10, total: 50 }
 * console.log(`Showing ${range.start}-${range.end} of ${range.total}`);
 * ```
 */
export function getPaginationRange(
  pageIndex: number,
  pageSize: number,
  totalRows: number
): { start: number; end: number; total: number } {
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return {
    start,
    end,
    total: totalRows,
  };
}

/**
 * Calculates the total number of pages based on row count and page size.
 *
 * @param totalRows - Total number of rows
 * @param pageSize - Number of rows per page
 * @returns Total number of pages
 */
export function getTotalPages(totalRows: number, pageSize: number): number {
  return Math.ceil(totalRows / pageSize);
}

/**
 * Checks if a given page index is valid.
 *
 * @param pageIndex - Page index to validate (0-based)
 * @param totalRows - Total number of rows
 * @param pageSize - Number of rows per page
 * @returns True if page index is valid
 */
export function isValidPageIndex(
  pageIndex: number,
  totalRows: number,
  pageSize: number
): boolean {
  if (pageIndex < 0) return false;
  const totalPages = getTotalPages(totalRows, pageSize);
  return pageIndex < totalPages;
}

/**
 * Server-side sorting handler that generates sort parameters.
 * Converts TanStack Table sorting state to API-compatible format.
 *
 * @param sorting - Current sorting state from TanStack Table
 * @returns Sort parameters object (column and direction)
 *
 * @example
 * ```tsx
 * const sortParams = handleServerSideSort(table.getState().sorting);
 * // { sortBy: 'name', sortOrder: 'desc' }
 *
 * // Use in API call
 * const data = await fetchData({ ...sortParams });
 * ```
 */
export function handleServerSideSort(
  sorting: Array<{ id: string; desc: boolean }>
): { sortBy: string | null; sortOrder: 'asc' | 'desc' | null } {
  if (!sorting.length) {
    return { sortBy: null, sortOrder: null };
  }

  const { id, desc } = sorting[0]; // Only support single-column sorting for now
  return {
    sortBy: id,
    sortOrder: desc ? 'desc' : 'asc',
  };
}

/**
 * Server-side filter handler that generates filter parameters.
 * Converts TanStack Table filter state to API-compatible format.
 *
 * @param columnFilters - Current column filters from TanStack Table
 * @param globalFilter - Global filter value (search across all columns)
 * @returns Filter parameters object
 *
 * @example
 * ```tsx
 * const filterParams = handleServerSideFilter(
 *   table.getState().columnFilters,
 *   table.getState().globalFilter
 * );
 *
 * const data = await fetchData({ ...filterParams });
 * ```
 */
export function handleServerSideFilter(
  columnFilters: Array<{ id: string; value: unknown }>,
  globalFilter?: string
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  // Add column-specific filters
  columnFilters.forEach(filter => {
    filters[filter.id] = filter.value;
  });

  // Add global filter if present
  if (globalFilter) {
    filters.search = globalFilter;
  }

  return filters;
}

/**
 * Server-side pagination handler that generates pagination parameters.
 * Converts TanStack Table pagination state to API-compatible format.
 *
 * @param pagination - Current pagination state from TanStack Table
 * @returns Pagination parameters object (page and limit)
 *
 * @example
 * ```tsx
 * const paginationParams = handleServerSidePagination({
 *   pageIndex: 2,
 *   pageSize: 20
 * });
 * // { page: 3, limit: 20 } (1-based page for API)
 *
 * const data = await fetchData({ ...paginationParams });
 * ```
 */
export function handleServerSidePagination(
  pagination: PaginationState
): { page: number; limit: number } {
  return {
    page: pagination.pageIndex + 1, // Convert to 1-based for API
    limit: pagination.pageSize,
  };
}

/**
 * Combines server-side table parameters into a single object.
 * Useful for constructing API query parameters.
 *
 * @param sorting - Current sorting state
 * @param columnFilters - Current column filters
 * @param pagination - Current pagination state
 * @param globalFilter - Optional global filter value
 * @returns Combined query parameters object
 *
 * @example
 * ```tsx
 * const queryParams = getServerSideTableParams(
 *   table.getState().sorting,
 *   table.getState().columnFilters,
 *   table.getState().pagination,
 *   table.getState().globalFilter
 * );
 *
 * const { data } = await api.get('/users', { params: queryParams });
 * ```
 */
export function getServerSideTableParams(
  sorting: Array<{ id: string; desc: boolean }>,
  columnFilters: Array<{ id: string; value: unknown }>,
  pagination: PaginationState,
  globalFilter?: string
): Record<string, unknown> {
  return {
    ...handleServerSidePagination(pagination),
    ...handleServerSideSort(sorting),
    ...handleServerSideFilter(columnFilters, globalFilter),
  };
}

/**
 * Type guard to check if a value is a valid column filter.
 *
 * @param value - Value to check
 * @returns True if value is a valid ColumnFilter
 */
export function isColumnFilter(value: unknown): value is ColumnFilter {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'value' in value
  );
}

/**
 * Type guard to check if a value is a valid sorting state.
 *
 * @param value - Value to check
 * @returns True if value is a valid SortingState
 */
export function isSortingState(value: unknown): value is SortingState {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'desc' in item &&
        typeof item.desc === 'boolean'
    )
  );
}

/**
 * Debounce utility for table filtering.
 * Delays execution of filter updates to reduce API calls during typing.
 *
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds (default: 300ms)
 * @returns Debounced function
 *
 * @example
 * ```tsx
 * const debouncedFilter = debounce((value: string) => {
 *   table.setGlobalFilter(value);
 * }, 500);
 *
 * <input onChange={(e) => debouncedFilter(e.target.value)} />
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
