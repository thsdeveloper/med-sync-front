/**
 * ShiftsList Organism Component
 *
 * Displays shifts data in a table format using the DataTable component.
 * This component wraps the DataTable with shifts-specific configuration
 * and provides a filter slot for the CalendarFiltersSheet.
 *
 * Features:
 * - Sortable columns for all relevant fields
 * - Search by professional name
 * - Pagination with configurable page size
 * - Filter slot for external filter controls
 * - Loading and empty states
 * - Row click for viewing details
 * - Actions dropdown (view, edit, delete)
 */

"use client";

import React, { useMemo } from "react";
import type { CalendarShift } from "@/types/calendar";
import { DataTable } from "@/components/data-table";
import { getShiftsListColumns } from "./shifts-list-columns";

/**
 * Sector type for lookup
 */
interface Sector {
  id: string;
  name: string;
}

/**
 * Props for the ShiftsList component
 */
interface ShiftsListProps {
  /** Array of shift data to display */
  shifts: CalendarShift[];
  /** Array of sectors for name resolution in the sector column */
  sectors: Sector[];
  /** Loading state */
  isLoading: boolean;
  /** Callback when edit action is triggered */
  onEdit: (shift: CalendarShift) => void;
  /** Callback when delete action is triggered */
  onDelete: (shiftId: string) => void;
  /** Callback when view details action is triggered */
  onViewDetails: (shift: CalendarShift) => void;
  /** Optional slot for filter controls (e.g., CalendarFiltersSheet) */
  filterSlot?: React.ReactNode;
}

/**
 * ShiftsList component - renders shifts in a data table format
 *
 * @example
 * ```tsx
 * <ShiftsList
 *   shifts={shiftsData}
 *   sectors={sectorsData}
 *   isLoading={isLoadingShifts}
 *   onEdit={handleEditShift}
 *   onDelete={handleDeleteShift}
 *   onViewDetails={handleViewShiftDetails}
 *   filterSlot={<CalendarFiltersSheet {...filterProps} />}
 * />
 * ```
 */
export function ShiftsList({
  shifts,
  sectors,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  filterSlot,
}: ShiftsListProps) {
  // Memoize column definitions to avoid unnecessary re-renders
  const columns = useMemo(
    () =>
      getShiftsListColumns({
        sectors,
        onViewDetails,
        onEdit,
        onDelete,
      }),
    [sectors, onViewDetails, onEdit, onDelete]
  );

  return (
    <div className="space-y-4">
      {/* Filter slot - renders external filter controls */}
      {filterSlot && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {filterSlot}
          </div>
        </div>
      )}

      {/* DataTable with shifts data */}
      <DataTable
        data={shifts}
        columns={columns}
        isLoading={isLoading}
        searchColumn="doctor_name"
        searchPlaceholder="Buscar por profissional..."
        enablePagination={true}
        enableSorting={true}
        enableFiltering={true}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        showToolbar={true}
        emptyMessage="Nenhuma escala encontrada para o período selecionado."
      />
    </div>
  );
}
