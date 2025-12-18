/**
 * ShiftExpansionContent Component
 *
 * Displays detailed shift information when a staff row is expanded.
 * Shows a mini-table with all shifts for the selected medical staff.
 */

"use client";

import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CalendarShift } from "@/types/calendar";
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
 * Props for ShiftExpansionContent
 */
interface ShiftExpansionContentProps {
  /** Array of shifts to display */
  shifts: CalendarShift[];
  /** Array of sectors for name resolution */
  sectors: Sector[];
  /** Callback when view details action is triggered */
  onViewDetails: (shift: CalendarShift) => void;
  /** Callback when edit action is triggered */
  onEdit: (shift: CalendarShift) => void;
  /** Callback when delete action is triggered */
  onDelete: (shiftId: string) => void;
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
    return format(date, "dd/MM/yyyy (EEEE)", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * ShiftExpansionContent - Renders detailed shift information in expanded row
 */
export function ShiftExpansionContent({
  shifts,
  sectors,
  onViewDetails,
  onEdit,
  onDelete,
}: ShiftExpansionContentProps) {
  if (!shifts || shifts.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Nenhuma escala encontrada para este profissional.
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50/50">
      <div className="text-sm font-medium text-slate-600 mb-3">
        Escalas ({shifts.length})
      </div>
      <div className="space-y-2">
        {shifts.map((shift) => {
          const status = shift.status?.toLowerCase() || "pending";
          const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
          const isFixed = !!shift.fixed_schedule_id;

          return (
            <div
              key={shift.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              {/* Date and Time */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(shift.date)}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {formatTimeRange(shift.start, shift.end)}
                  </div>
                </div>
              </div>

              {/* Facility and Sector */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {shift.facility_name || "-"}
                  </div>
                  <div className="text-xs text-slate-500 ml-5">
                    {getSectorName(shift.sector_id, sectors)}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="min-w-[150px]">
                {shift.facility_address ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 max-w-[150px]">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{shift.facility_address}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{shift.facility_address}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </div>

              {/* Notes */}
              <div className="min-w-[100px]">
                {shift.notes ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 max-w-[100px]">
                          <FileText className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{shift.notes}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>{shift.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </div>

              {/* Status Badge */}
              <div className="min-w-[100px] flex justify-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Origin */}
              <div className="min-w-[100px] flex items-center gap-1.5">
                {isFixed ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-sm text-slate-600">Fixa</span>
                  </>
                ) : (
                  <>
                    <Edit className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-600">Manual</span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="min-w-[50px] flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      data-testid="shift-row-actions"
                    >
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(shift)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(shift)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDelete(shift.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
