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
  getExpandedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type ExpandedState,
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
  enableExpanding = false,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  showToolbar = true,
  searchPlaceholder = "Buscar...",
  searchColumn,
  isLoading = false,
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  onRowClick,
  getSubRows,
  renderExpandedRow,
  expandOnRowClick = false,
}: DataTableProps<TData>) {
  // State management
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
    getSubRows: enableExpanding ? getSubRows : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className={cn("space-y-4", className)} data-testid="data-table">
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
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    clickable={!!onRowClick || (enableExpanding && expandOnRowClick)}
                    onClick={() => {
                      if (enableExpanding && expandOnRowClick) {
                        row.toggleExpanded();
                      } else if (onRowClick) {
                        onRowClick(row.original);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Expanded row content */}
                  {enableExpanding && row.getIsExpanded() && renderExpandedRow && (
                    <ShadcnTableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={columns.length} className="p-0">
                        {renderExpandedRow(row)}
                      </TableCell>
                    </ShadcnTableRow>
                  )}
                </React.Fragment>
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
