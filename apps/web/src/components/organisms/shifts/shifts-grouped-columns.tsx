/**
 * Grouped Shifts Table Column Definitions
 *
 * TanStack Table column definitions for the Grouped Shifts (Lista de Escalas por Profissional) data table.
 * Defines columns for the main staff rows with expandable shift details.
 *
 * Features:
 * - Expand/collapse indicator
 * - Staff name with specialty
 * - Total shifts count with status breakdown
 * - Date range for shifts
 * - Sortable columns
 */

"use client";

import React from "react";
import { ChevronDown, ChevronRight, User, Calendar, CheckCircle2, Clock, XCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { GroupedShiftsByStaff } from "./shifts-grouped-types";
import type { DataTableColumn } from "@/components/data-table/types";
import { ColumnHeader } from "@/components/data-table/molecules/ColumnHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Helper to format date
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Creates column definitions for the Grouped Shifts table
 *
 * @param onDeleteAll - Callback function when delete all action is triggered
 * @returns Array of column definitions for TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getGroupedShiftsColumns({
 *   onDeleteAll: (group) => console.log("Delete all shifts for", group.doctor_name),
 * });
 *
 * <DataTable
 *   data={groupedData}
 *   columns={columns}
 *   enableExpanding={true}
 *   expandOnRowClick={true}
 * />
 * ```
 */
export function getGroupedShiftsColumns({
  onDeleteAll,
}: {
  onDeleteAll: (group: GroupedShiftsByStaff) => void;
}): DataTableColumn<GroupedShiftsByStaff>[] {
  return [
    // Expand/Collapse column
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            data-testid="expand-row-button"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    // Profissional column - sortable
    {
      accessorKey: "doctor_name",
      header: ({ column }) => <ColumnHeader column={column} title="Profissional" />,
      cell: ({ row }) => {
        const data = row.original;
        const isUnassigned = data.id === "unassigned";

        return (
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                isUnassigned ? "bg-slate-100" : "bg-blue-50"
              }`}
            >
              <User
                className={`h-4 w-4 ${
                  isUnassigned ? "text-slate-400" : "text-blue-600"
                }`}
              />
            </div>
            <div>
              <div
                className={`font-medium ${
                  isUnassigned ? "text-slate-400 italic" : "text-slate-900"
                }`}
              >
                {data.doctor_name}
              </div>
              {data.specialty && (
                <div className="text-xs text-slate-500">
                  {data.specialty.charAt(0).toUpperCase() + data.specialty.slice(1)}
                </div>
              )}
            </div>
          </div>
        );
      },
      enableSorting: true,
    },

    // Total Escalas column - sortable
    {
      accessorKey: "total_shifts",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Total de Escalas" align="center" />
      ),
      cell: ({ row }) => {
        const total = row.original.total_shifts;
        return (
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 bg-slate-100 rounded-full text-sm font-semibold text-slate-700">
              {total}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },

    // Status breakdown column
    {
      id: "status_breakdown",
      header: "Status das Escalas",
      cell: ({ row }) => {
        const { pending_count, accepted_count, declined_count } = row.original;

        return (
          <TooltipProvider>
            <div className="flex items-center gap-2">
              {/* Accepted */}
              {accepted_count > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-medium text-green-700">
                        {accepted_count}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{accepted_count} escala(s) aceita(s)</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Pending */}
              {pending_count > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 rounded-full">
                      <Clock className="h-3.5 w-3.5 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-700">
                        {pending_count}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{pending_count} escala(s) pendente(s)</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Declined */}
              {declined_count > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 rounded-full">
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-xs font-medium text-red-700">
                        {declined_count}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{declined_count} escala(s) recusada(s)</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Show dash if all counts are 0 */}
              {pending_count === 0 && accepted_count === 0 && declined_count === 0 && (
                <span className="text-slate-400">-</span>
              )}
            </div>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },

    // Período column - date range
    {
      id: "date_range",
      header: ({ column }) => <ColumnHeader column={column} title="Período" />,
      cell: ({ row }) => {
        const { earliest_date, latest_date } = row.original;

        if (!earliest_date && !latest_date) {
          return <span className="text-slate-400">-</span>;
        }

        return (
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {earliest_date === latest_date ? (
              <span>{formatDate(earliest_date)}</span>
            ) : (
              <span>
                {formatDate(earliest_date)} - {formatDate(latest_date)}
              </span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },

    // Actions column - delete all shifts
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const group = row.original;
        const isUnassigned = group.id === "unassigned";

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                  data-testid="group-actions-menu"
                >
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAll(group);
                  }}
                  data-testid="delete-all-action"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir todas ({group.total_shifts})
                  {!isUnassigned && ` de ${group.doctor_name.split(" ")[0]}`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
