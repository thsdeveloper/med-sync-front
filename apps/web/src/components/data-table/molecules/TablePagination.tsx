/**
 * TablePagination Molecule Component
 *
 * Pagination controls for the DataTable.
 * This is a molecule in the Atomic Design methodology - combines atoms into a functional unit.
 *
 * Features:
 * - Previous/Next page buttons
 * - Page size selector (10, 20, 30, 40, 50 rows per page)
 * - Current page indicator (e.g., "Página 1 de 5")
 * - Total rows counter (e.g., "10 de 100 linhas")
 * - Disabled states when at first/last page
 * - Keyboard accessible
 * - TypeScript typed for type safety
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  /**
   * TanStack Table instance
   */
  table: Table<any>;

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
 * TablePagination component - renders pagination controls for the DataTable
 *
 * @example
 * ```tsx
 * <TablePagination table={table} />
 * <TablePagination table={table} pageSizeOptions={[5, 10, 25, 50]} />
 * ```
 */
export function TablePagination({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
}: TablePaginationProps) {
  // Get pagination state
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const totalPages = table.getPageCount();

  // Calculate visible rows range
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      {/* Left side: Page size selector */}
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Linhas por página</p>
        <Select
          value={`${pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Center: Current page and row count */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center justify-center text-sm font-medium">
          {totalRows > 0 ? (
            <>
              Mostrando {startRow} a {endRow} de {totalRows} linha{totalRows !== 1 ? "s" : ""}
            </>
          ) : (
            <>Nenhuma linha encontrada</>
          )}
        </div>
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-center text-sm font-medium">
          Página {totalPages > 0 ? pageIndex + 1 : 0} de {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
