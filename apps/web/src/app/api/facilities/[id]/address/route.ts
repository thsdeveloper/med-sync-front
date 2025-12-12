import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    createFacilityAddressSchema,
    updateFacilityAddressSchema,
    type FacilityAddress,
} from '@/schemas/facility-address.schema';

// Initialize Supabase client for server-side operations
const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
    }

    return createClient(supabaseUrl, supabaseAnonKey);
};

// Helper to get authenticated user
const getAuthenticatedUser = async (request: NextRequest) => {
    const supabase = getSupabaseClient();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
        return { user: null, error: 'Authorization header missing' };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return { user: null, error: 'Invalid or expired token' };
    }

    return { user, error: null };
};

// Helper to verify facility belongs to user's organization
const verifyFacilityAccess = async (
    supabase: ReturnType<typeof getSupabaseClient>,
    facilityId: string,
    userId: string
) => {
    const { data: facility, error } = await supabase
        .from('facilities')
        .select('id, organization_id, organizations!inner(id)')
        .eq('id', facilityId)
        .single();

    if (error || !facility) {
        return { hasAccess: false, error: 'Facility not found' };
    }

    // Verify user belongs to the same organization
    const { data: userOrg, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', facility.organization_id)
        .eq('owner_id', userId)
        .maybeSingle();

    if (orgError) {
        return { hasAccess: false, error: 'Error verifying organization access' };
    }

    // User must be the organization owner or we could check for membership
    // For now, checking if owner_id matches
    const hasAccess = userOrg !== null;

    return { hasAccess, error: hasAccess ? null : 'Forbidden: Access denied to this facility' };
};

/**
 * GET /api/facilities/[id]/address
 * Retrieves the address for a specific facility
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: facilityId } = await params;

        // Validate UUID format
        if (!z.string().uuid().safeParse(facilityId).success) {
            return NextResponse.json(
                { error: 'Invalid facility ID format' },
                { status: 400 }
            );
        }

        // Get authenticated user
        const { user, error: authError } = await getAuthenticatedUser(request);
        if (authError || !user) {
            return NextResponse.json(
                { error: authError || 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseClient();

        // Verify facility access
        const { hasAccess, error: accessError } = await verifyFacilityAccess(
            supabase,
            facilityId,
            user.id
        );

        if (!hasAccess) {
            return NextResponse.json(
                { error: accessError || 'Forbidden' },
                { status: 403 }
            );
        }

        // Get facility address
        const { data: address, error: dbError } = await supabase
            .from('facility_addresses')
            .select('*')
            .eq('facility_id', facilityId)
            .maybeSingle();

        if (dbError) {
            console.error('Database error fetching address:', dbError);
            return NextResponse.json(
                { error: 'Failed to fetch facility address' },
                { status: 500 }
            );
        }

        if (!address) {
            return NextResponse.json(
                { error: 'Address not found for this facility' },
                { status: 404 }
            );
        }

        return NextResponse.json(address, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in GET /api/facilities/[id]/address:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/facilities/[id]/address
 * Creates a new address for a specific facility
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: facilityId } = await params;

        // Validate UUID format
        if (!z.string().uuid().safeParse(facilityId).success) {
            return NextResponse.json(
                { error: 'Invalid facility ID format' },
                { status: 400 }
            );
        }

        // Get authenticated user
        const { user, error: authError } = await getAuthenticatedUser(request);
        if (authError || !user) {
            return NextResponse.json(
                { error: authError || 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseClient();

        // Verify facility access
        const { hasAccess, error: accessError } = await verifyFacilityAccess(
            supabase,
            facilityId,
            user.id
        );

        if (!hasAccess) {
            return NextResponse.json(
                { error: accessError || 'Forbidden' },
                { status: 403 }
            );
        }

        // Check if address already exists for this facility
        const { data: existingAddress } = await supabase
            .from('facility_addresses')
            .select('id')
            .eq('facility_id', facilityId)
            .maybeSingle();

        if (existingAddress) {
            return NextResponse.json(
                { error: 'Address already exists for this facility. Use PATCH to update.' },
                { status: 409 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validationResult = createFacilityAddressSchema.safeParse({
            ...body,
            facility_id: facilityId,
        });

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.format(),
                },
                { status: 400 }
            );
        }

        const addressData = validationResult.data;

        // Insert new address
        const { data: newAddress, error: dbError } = await supabase
            .from('facility_addresses')
            .insert([addressData])
            .select()
            .single();

        if (dbError) {
            console.error('Database error creating address:', dbError);
            return NextResponse.json(
                { error: 'Failed to create facility address' },
                { status: 500 }
            );
        }

        return NextResponse.json(newAddress, { status: 201 });
    } catch (error) {
        console.error('Unexpected error in POST /api/facilities/[id]/address:', error);

        // Handle JSON parse errors
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/facilities/[id]/address
 * Updates the existing address for a specific facility
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: facilityId } = await params;

        // Validate UUID format
        if (!z.string().uuid().safeParse(facilityId).success) {
            return NextResponse.json(
                { error: 'Invalid facility ID format' },
                { status: 400 }
            );
        }

        // Get authenticated user
        const { user, error: authError } = await getAuthenticatedUser(request);
        if (authError || !user) {
            return NextResponse.json(
                { error: authError || 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseClient();

        // Verify facility access
        const { hasAccess, error: accessError } = await verifyFacilityAccess(
            supabase,
            facilityId,
            user.id
        );

        if (!hasAccess) {
            return NextResponse.json(
                { error: accessError || 'Forbidden' },
                { status: 403 }
            );
        }

        // Check if address exists
        const { data: existingAddress, error: checkError } = await supabase
            .from('facility_addresses')
            .select('id')
            .eq('facility_id', facilityId)
            .maybeSingle();

        if (checkError) {
            console.error('Database error checking address:', checkError);
            return NextResponse.json(
                { error: 'Failed to check existing address' },
                { status: 500 }
            );
        }

        if (!existingAddress) {
            return NextResponse.json(
                { error: 'Address not found for this facility. Use POST to create one.' },
                { status: 404 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validationResult = updateFacilityAddressSchema.safeParse({
            ...body,
            facility_id: facilityId,
        });

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.format(),
                },
                { status: 400 }
            );
        }

        const updateData = validationResult.data;

        // Remove facility_id from update data (it's used only for validation)
        const { facility_id, ...dataToUpdate } = updateData;

        // Update address
        const { data: updatedAddress, error: dbError } = await supabase
            .from('facility_addresses')
            .update(dataToUpdate)
            .eq('facility_id', facilityId)
            .select()
            .single();

        if (dbError) {
            console.error('Database error updating address:', dbError);
            return NextResponse.json(
                { error: 'Failed to update facility address' },
                { status: 500 }
            );
        }

        return NextResponse.json(updatedAddress, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in PATCH /api/facilities/[id]/address:', error);

        // Handle JSON parse errors
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
