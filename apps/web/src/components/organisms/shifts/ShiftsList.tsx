/**
 * ShiftsList Organism Component
 *
 * Displays shifts data grouped by medical staff in an expandable table format.
 * Each row represents a staff member, and clicking expands to show their shifts.
 *
 * Features:
 * - Grouped by medical staff (one row per professional)
 * - Row expansion to show individual shifts
 * - Sortable columns for staff name and shift count
 * - Search by professional name
 * - Pagination with configurable page size
 * - Filter slot for external filter controls
 * - Loading and empty states
 * - Actions dropdown for individual shifts (view, edit, delete)
 */

"use client";

import React, { useMemo, useCallback } from "react";
import type { Row } from "@tanstack/react-table";
import type { CalendarShift } from "@/types/calendar";
import { DataTable } from "@/components/data-table";
import { getGroupedShiftsColumns } from "./shifts-grouped-columns";
import { groupShiftsByStaff, type GroupedShiftsByStaff } from "./shifts-grouped-types";
import { ShiftExpansionContent } from "./ShiftExpansionContent";

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
  /** Callback when delete all shifts for a staff is triggered */
  onDeleteAll: (shiftIds: string[], staffName: string) => void;
  /** Optional slot for filter controls (e.g., CalendarFiltersSheet) */
  filterSlot?: React.ReactNode;
}

/**
 * ShiftsList component - renders shifts grouped by medical staff
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
 *   onDeleteAll={handleDeleteAllShifts}
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
  onDeleteAll,
  filterSlot,
}: ShiftsListProps) {
  // Group shifts by staff member
  const groupedData = useMemo(
    () => groupShiftsByStaff(shifts),
    [shifts]
  );

  // Handle delete all shifts for a staff member
  const handleDeleteAll = useCallback(
    (group: GroupedShiftsByStaff) => {
      const shiftIds = group.shifts.map((shift) => shift.id);
      onDeleteAll(shiftIds, group.doctor_name);
    },
    [onDeleteAll]
  );

  // Memoize column definitions to avoid unnecessary re-renders
  const columns = useMemo(
    () => getGroupedShiftsColumns({ onDeleteAll: handleDeleteAll }),
    [handleDeleteAll]
  );

  // Render function for expanded row content
  const renderExpandedRow = useCallback(
    (row: Row<GroupedShiftsByStaff>) => {
      const staffShifts = row.original.shifts;
      return (
        <ShiftExpansionContent
          shifts={staffShifts}
          sectors={sectors}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
    },
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

      {/* DataTable with grouped shifts data */}
      <DataTable
        data={groupedData}
        columns={columns}
        isLoading={isLoading}
        searchColumn="doctor_name"
        searchPlaceholder="Buscar por profissional..."
        enablePagination={true}
        enableSorting={true}
        enableFiltering={true}
        enableExpanding={true}
        expandOnRowClick={true}
        renderExpandedRow={renderExpandedRow}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        showToolbar={true}
        emptyMessage="Nenhuma escala encontrada para o período selecionado."
      />
    </div>
  );
}
