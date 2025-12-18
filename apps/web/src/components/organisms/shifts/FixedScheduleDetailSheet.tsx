/**
 * FixedScheduleDetailSheet Component
 *
 * A sheet component that displays detailed information about a fixed schedule
 * in read-only mode. Includes staff info, facility, shift details, and actions.
 *
 * Features:
 * - Staff information with color indicator and specialty
 * - Facility and sector details
 * - Shift type with time range
 * - Weekday selection display
 * - Duration and status information
 * - Count of generated shifts
 * - Edit button to transition to edit mode
 */

"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Building2,
  MapPin,
  Clock,
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Edit,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/atoms/Button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SHIFT_TYPE_LABELS,
  SHIFT_TYPE_TIMES,
  DURATION_TYPE_LABELS,
  formatWeekdays,
} from "@medsync/shared";

import type { FixedScheduleWithRelations } from "./fixed-schedule-columns";

/**
 * Props for FixedScheduleDetailSheet
 */
interface FixedScheduleDetailSheetProps {
  /** Controls sheet visibility */
  isOpen: boolean;
  /** Callback when sheet is closed */
  onClose: () => void;
  /** The fixed schedule to display */
  schedule: FixedScheduleWithRelations | null;
  /** Callback when edit button is clicked */
  onEdit: (schedule: FixedScheduleWithRelations) => void;
}

/**
 * Weekday full labels
 */
const WEEKDAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

/**
 * Format date for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = parseISO(dateStr);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Detail row component for consistent styling
 */
function DetailRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Icon className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className={valueClassName || "text-slate-900"}>
          {value}
        </div>
      </div>
    </div>
  );
}

/**
 * FixedScheduleDetailSheet - Displays fixed schedule details in a side sheet
 */
export function FixedScheduleDetailSheet({
  isOpen,
  onClose,
  schedule,
  onEdit,
}: FixedScheduleDetailSheetProps) {
  // Query to count shifts generated from this fixed schedule
  const { data: shiftsCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ["fixed-schedule-shifts-count", schedule?.id],
    queryFn: async () => {
      if (!schedule?.id) return 0;

      const { count, error } = await supabase
        .from("shifts")
        .select("*", { count: "exact", head: true })
        .eq("fixed_schedule_id", schedule.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!schedule?.id && isOpen,
    staleTime: 30000, // 30 seconds
  });

  if (!schedule) return null;

  const staff = schedule.medical_staff;
  const facility = schedule.facilities;
  const sector = schedule.sectors;
  const shiftType = schedule.shift_type as keyof typeof SHIFT_TYPE_LABELS;
  const durationType = schedule.duration_type as keyof typeof DURATION_TYPE_LABELS;
  const times = SHIFT_TYPE_TIMES[shiftType];
  const isActive = schedule.active !== false;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl">Detalhes da Escala Fixa</SheetTitle>
          <SheetDescription>
            Informações completas sobre esta escala recorrente
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Staff Header */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: staff?.color || "#64748b" }}
            >
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg text-slate-900 truncate">
                {staff?.name || "Profissional não encontrado"}
              </div>
              {staff?.profissao?.nome && (
                <div className="text-sm text-slate-600">
                  {staff.profissao.nome}
                </div>
              )}
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {isActive ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1">
            {/* Facility */}
            <DetailRow
              icon={Building2}
              label="Unidade"
              value={facility?.name || "-"}
            />

            {/* Sector */}
            <DetailRow
              icon={MapPin}
              label="Setor"
              value={sector?.name || "Não especificado"}
            />

            {/* Shift Type */}
            <DetailRow
              icon={Clock}
              label="Turno"
              value={
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {SHIFT_TYPE_LABELS[shiftType] || shiftType}
                  </span>
                  {times && (
                    <span className="text-sm text-slate-500">
                      ({times.start} - {times.end})
                    </span>
                  )}
                </div>
              }
            />

            {/* Weekdays */}
            <DetailRow
              icon={CalendarDays}
              label="Dias da Semana"
              value={
                <div className="flex flex-wrap gap-2 mt-1">
                  {schedule.weekdays
                    .sort((a, b) => a - b)
                    .map((day) => (
                      <span
                        key={day}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
                      >
                        {WEEKDAY_LABELS[day] || `Dia ${day}`}
                      </span>
                    ))}
                </div>
              }
            />

            {/* Duration Type */}
            <DetailRow
              icon={Calendar}
              label="Tipo de Duração"
              value={
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                    durationType === "permanent"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {DURATION_TYPE_LABELS[durationType] || durationType}
                </span>
              }
            />

            {/* Start Date */}
            <DetailRow
              icon={Calendar}
              label="Data de Início"
              value={formatDate(schedule.start_date)}
            />

            {/* End Date (if not permanent) */}
            {durationType !== "permanent" && schedule.end_date && (
              <DetailRow
                icon={Calendar}
                label="Data de Término"
                value={formatDate(schedule.end_date)}
              />
            )}

            {/* Generated Shifts Count */}
            <DetailRow
              icon={CalendarDays}
              label="Escalas Geradas"
              value={
                isLoadingCount ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                    {shiftsCount} escala{shiftsCount !== 1 ? "s" : ""}
                  </span>
                )
              }
            />
          </div>
        </div>

        <SheetFooter className="border-t pt-4">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Fechar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                onClose();
                onEdit(schedule);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default FixedScheduleDetailSheet;
