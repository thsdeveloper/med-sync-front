/**
 * TableHeader Atom Component
 *
 * Table header cell component that wraps shadcn/ui TableHead.
 * This is an atom in the Atomic Design methodology - a basic building block.
 *
 * Features:
 * - Extends shadcn/ui TableHead with additional props
 * - Supports custom className for styling
 * - Supports align prop for text alignment
 * - Proper accessibility with scope attribute
 * - TypeScript typed for type safety
 */

import React from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Header content
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
 * TableHeader component - renders a table header cell
 *
 * @example
 * ```tsx
 * <TableHeader>Name</TableHeader>
 * <TableHeader align="center">Status</TableHeader>
 * <TableHeader className="w-24">Actions</TableHeader>
 * ```
 */
export const TableHeader = React.forwardRef<HTMLTableCellElement, TableHeaderProps>(
  ({ children, align = "left", className, ...props }, ref) => {
    return (
      <TableHead
        ref={ref}
        className={cn(
          align === "center" && "text-center",
          align === "right" && "text-right",
          className
        )}
        {...props}
      >
        {children}
      </TableHead>
    );
  }
);

TableHeader.displayName = "TableHeader";
