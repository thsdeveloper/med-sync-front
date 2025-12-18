/**
 * Fixed Schedule Table Column Definitions
 *
 * TanStack Table column definitions for the Fixed Schedules (Escalas Fixas) data table.
 * Defines columns for displaying recurring schedule templates.
 *
 * Features:
 * - Staff name with color indicator and specialty
 * - Facility and sector info
 * - Shift type with time range
 * - Weekday badges
 * - Duration and status badges
 * - Generate shifts button
 * - Actions dropdown (view, edit, delete)
 */

"use client";

import React from "react";
import {
  Building2,
  Clock,
  Calendar,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import type { DataTableColumn } from "@/components/data-table/types";
import { ColumnHeader } from "@/components/data-table/molecules/ColumnHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SHIFT_TYPE_LABELS,
  SHIFT_TYPE_TIMES,
  formatWeekdays,
  formatDuration,
  type DurationType,
} from "@medsync/shared";
import { UserAvatar } from "@/components/atoms";

/**
 * Type for fixed schedule with relations (matches the query in page.tsx)
 */
export interface FixedScheduleWithRelations {
  id: string;
  organization_id: string;
  facility_id: string;
  staff_id: string;
  sector_id: string | null;
  shift_type: string;
  duration_type: string;
  start_date: string;
  end_date: string | null;
  weekdays: number[];
  active: boolean | null;
  created_at: string | null;
  updated_at?: string | null;
  facilities: {
    id: string;
    name: string;
    type?: string;
  } | null;
  medical_staff: {
    id: string;
    name: string;
    color: string | null;
    avatar_url?: string | null;
    profissao?: {
      id: string;
      nome: string;
    } | null;
  } | null;
  sectors: {
    id: string;
    name: string;
  } | null;
}

/**
 * Weekday short labels for badges
 */
const WEEKDAY_SHORT_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

/**
 * Callbacks for column actions
 */
interface FixedScheduleColumnsCallbacks {
  onViewDetails: (schedule: FixedScheduleWithRelations) => void;
  onEdit: (schedule: FixedScheduleWithRelations) => void;
  onDelete: (schedule: FixedScheduleWithRelations) => void;
  onGenerateShifts: (schedule: FixedScheduleWithRelations) => void;
}

/**
 * Creates column definitions for the Fixed Schedules table
 *
 * @param callbacks - Object containing callback functions for actions
 * @returns Array of column definitions for TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getFixedScheduleColumns({
 *   onViewDetails: (schedule) => console.log("View", schedule.id),
 *   onEdit: (schedule) => console.log("Edit", schedule.id),
 *   onDelete: (schedule) => console.log("Delete", schedule.id),
 *   onGenerateShifts: (schedule) => console.log("Generate", schedule.id),
 * });
 *
 * <DataTable data={schedules} columns={columns} />
 * ```
 */
export function getFixedScheduleColumns(
  callbacks: FixedScheduleColumnsCallbacks
): DataTableColumn<FixedScheduleWithRelations>[] {
  const { onViewDetails, onEdit, onDelete, onGenerateShifts } = callbacks;

  return [
    // Profissional column - sortable
    {
      id: "staff_name",
      accessorFn: (row) => row.medical_staff?.name || "",
      header: ({ column }) => <ColumnHeader column={column} title="Profissional" />,
      cell: ({ row }) => {
        const schedule = row.original;
        const staff = schedule.medical_staff;

        return (
          <div className="flex items-center gap-3">
            <UserAvatar
              name={staff?.name || "?"}
              avatarUrl={staff?.avatar_url}
              color={staff?.color}
              size="sm"
              variant="soft"
            />
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">
                {staff?.name || "Profissional não encontrado"}
              </div>
              {staff?.profissao?.nome && (
                <div className="text-xs text-slate-500">
                  {staff.profissao.nome}
                </div>
              )}
            </div>
          </div>
        );
      },
      enableSorting: true,
    },

    // Unidade column - sortable
    {
      id: "facility_name",
      accessorFn: (row) => row.facilities?.name || "",
      header: ({ column }) => <ColumnHeader column={column} title="Unidade" />,
      cell: ({ row }) => {
        const facility = row.original.facilities;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-700 truncate">
              {facility?.name || "-"}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },

    // Setor column
    {
      id: "sector_name",
      accessorFn: (row) => row.sectors?.name || "",
      header: "Setor",
      cell: ({ row }) => {
        const sector = row.original.sectors;
        return (
          <span className="text-slate-600">
            {sector?.name || "-"}
          </span>
        );
      },
      enableSorting: false,
    },

    // Turno column - sortable
    {
      accessorKey: "shift_type",
      header: ({ column }) => <ColumnHeader column={column} title="Turno" />,
      cell: ({ row }) => {
        const shiftType = row.original.shift_type as keyof typeof SHIFT_TYPE_LABELS;
        const label = SHIFT_TYPE_LABELS[shiftType] || shiftType;
        const times = SHIFT_TYPE_TIMES[shiftType];

        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div>
              <span className="text-slate-700">{label}</span>
              {times && (
                <span className="text-xs text-slate-500 ml-1">
                  ({times.start} - {times.end})
                </span>
              )}
            </div>
          </div>
        );
      },
      enableSorting: true,
    },

    // Dias da Semana column
    {
      id: "weekdays",
      header: "Dias da Semana",
      cell: ({ row }) => {
        const weekdays = row.original.weekdays || [];

        return (
          <div className="flex items-center gap-1 flex-wrap">
            {weekdays.sort((a, b) => a - b).map((day) => (
              <span
                key={day}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
              >
                {WEEKDAY_SHORT_LABELS[day] || day}
              </span>
            ))}
            {weekdays.length === 0 && (
              <span className="text-slate-400">-</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },

    // Duração column - sortable
    {
      accessorKey: "duration_type",
      header: ({ column }) => <ColumnHeader column={column} title="Duração" />,
      cell: ({ row }) => {
        const { duration_type, end_date } = row.original;
        const formattedDuration = formatDuration(duration_type as DurationType, end_date);

        const isPermanent = duration_type === "permanent";

        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isPermanent
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {formattedDuration}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },

    // Status column - sortable
    {
      accessorKey: "active",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isActive = row.original.active !== false;

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isActive ? "Ativa" : "Inativa"}
          </span>
        );
      },
      enableSorting: true,
    },

    // Gerar column - button to generate shifts
    {
      id: "generate",
      header: () => <div className="text-center">Gerar</div>,
      cell: ({ row }) => {
        const schedule = row.original;

        return (
          <div className="flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateShifts(schedule);
                    }}
                    data-testid="generate-shifts-button"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Gerar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gerar escalas para o mês atual e próximo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    // Actions column - dropdown with view, edit, delete
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const schedule = row.original;
        const staffName = schedule.medical_staff?.name?.split(" ")[0] || "este item";

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                  data-testid="fixed-schedule-actions-menu"
                >
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(schedule);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(schedule);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(schedule);
                  }}
                  data-testid="delete-fixed-schedule-action"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir {staffName}
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
