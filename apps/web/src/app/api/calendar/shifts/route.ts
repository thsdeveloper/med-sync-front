import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Return the data
    return NextResponse.json({
      ok: true,
      data: data || { shifts: [] },
    })
  } catch (error) {
    console.error('Unexpected error in calendar shifts API:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
