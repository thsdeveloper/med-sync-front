/**
 * Types and utilities for grouped shifts by medical staff
 *
 * This module provides types and functions to group shifts by medical staff
 * for display in an expandable data table.
 */

import type { CalendarShift } from "@/types/calendar";

/**
 * Grouped shift data - one row per medical staff with their shifts as sub-rows
 */
export interface GroupedShiftsByStaff {
  /** Unique identifier for the group (doctor_id or 'unassigned') */
  id: string;
  /** Doctor/Staff ID */
  doctor_id: string;
  /** Doctor/Staff name */
  doctor_name: string;
  /** Medical specialty */
  specialty: string;
  /** Total number of shifts for this staff */
  total_shifts: number;
  /** Number of pending shifts */
  pending_count: number;
  /** Number of accepted shifts */
  accepted_count: number;
  /** Number of declined shifts */
  declined_count: number;
  /** Earliest shift date in the current range */
  earliest_date: string | null;
  /** Latest shift date in the current range */
  latest_date: string | null;
  /** All shifts for this staff member */
  shifts: CalendarShift[];
}

/**
 * Groups shifts by medical staff (doctor)
 *
 * @param shifts - Array of calendar shifts to group
 * @returns Array of grouped shifts by staff
 */
export function groupShiftsByStaff(shifts: CalendarShift[]): GroupedShiftsByStaff[] {
  // Create a map to group shifts by doctor_id
  const groupedMap = new Map<string, GroupedShiftsByStaff>();

  for (const shift of shifts) {
    // Use doctor_id or 'unassigned' for shifts without a doctor
    const key = shift.doctor_id || "unassigned";
    const doctorName = shift.doctor_name && shift.doctor_name !== "N/A"
      ? shift.doctor_name
      : "Não atribuído";

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        id: key,
        doctor_id: shift.doctor_id || "",
        doctor_name: doctorName,
        specialty: shift.specialty || "",
        total_shifts: 0,
        pending_count: 0,
        accepted_count: 0,
        declined_count: 0,
        earliest_date: null,
        latest_date: null,
        shifts: [],
      });
    }

    const group = groupedMap.get(key)!;
    group.shifts.push(shift);
    group.total_shifts++;

    // Count by status
    const status = shift.status?.toLowerCase();
    if (status === "pending") group.pending_count++;
    else if (status === "accepted") group.accepted_count++;
    else if (status === "declined") group.declined_count++;

    // Track date range
    if (!group.earliest_date || shift.date < group.earliest_date) {
      group.earliest_date = shift.date;
    }
    if (!group.latest_date || shift.date > group.latest_date) {
      group.latest_date = shift.date;
    }
  }

  // Convert map to array and sort by doctor name
  const result = Array.from(groupedMap.values());

  // Sort: assigned doctors first (alphabetically), then unassigned
  result.sort((a, b) => {
    if (a.id === "unassigned") return 1;
    if (b.id === "unassigned") return -1;
    return a.doctor_name.localeCompare(b.doctor_name);
  });

  // Sort shifts within each group by date (newest first)
  for (const group of result) {
    group.shifts.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start.localeCompare(b.start);
    });
  }

  return result;
}
