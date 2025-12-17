/**
 * ColumnHeader Molecule Component
 *
 * Sortable column header component with sort indicators.
 * This is a molecule in the Atomic Design methodology - combines atoms into a functional unit.
 *
 * Features:
 * - Displays column title
 * - Shows sort direction indicators (↑ ↓)
 * - Handles click to toggle sort direction
 * - Supports both sortable and non-sortable columns
 * - Keyboard accessible
 * - TypeScript typed for type safety
 */

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ColumnHeaderProps<TData, TValue> {
  /**
   * TanStack Table column instance
   */
  column: Column<TData, TValue>;

  /**
   * Header title/label to display
   */
  title: string;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Text alignment (default: left)
   */
  align?: "left" | "center" | "right";
}

/**
 * ColumnHeader component - renders a sortable column header with sort indicators
 *
 * Sort states:
 * - No sort: Shows ArrowUpDown icon (both arrows)
 * - Ascending: Shows ArrowUp icon (↑)
 * - Descending: Shows ArrowDown icon (↓)
 *
 * Click behavior:
 * - First click: Sort ascending
 * - Second click: Sort descending
 * - Third click: Clear sort (back to no sort)
 *
 * @example
 * ```tsx
 * <ColumnHeader column={column} title="Name" />
 * <ColumnHeader column={column} title="Status" align="center" />
 * <ColumnHeader column={column} title="Actions" className="w-24" />
 * ```
 */
export function ColumnHeader<TData, TValue>({
  column,
  title,
  className,
  align = "left",
}: ColumnHeaderProps<TData, TValue>) {
  // Check if column is sortable
  const canSort = column.getCanSort();

  // If not sortable, render simple header
  if (!canSort) {
    return (
      <div
        className={cn(
          "font-medium",
          align === "center" && "text-center",
          align === "right" && "text-right",
          className
        )}
      >
        {title}
      </div>
    );
  }

  // Get current sort direction
  const isSorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-3 h-8 data-[state=open]:bg-accent",
        align === "center" && "mx-auto",
        align === "right" && "ml-auto",
        className
      )}
      onClick={() => column.toggleSorting(isSorted === "asc")}
    >
      <span className="font-medium">{title}</span>
      {isSorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" aria-label="Ordenado decrescente" />
      ) : isSorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" aria-label="Ordenado crescente" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" aria-label="Clique para ordenar" />
      )}
    </Button>
  );
}
