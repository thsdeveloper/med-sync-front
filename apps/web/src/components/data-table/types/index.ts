/**
 * DataTable Type Definitions
 *
 * Generic TypeScript types for the DataTable component system.
 * These types extend TanStack Table's core types with application-specific features.
 */

import type { ColumnDef, SortingState, ColumnFiltersState, PaginationState } from "@tanstack/react-table";

/**
 * Generic table data type parameter
 * @template TData - The type of data being displayed in the table
 */
export type TableData<TData = unknown> = TData;

/**
 * Extended column definition with custom properties
 * @template TData - The type of data being displayed
 * @template TValue - The type of the column value
 */
export type DataTableColumn<TData = unknown, TValue = unknown> = ColumnDef<TData, TValue> & {
  /**
   * Optional custom class name for the column
   */
  className?: string;

  /**
   * Whether this column should be sortable (default: false)
   */
  enableSorting?: boolean;

  /**
   * Whether this column should be filterable (default: false)
   */
  enableColumnFilter?: boolean;

  /**
   * Whether this column should be hideable (default: true)
   */
  enableHiding?: boolean;
};

/**
 * Table sorting state
 */
export type DataTableSortingState = SortingState;

/**
 * Table filter state
 */
export type DataTableFilterState = ColumnFiltersState;

/**
 * Table pagination configuration
 */
export interface DataTablePagination {
  /**
   * Current page index (0-based)
   */
  pageIndex: number;

  /**
   * Number of rows per page
   */
  pageSize: number;
}

/**
 * Pagination state from TanStack Table
 */
export type DataTablePaginationState = PaginationState;

/**
 * DataTable component props
 * @template TData - The type of data being displayed
 */
export interface DataTableProps<TData> {
  /**
   * Array of data to display in the table
   */
  data: TData[];

  /**
   * Column definitions for the table
   */
  columns: DataTableColumn<TData>[];

  /**
   * Enable pagination (default: true)
   */
  enablePagination?: boolean;

  /**
   * Enable sorting (default: true)
   */
  enableSorting?: boolean;

  /**
   * Enable filtering (default: true)
   */
  enableFiltering?: boolean;

  /**
   * Initial page size (default: 10)
   */
  pageSize?: number;

  /**
   * Page size options for the pagination selector (default: [10, 20, 30, 40, 50])
   */
  pageSizeOptions?: number[];

  /**
   * Show the toolbar with search and filter controls (default: true)
   */
  showToolbar?: boolean;

  /**
   * Placeholder text for the search input (default: "Buscar...")
   */
  searchPlaceholder?: string;

  /**
   * Column ID to use for global search filtering (optional)
   */
  searchColumn?: string;

  /**
   * Loading state (default: false)
   */
  isLoading?: boolean;

  /**
   * Empty state message (default: "Nenhum resultado encontrado.")
   */
  emptyMessage?: string;

  /**
   * Custom class name for the table container
   */
  className?: string;

  /**
   * Callback when row is clicked (optional)
   */
  onRowClick?: (row: TData) => void;
}

/**
 * Column header props for sortable columns
 */
export interface ColumnHeaderProps<TData, TValue> {
  /**
   * TanStack Table column instance
   */
  column: any;

  /**
   * Header title/label
   */
  title: string;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Table pagination component props
 */
export interface TablePaginationProps {
  /**
   * TanStack Table instance
   */
  table: any;

  /**
   * Page size options (default: [10, 20, 30, 40, 50])
   */
  pageSizeOptions?: number[];

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Table toolbar component props
 */
export interface TableToolbarProps {
  /**
   * TanStack Table instance
   */
  table: any;

  /**
   * Placeholder text for search input
   */
  searchPlaceholder?: string;

  /**
   * Column ID to use for global search filtering
   */
  searchColumn?: string;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Additional toolbar actions (optional)
   */
  children?: React.ReactNode;
}
