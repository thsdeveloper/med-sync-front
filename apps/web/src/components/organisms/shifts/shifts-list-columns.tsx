/**
 * Shifts List Table Column Definitions
 *
 * TanStack Table column definitions for the Shifts List (Lista de Escalas) data table.
 * Defines columns for professional, facility, sector, date/time, status, specialty,
 * address, notes, origin, and actions.
 *
 * Features:
 * - Sortable columns for key fields
 * - Custom cell renderers with proper formatting
 * - Status badges with color coding
 * - Origin indicator (Manual/Escala Fixa)
 * - Edit, View, and Delete actions via dropdown menu
 */

"use client";

import React from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Clock,
  MapPin,
  FileText,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CalendarShift } from "@/types/calendar";
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

/**
 * Sector type for lookup
 */
interface Sector {
  id: string;
  name: string;
}

/**
 * Status configuration with labels and colors
 */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800",
  },
  accepted: {
    label: "Aceita",
    className: "bg-green-100 text-green-800",
  },
  declined: {
    label: "Recusada",
    className: "bg-red-100 text-red-800",
  },
  swap_requested: {
    label: "Troca Solicitada",
    className: "bg-blue-100 text-blue-800",
  },
};

/**
 * Props for the actions column
 */
interface ShiftActionsProps {
  shift: CalendarShift;
  onViewDetails: (shift: CalendarShift) => void;
  onEdit: (shift: CalendarShift) => void;
  onDelete: (shiftId: string) => void;
}

/**
 * Actions cell component - View, Edit and Delete buttons
 */
function ShiftActions({
  shift,
  onViewDetails,
  onEdit,
  onDelete,
}: ShiftActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          data-testid="shift-actions-menu"
        >
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onViewDetails(shift)}
          data-testid="view-shift-action"
        >
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onEdit(shift)}
          data-testid="edit-shift-action"
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => onDelete(shift.id)}
          data-testid="delete-shift-action"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Helper to resolve sector name from ID
 */
function getSectorName(sectorId: string | null | undefined, sectors: Sector[]): string {
  if (!sectorId) return "-";
  const sector = sectors.find((s) => s.id === sectorId);
  return sector?.name || "-";
}

/**
 * Helper to format time range from ISO strings
 */
function formatTimeRange(start: string, end: string): string {
  try {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`;
  } catch {
    return "-";
  }
}

/**
 * Helper to format date
 */
function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Helper to capitalize first letter
 */
function capitalize(str: string): string {
  if (!str) return "-";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Creates column definitions for the Shifts List table
 *
 * @param sectors - Array of sectors for name resolution
 * @param onViewDetails - Callback function when view action is triggered
 * @param onEdit - Callback function when edit action is triggered
 * @param onDelete - Callback function when delete action is triggered
 * @returns Array of column definitions for TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getShiftsListColumns({
 *   sectors: sectorsData,
 *   onViewDetails: (shift) => console.log("View", shift),
 *   onEdit: (shift) => console.log("Edit", shift),
 *   onDelete: (shiftId) => console.log("Delete", shiftId),
 * });
 *
 * <DataTable data={shifts} columns={columns} />
 * ```
 */
export function getShiftsListColumns({
  sectors,
  onViewDetails,
  onEdit,
  onDelete,
}: {
  sectors: Sector[];
  onViewDetails: (shift: CalendarShift) => void;
  onEdit: (shift: CalendarShift) => void;
  onDelete: (shiftId: string) => void;
}): DataTableColumn<CalendarShift>[] {
  return [
    // Profissional column - sortable, with specialty badge
    {
      accessorKey: "doctor_name",
      header: ({ column }) => <ColumnHeader column={column} title="Profissional" />,
      cell: ({ row }) => {
        const shift = row.original;
        const hasDoctor = shift.doctor_name && shift.doctor_name !== "N/A";
        return (
          <div className="flex flex-col gap-0.5">
            <span className={`font-medium ${hasDoctor ? "text-slate-900" : "text-slate-400 italic"}`}>
              {hasDoctor ? shift.doctor_name : "Não atribuído"}
            </span>
            {shift.specialty && (
              <span className="text-xs text-slate-500">
                {capitalize(shift.specialty)}
              </span>
            )}
          </div>
        );
      },
      enableSorting: true,
    },

    // Unidade column - sortable
    {
      accessorKey: "facility_name",
      header: ({ column }) => <ColumnHeader column={column} title="Unidade" />,
      cell: ({ row }) => {
        const facilityName = row.original.facility_name;
        return (
          <div className="text-slate-600">{facilityName || "-"}</div>
        );
      },
      enableSorting: true,
    },

    // Setor column - sortable with lookup
    {
      accessorKey: "sector_id",
      id: "sector",
      header: ({ column }) => <ColumnHeader column={column} title="Setor" />,
      cell: ({ row }) => {
        const sectorName = getSectorName(row.original.sector_id, sectors);
        return <div className="text-slate-600">{sectorName}</div>;
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const a = getSectorName(rowA.original.sector_id, sectors);
        const b = getSectorName(rowB.original.sector_id, sectors);
        return a.localeCompare(b);
      },
    },

    // Data/Hora column - sortable
    {
      accessorKey: "date",
      header: ({ column }) => <ColumnHeader column={column} title="Data/Hora" />,
      cell: ({ row }) => {
        const shift = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-900">
              <Calendar className="h-3 w-3 text-slate-400" />
              {formatDate(shift.date)}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="h-3 w-3 text-slate-400" />
              {formatTimeRange(shift.start, shift.end)}
            </div>
          </div>
        );
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const a = new Date(rowA.original.start).getTime();
        const b = new Date(rowB.original.start).getTime();
        return a - b;
      },
    },

    // Status column - sortable with colored badge
    {
      accessorKey: "status",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Status" align="center" />
      ),
      cell: ({ row }) => {
        const status = row.original.status?.toLowerCase() || "pending";
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        return (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
            >
              {config.label}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },

    // Especialidade column - sortable
    {
      accessorKey: "specialty",
      header: ({ column }) => <ColumnHeader column={column} title="Especialidade" />,
      cell: ({ row }) => {
        const specialty = row.original.specialty;
        return (
          <div className="text-slate-600">{capitalize(specialty)}</div>
        );
      },
      enableSorting: true,
    },

    // Endereco column - not sortable
    {
      accessorKey: "facility_address",
      header: "Endereço",
      cell: ({ row }) => {
        const address = row.original.facility_address;
        if (!address) {
          return <span className="text-slate-400">-</span>;
        }
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-slate-600 max-w-[200px]">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{address}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{address}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },

    // Notas column - not sortable
    {
      accessorKey: "notes",
      header: "Notas",
      cell: ({ row }) => {
        const notes = row.original.notes;
        if (!notes) {
          return <span className="text-slate-400">-</span>;
        }
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-slate-600 max-w-[150px]">
                  <FileText className="h-3 w-3 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{notes}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{notes}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },

    // Origem column - sortable (manual vs fixed schedule)
    {
      accessorKey: "fixed_schedule_id",
      id: "origin",
      header: ({ column }) => <ColumnHeader column={column} title="Origem" />,
      cell: ({ row }) => {
        const isFixed = !!row.original.fixed_schedule_id;
        return (
          <div className="flex items-center gap-1.5">
            {isFixed ? (
              <>
                <RefreshCw className="h-3 w-3 text-blue-500" />
                <span className="text-slate-600">Escala Fixa</span>
              </>
            ) : (
              <>
                <Edit className="h-3 w-3 text-slate-400" />
                <span className="text-slate-600">Manual</span>
              </>
            )}
          </div>
        );
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.fixed_schedule_id ? 1 : 0;
        const b = rowB.original.fixed_schedule_id ? 1 : 0;
        return a - b;
      },
    },

    // Actions column - view, edit and delete buttons
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <ShiftActions
            shift={row.original}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
