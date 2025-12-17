/**
 * TableCell Atom Component
 *
 * Basic table cell component that wraps shadcn/ui TableCell.
 * This is an atom in the Atomic Design methodology - a basic building block.
 *
 * Features:
 * - Extends shadcn/ui TableCell with additional props
 * - Supports custom className for styling
 * - Supports align prop for text alignment
 * - TypeScript typed for type safety
 */

import React from "react";
import { TableCell as ShadcnTableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Cell content
   */
  children?: React.ReactNode;

  /**
   * Text alignment (default: left)
   */
  align?: "left" | "center" | "right";

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * TableCell component - renders a table data cell
 *
 * @example
 * ```tsx
 * <TableCell align="center">Content</TableCell>
 * <TableCell className="font-bold">Bold Content</TableCell>
 * ```
 */
export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, align = "left", className, ...props }, ref) => {
    return (
      <ShadcnTableCell
        ref={ref}
        className={cn(
          align === "center" && "text-center",
          align === "right" && "text-right",
          className
        )}
        {...props}
      >
        {children}
      </ShadcnTableCell>
    );
  }
);

TableCell.displayName = "TableCell";
