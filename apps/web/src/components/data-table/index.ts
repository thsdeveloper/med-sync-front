/**
 * DataTable Component System
 *
 * Export all components and types from the data-table system.
 * This follows the Atomic Design methodology:
 *
 * Atoms (Basic building blocks):
 * - TableCell, TableHeader, TableRow
 *
 * Molecules (Combinations of atoms):
 * - ColumnHeader, TablePagination, TableToolbar
 *
 * Organisms (Complete UI sections):
 * - DataTable
 *
 * Types:
 * - All TypeScript types and interfaces
 */

// Atoms
export { TableCell } from "./atoms/TableCell";
export type { TableCellProps } from "./atoms/TableCell";

export { TableHeader } from "./atoms/TableHeader";
export type { TableHeaderProps } from "./atoms/TableHeader";

export { TableRow } from "./atoms/TableRow";
export type { TableRowProps } from "./atoms/TableRow";

// Molecules
export { ColumnHeader } from "./molecules/ColumnHeader";
export type { ColumnHeaderProps } from "./molecules/ColumnHeader";

export { TablePagination } from "./molecules/TablePagination";
export type { TablePaginationProps } from "./molecules/TablePagination";

export { TableToolbar } from "./molecules/TableToolbar";
export type { TableToolbarProps } from "./molecules/TableToolbar";

// Organisms
export { DataTable } from "./organisms/DataTable";

// Types
export type {
  TableData,
  DataTableColumn,
  DataTableSortingState,
  DataTableFilterState,
  DataTablePagination,
  DataTablePaginationState,
  DataTableProps,
} from "./types";
