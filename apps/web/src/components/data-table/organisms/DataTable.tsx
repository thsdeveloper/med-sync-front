/**
 * DataTable Organism Component
 *
 * Reusable data table component with TanStack Table integration.
 * This is an organism in the Atomic Design methodology - combines molecules and atoms into a complete UI section.
 *
 * Features:
 * - TanStack Table v8 integration for advanced table features
 * - Sortable columns with visual indicators
 * - Pagination with page size selector
 * - Global search/filtering
 * - Loading states
 * - Empty states
 * - Clickable rows (optional)
 * - Responsive design
 * - Full TypeScript type safety with generics
 *
 * Architecture:
 * - Uses atoms: TableCell, TableHeader, TableRow
 * - Uses molecules: ColumnHeader, TablePagination, TableToolbar
 * - Implements TanStack Table hooks for state management
 */

"use client";

import React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from "@/components/ui/table";
import { TableCell } from "../atoms/TableCell";
import { TableRow } from "../atoms/TableRow";
import { TablePagination } from "../molecules/TablePagination";
import { TableToolbar } from "../molecules/TableToolbar";
import type { DataTableProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * DataTable component - renders a fully-featured data table with sorting, filtering, and pagination
 *
 * @template TData - The type of data being displayed in the table
 *
 * @example
 * ```tsx
 * // Define your data type
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 *   role: string;
 * }
 *
 * // Define columns
 * const columns: DataTableColumn<User>[] = [
 *   {
 *     accessorKey: "name",
 *     header: ({ column }) => <ColumnHeader column={column} title="Nome" />,
 *     enableSorting: true,
 *   },
 *   {
 *     accessorKey: "email",
 *     header: "Email",
 *   },
 *   {
 *     accessorKey: "role",
 *     header: ({ column }) => <ColumnHeader column={column} title="Função" />,
 *     enableSorting: true,
 *   },
 * ];
 *
 * // Use the DataTable
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   searchColumn="name"
 *   searchPlaceholder="Buscar por nome..."
 *   onRowClick={(user) => console.log(user)}
 * />
 * ```
 */
export function DataTable<TData>({
  data,
  columns,
  enablePagination = true,
  enableSorting = true,
  enableFiltering = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  showToolbar = true,
  searchPlaceholder = "Buscar...",
  searchColumn,
  isLoading = false,
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  onRowClick,
}: DataTableProps<TData>) {
  // State management
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar with search and actions */}
      {showToolbar && (
        <TableToolbar
          table={table}
          searchPlaceholder={searchPlaceholder}
          searchColumn={searchColumn}
        />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          {/* Table Header */}
          <ShadcnTableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <ShadcnTableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </ShadcnTableRow>
            ))}
          </ShadcnTableHeader>

          {/* Table Body */}
          <TableBody>
            {/* Loading state */}
            {isLoading ? (
              <ShadcnTableRow>
                <TableCell colSpan={columns.length} align="center" className="h-24">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                  </div>
                </TableCell>
              </ShadcnTableRow>
            ) : table.getRowModel().rows?.length ? (
              // Render rows
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  clickable={!!onRowClick}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty state
              <ShadcnTableRow>
                <TableCell colSpan={columns.length} align="center" className="h-24">
                  <div className="text-muted-foreground">{emptyMessage}</div>
                </TableCell>
              </ShadcnTableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && !isLoading && table.getRowModel().rows?.length > 0 && (
        <TablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}
