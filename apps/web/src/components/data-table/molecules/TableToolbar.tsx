/**
 * TableToolbar Molecule Component
 *
 * Toolbar with search and filter controls for the DataTable.
 * This is a molecule in the Atomic Design methodology - combines atoms into a functional unit.
 *
 * Features:
 * - Global search input with debouncing
 * - Clear filters button
 * - Custom action buttons slot
 * - Responsive layout
 * - TypeScript typed for type safety
 */

import React from "react";
import { X } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TableToolbarProps {
  /**
   * TanStack Table instance
   */
  table: Table<any>;

  /**
   * Placeholder text for search input (default: "Buscar...")
   */
  searchPlaceholder?: string;

  /**
   * Column ID to use for global search filtering
   * If not provided, search will be disabled
   */
  searchColumn?: string;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Additional toolbar actions (optional)
   * Render custom buttons or controls here
   */
  children?: React.ReactNode;
}

/**
 * TableToolbar component - renders search and filter controls for the DataTable
 *
 * @example
 * ```tsx
 * <TableToolbar
 *   table={table}
 *   searchColumn="name"
 *   searchPlaceholder="Buscar por nome..."
 * />
 *
 * <TableToolbar table={table} searchColumn="name">
 *   <Button variant="outline">Export</Button>
 *   <Button>Add New</Button>
 * </TableToolbar>
 * ```
 */
export function TableToolbar({
  table,
  searchPlaceholder = "Buscar...",
  searchColumn,
  className,
  children,
}: TableToolbarProps) {
  // Check if any filters are applied
  const isFiltered = table.getState().columnFilters.length > 0;

  // Get the search column
  const column = searchColumn ? table.getColumn(searchColumn) : undefined;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex flex-1 items-center space-x-2">
        {/* Search input - only show if searchColumn is provided */}
        {searchColumn && column && (
          <Input
            placeholder={searchPlaceholder}
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}

        {/* Clear filters button - only show if filters are applied */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Limpar filtros
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Custom action buttons slot */}
      {children && <div className="flex items-center space-x-2">{children}</div>}
    </div>
  );
}
