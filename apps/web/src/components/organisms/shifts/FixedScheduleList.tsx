/**
 * FixedScheduleList Organism Component
 *
 * Displays fixed schedules in a DataTable format with sorting, filtering,
 * and pagination. Each row represents a recurring schedule template.
 *
 * Features:
 * - DataTable with sortable columns
 * - Search by professional name or facility
 * - Generate shifts button per row
 * - Actions dropdown (view, edit, delete)
 * - Loading and empty states
 * - Pagination with configurable page size
 */

"use client";

import React, { useMemo, useCallback } from "react";
import { Calendar } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  getFixedScheduleColumns,
  type FixedScheduleWithRelations,
} from "./fixed-schedule-columns";

/**
 * Props for the FixedScheduleList component
 */
interface FixedScheduleListProps {
  /** Array of fixed schedule data to display */
  schedules: FixedScheduleWithRelations[];
  /** Loading state */
  isLoading: boolean;
  /** Callback when edit action is triggered */
  onEdit: (schedule: FixedScheduleWithRelations) => void;
  /** Callback when delete action is triggered */
  onDelete: (schedule: FixedScheduleWithRelations) => void;
  /** Callback when view details action is triggered */
  onViewDetails: (schedule: FixedScheduleWithRelations) => void;
  /** Callback when generate shifts action is triggered */
  onGenerateShifts: (schedule: FixedScheduleWithRelations) => void;
}

/**
 * FixedScheduleList component - renders fixed schedules in a DataTable
 *
 * @example
 * ```tsx
 * <FixedScheduleList
 *   schedules={fixedSchedulesData}
 *   isLoading={isLoadingSchedules}
 *   onEdit={handleEditSchedule}
 *   onDelete={handleDeleteSchedule}
 *   onViewDetails={handleViewDetails}
 *   onGenerateShifts={handleGenerateShifts}
 * />
 * ```
 */
export function FixedScheduleList({
  schedules,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  onGenerateShifts,
}: FixedScheduleListProps) {
  // Memoize column definitions to avoid unnecessary re-renders
  const columns = useMemo(
    () =>
      getFixedScheduleColumns({
        onViewDetails,
        onEdit,
        onDelete,
        onGenerateShifts,
      }),
    [onViewDetails, onEdit, onDelete, onGenerateShifts]
  );

  // Empty state component
  if (!isLoading && schedules.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg bg-slate-50/50">
        <div className="mx-auto h-12 w-12 text-slate-400 mb-3">
          <Calendar className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">
          Nenhuma escala fixa cadastrada
        </h3>
        <p className="mt-1 text-slate-500 max-w-sm mx-auto">
          Crie escalas fixas para definir horários recorrentes de profissionais
          em clínicas e hospitais.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      data={schedules}
      columns={columns}
      isLoading={isLoading}
      searchColumn="staff_name"
      searchPlaceholder="Buscar por profissional..."
      enablePagination={true}
      enableSorting={true}
      enableFiltering={true}
      pageSize={20}
      pageSizeOptions={[10, 20, 50, 100]}
      showToolbar={true}
      emptyMessage="Nenhuma escala fixa encontrada."
    />
  );
}

export default FixedScheduleList;
