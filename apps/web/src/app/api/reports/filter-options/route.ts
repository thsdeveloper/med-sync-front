import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // Extract organization_id from query parameters
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organization_id');

        if (!organizationId) {
            return NextResponse.json(
                { ok: false, message: 'organization_id parameter is required' },
                { status: 400 }
            );
        }

        // Query active facilities filtered by organization_id
        const { data: facilities, error: facilitiesError } = await supabase
            .from('facilities')
            .select('id, name')
            .eq('active', true)
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });

        if (facilitiesError) {
            console.error('Error fetching facilities:', facilitiesError);
            return NextResponse.json(
                { ok: false, message: 'Failed to fetch facilities' },
                { status: 500 }
            );
        }

        // Query distinct specialties from medical_staff filtered by organization
        // Use staff_organizations table for proper N:N relationship filtering
        const { data: staffData, error: specialtiesError } = await supabase
            .from('medical_staff')
            .select('specialty, staff_organizations!inner(organization_id)')
            .eq('staff_organizations.organization_id', organizationId)
            .eq('staff_organizations.active', true)
            .not('specialty', 'is', null);

        if (specialtiesError) {
            console.error('Error fetching specialties:', specialtiesError);
            return NextResponse.json(
                { ok: false, message: 'Failed to fetch specialties' },
                { status: 500 }
            );
        }

        // Extract and normalize distinct specialties
        const specialtiesSet = new Set<string>();
        staffData?.forEach((staff) => {
            if (staff.specialty) {
                // Normalize: trim whitespace and convert to lowercase for consistency
                const normalized = staff.specialty.trim().toLowerCase();
                if (normalized) {
                    specialtiesSet.add(normalized);
                }
            }
        });

        // Convert to array and sort
        const specialties = Array.from(specialtiesSet).sort();

        return NextResponse.json({
            ok: true,
            data: {
                facilities: facilities || [],
                specialties: specialties,
            },
        });
    } catch (error) {
        console.error('Unexpected error in filter-options API:', error);
        return NextResponse.json(
            { ok: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
