/**
 * TableRow Atom Component
 *
 * Table row component that wraps shadcn/ui TableRow.
 * This is an atom in the Atomic Design methodology - a basic building block.
 *
 * Features:
 * - Extends shadcn/ui TableRow with additional props
 * - Supports hover states
 * - Supports clickable rows
 * - Supports selection states
 * - TypeScript typed for type safety
 */

import React from "react";
import { TableRow as ShadcnTableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Row content (TableCell components)
   */
  children?: React.ReactNode;

  /**
   * Whether the row is selected (default: false)
   */
  selected?: boolean;

  /**
   * Whether the row is clickable (default: false)
   */
  clickable?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Click handler for the row
   */
  onClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
}

/**
 * TableRow component - renders a table row with optional interactivity
 *
 * @example
 * ```tsx
 * <TableRow>
 *   <TableCell>Content</TableCell>
 * </TableRow>
 *
 * <TableRow clickable onClick={handleClick}>
 *   <TableCell>Clickable Row</TableCell>
 * </TableRow>
 *
 * <TableRow selected>
 *   <TableCell>Selected Row</TableCell>
 * </TableRow>
 * ```
 */
export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, selected = false, clickable = false, className, onClick, ...props }, ref) => {
    return (
      <ShadcnTableRow
        ref={ref}
        data-state={selected ? "selected" : undefined}
        className={cn(
          clickable && "cursor-pointer",
          selected && "bg-muted",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </ShadcnTableRow>
    );
  }
);

TableRow.displayName = "TableRow";
