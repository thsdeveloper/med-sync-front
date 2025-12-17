/**
 * Default Table Configuration
 *
 * This module provides default configurations and options for TanStack Table instances.
 * These defaults ensure consistent behavior across all tables in the application.
 *
 * @module table-config
 */

import type { TableOptions } from '@tanstack/react-table';

/**
 * Default page size options for table pagination.
 * These values appear in the page size selector dropdown.
 */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Default page size (number of rows per page).
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Default pagination configuration.
 */
export const DEFAULT_PAGINATION_CONFIG = {
  pageIndex: 0,
  pageSize: DEFAULT_PAGE_SIZE,
} as const;

/**
 * CSS class names for table elements.
 * These can be customized per table or used as defaults.
 */
export const TABLE_CLASS_NAMES = {
  table: 'w-full caption-bottom text-sm',
  header: 'border-b',
  headerRow: '[&_tr]:border-b',
  headerCell:
    'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
  body: '[&_tr:last-child]:border-0',
  bodyRow:
    'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
  bodyCell: 'p-4 align-middle [&:has([role=checkbox])]:pr-0',
  footer: 'border-t bg-muted/50 font-medium',
  footerRow: '[&_tr]:border-b',
  footerCell: 'p-4 text-left [&:has([role=checkbox])]:pr-0',
  emptyState: 'h-24 text-center text-muted-foreground',
  loading: 'h-24 text-center text-muted-foreground animate-pulse',
} as const;

/**
 * Accessibility labels for table elements.
 * These ensure proper ARIA labeling for screen readers.
 */
export const TABLE_ARIA_LABELS = {
  table: 'Data table',
  sortAscending: 'Sorted ascending',
  sortDescending: 'Sorted descending',
  sortable: 'Toggle sorting',
  selectAll: 'Select all rows',
  selectRow: 'Select row',
  pagination: 'Table pagination',
  previousPage: 'Go to previous page',
  nextPage: 'Go to next page',
  firstPage: 'Go to first page',
  lastPage: 'Go to last page',
  pageInfo: 'Page information',
  pageSizeSelector: 'Rows per page',
  filter: 'Filter table',
  globalSearch: 'Search all columns',
} as const;

/**
 * Default empty state messages.
 */
export const TABLE_EMPTY_MESSAGES = {
  noData: 'Nenhum dado disponível.',
  noResults: 'Nenhum resultado encontrado.',
  loading: 'Carregando dados...',
  error: 'Erro ao carregar dados.',
} as const;

/**
 * Default filter debounce delay in milliseconds.
 * This prevents excessive API calls during typing.
 */
export const DEFAULT_FILTER_DEBOUNCE = 300;

/**
 * Default sorting configuration.
 */
export const DEFAULT_SORTING_CONFIG = {
  enableSorting: true,
  enableMultiSort: false, // Only allow single-column sorting by default
  manualSorting: false, // Client-side sorting by default
  sortDescFirst: false, // Ascending first by default
} as const;

/**
 * Default filtering configuration.
 */
export const DEFAULT_FILTERING_CONFIG = {
  enableFilters: true,
  enableGlobalFilter: true,
  enableColumnFilters: true,
  manualFiltering: false, // Client-side filtering by default
  globalFilterFn: 'includesString' as const,
} as const;

/**
 * Default pagination configuration options.
 */
export const DEFAULT_PAGINATION_OPTIONS = {
  enablePagination: true,
  manualPagination: false, // Client-side pagination by default
  autoResetPageIndex: true, // Reset to first page when data changes
} as const;

/**
 * Default row selection configuration.
 */
export const DEFAULT_ROW_SELECTION_CONFIG = {
  enableRowSelection: false, // Disabled by default
  enableMultiRowSelection: true,
  enableSubRowSelection: false,
} as const;

/**
 * Default column visibility configuration.
 */
export const DEFAULT_COLUMN_VISIBILITY_CONFIG = {
  enableHiding: true,
  enablePinning: false,
  enableColumnResizing: false,
} as const;

/**
 * Default table options that can be extended by individual tables.
 * Use this as a base configuration for all tables.
 *
 * @template TData - The type of data in each row
 * @returns Partial table options object
 *
 * @example
 * ```tsx
 * const table = useReactTable({
 *   ...getDefaultTableOptions<User>(),
 *   data,
 *   columns,
 *   // Override specific options
 *   manualPagination: true,
 * });
 * ```
 */
export function getDefaultTableOptions<TData>(): Partial<
  TableOptions<TData>
> {
  return {
    ...DEFAULT_SORTING_CONFIG,
    ...DEFAULT_FILTERING_CONFIG,
    ...DEFAULT_PAGINATION_OPTIONS,
    ...DEFAULT_ROW_SELECTION_CONFIG,
    ...DEFAULT_COLUMN_VISIBILITY_CONFIG,
    debugTable: process.env.NODE_ENV === 'development',
    debugHeaders: process.env.NODE_ENV === 'development',
    debugColumns: process.env.NODE_ENV === 'development',
  };
}

/**
 * Server-side table options.
 * Use this configuration for tables that fetch data from an API.
 *
 * @template TData - The type of data in each row
 * @returns Partial table options object configured for server-side operations
 *
 * @example
 * ```tsx
 * const table = useReactTable({
 *   ...getServerSideTableOptions<User>(),
 *   data,
 *   columns,
 *   pageCount: Math.ceil(totalRows / pageSize),
 * });
 * ```
 */
export function getServerSideTableOptions<TData>(): Partial<
  TableOptions<TData>
> {
  return {
    ...getDefaultTableOptions<TData>(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  };
}

/**
 * Client-side table options.
 * Use this configuration for tables with all data loaded in memory.
 *
 * @template TData - The type of data in each row
 * @returns Partial table options object configured for client-side operations
 */
export function getClientSideTableOptions<TData>(): Partial<
  TableOptions<TData>
> {
  return {
    ...getDefaultTableOptions<TData>(),
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
  };
}

/**
 * Type for page size options.
 */
export type PageSizeOption = (typeof DEFAULT_PAGE_SIZE_OPTIONS)[number];

/**
 * Validates if a page size is within allowed options.
 *
 * @param pageSize - Page size to validate
 * @returns True if page size is valid
 */
export function isValidPageSize(pageSize: number): pageSize is PageSizeOption {
  return DEFAULT_PAGE_SIZE_OPTIONS.includes(pageSize as PageSizeOption);
}

/**
 * Gets the next valid page size option.
 *
 * @param currentSize - Current page size
 * @returns Next page size option, or current if at maximum
 */
export function getNextPageSize(currentSize: number): PageSizeOption {
  const currentIndex = DEFAULT_PAGE_SIZE_OPTIONS.indexOf(
    currentSize as PageSizeOption
  );

  if (currentIndex === -1 || currentIndex === DEFAULT_PAGE_SIZE_OPTIONS.length - 1) {
    return DEFAULT_PAGE_SIZE_OPTIONS[0];
  }

  return DEFAULT_PAGE_SIZE_OPTIONS[currentIndex + 1];
}

/**
 * Gets the previous valid page size option.
 *
 * @param currentSize - Current page size
 * @returns Previous page size option, or current if at minimum
 */
export function getPreviousPageSize(currentSize: number): PageSizeOption {
  const currentIndex = DEFAULT_PAGE_SIZE_OPTIONS.indexOf(
    currentSize as PageSizeOption
  );

  if (currentIndex === -1 || currentIndex === 0) {
    return DEFAULT_PAGE_SIZE_OPTIONS[DEFAULT_PAGE_SIZE_OPTIONS.length - 1];
  }

  return DEFAULT_PAGE_SIZE_OPTIONS[currentIndex - 1];
}
