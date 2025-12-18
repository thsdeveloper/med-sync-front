import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface CalendarShift {
  id: string
  title: string
  start: string
  end: string
  doctor_name: string
  doctor_id: string
  facility_name: string
  facility_id: string
  facility_address: string | null
  specialty: string
  status: string
  notes: string
  date: string
  sector_id?: string
  fixed_schedule_id?: string | null
}

/**
 * GET /api/calendar/shifts
 *
 * Fetches shifts data formatted for calendar display
 *
 * Query Parameters:
 * - organization_id (required): UUID of the organization
 * - start_date (required): ISO 8601 timestamp for start of date range
 * - end_date (required): ISO 8601 timestamp for end of date range
 * - facility_id (optional): UUID of facility to filter by (or 'todas' for all)
 * - specialty (optional): Specialty to filter by (or 'todas' for all)
 * - sector_id (optional): UUID of sector to filter by
 * - staff_id (optional): UUID of staff member to filter by
 * - status (optional): Comma-separated list of statuses to filter by
 * - shift_type (optional): morning, afternoon, or night
 * - assignment_status (optional): assigned, unassigned, or all
 * - schedule_type (optional): manual, fixed, or all
 *
 * Returns:
 * {
 *   ok: true,
 *   data: {
 *     shifts: [
 *       {
 *         id: string,
 *         title: string,
 *         start: string (ISO 8601),
 *         end: string (ISO 8601),
 *         doctor_name: string,
 *         doctor_id: string,
 *         facility_name: string,
 *         facility_id: string,
 *         specialty: string,
 *         status: string,
 *         notes: string,
 *         date: string (YYYY-MM-DD)
 *       }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const facilityId = searchParams.get('facility_id') || 'todas'
    const specialty = searchParams.get('specialty') || 'todas'

    // New filter parameters
    const sectorId = searchParams.get('sector_id')
    const staffId = searchParams.get('staff_id')
    const statusFilter = searchParams.get('status')
    const shiftType = searchParams.get('shift_type')
    const assignmentStatus = searchParams.get('assignment_status')
    const scheduleType = searchParams.get('schedule_type')

    // Validate required parameters
    if (!organizationId) {
      return NextResponse.json(
        { ok: false, error: 'organization_id parameter is required' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { ok: false, error: 'start_date parameter is required' },
        { status: 400 }
      )
    }

    if (!endDate) {
      return NextResponse.json(
        { ok: false, error: 'end_date parameter is required' },
        { status: 400 }
      )
    }

    // Validate date formats
    const startDateTime = new Date(startDate)
    const endDateTime = new Date(endDate)

    if (isNaN(startDateTime.getTime())) {
      return NextResponse.json(
        { ok: false, error: 'Invalid start_date format. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    if (isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { ok: false, error: 'Invalid end_date format. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    if (endDateTime < startDateTime) {
      return NextResponse.json(
        { ok: false, error: 'end_date must be greater than or equal to start_date' },
        { status: 400 }
      )
    }

    // Call the RPC function
    const { data, error } = await supabase.rpc('get_calendar_shifts', {
      p_organization_id: organizationId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_facility_id: facilityId,
      p_specialty: specialty,
    })

    if (error) {
      console.error('Error fetching calendar shifts:', error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    // Get shifts from response
    let shifts: CalendarShift[] = data?.shifts || []

    // Apply client-side filters for fields not supported by RPC

    // Filter by sector_id
    if (sectorId) {
      shifts = shifts.filter((shift) => shift.sector_id === sectorId)
    }

    // Filter by staff_id (doctor_id)
    if (staffId) {
      shifts = shifts.filter((shift) => shift.doctor_id === staffId)
    }

    // Filter by status (comma-separated list)
    if (statusFilter) {
      const statuses = statusFilter.split(',').map((s) => s.trim().toLowerCase())
      shifts = shifts.filter((shift) =>
        statuses.includes(shift.status.toLowerCase())
      )
    }

    // Filter by shift_type (based on start time hour)
    if (shiftType && shiftType !== 'todos') {
      shifts = shifts.filter((shift) => {
        const startHour = new Date(shift.start).getHours()
        switch (shiftType) {
          case 'morning':
            return startHour >= 6 && startHour < 12
          case 'afternoon':
            return startHour >= 12 && startHour < 18
          case 'night':
            return startHour >= 18 || startHour < 6
          default:
            return true
        }
      })
    }

    // Filter by assignment_status
    if (assignmentStatus && assignmentStatus !== 'all') {
      shifts = shifts.filter((shift) => {
        // RPC returns 'N/A' for doctor_name when no doctor is assigned
        const hasDoctor = shift.doctor_id && shift.doctor_name && shift.doctor_name !== 'N/A'
        if (assignmentStatus === 'assigned') {
          return hasDoctor
        } else if (assignmentStatus === 'unassigned') {
          return !hasDoctor
        }
        return true
      })
    }

    // Filter by schedule_type (based on fixed_schedule_id)
    if (scheduleType && scheduleType !== 'all') {
      shifts = shifts.filter((shift) => {
        const isFromFixedSchedule = shift.fixed_schedule_id !== null && shift.fixed_schedule_id !== undefined
        if (scheduleType === 'fixed') {
          return isFromFixedSchedule
        } else if (scheduleType === 'manual') {
          return !isFromFixedSchedule
        }
        return true
      })
    }

    // Return the filtered data
    return NextResponse.json({
      ok: true,
      data: { shifts },
    })
  } catch (error) {
    console.error('Unexpected error in calendar shifts API:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
