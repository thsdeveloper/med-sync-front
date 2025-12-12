import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Query active facilities
        const { data: facilities, error: facilitiesError } = await supabase
            .from('facilities')
            .select('id, name')
            .eq('active', true)
            .order('name', { ascending: true });

        if (facilitiesError) {
            console.error('Error fetching facilities:', facilitiesError);
            return NextResponse.json(
                { ok: false, message: 'Failed to fetch facilities' },
                { status: 500 }
            );
        }

        // Query distinct specialties from medical_staff
        const { data: staffData, error: specialtiesError } = await supabase
            .from('medical_staff')
            .select('specialty')
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
                // Normalize: trim whitespace and lowercase for consistency
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
