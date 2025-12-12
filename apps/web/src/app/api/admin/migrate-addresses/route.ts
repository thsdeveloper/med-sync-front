/**
 * Admin API Endpoint: Migrate Facility Addresses
 *
 * POST /api/admin/migrate-addresses
 *
 * Triggers the migration script to populate existing facilities with default addresses.
 * This endpoint should be called once after the address feature is deployed to migrate
 * existing facilities from the old text-based address field to the new structured format.
 *
 * Security: Requires authentication. Should be restricted to admin users only.
 *
 * Query Parameters:
 * - dry_run: boolean (optional) - If true, returns migration stats without executing migration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { migrateFacilityAddresses, getMigrationStats } from '@/lib/migrations/migrate-facility-addresses';

// Initialize Supabase client for server-side operations
const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
    }

    return { supabaseUrl, supabaseAnonKey };
};

// Helper to get authenticated user
const getAuthenticatedUser = async (request: NextRequest) => {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseClient();
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

/**
 * POST /api/admin/migrate-addresses
 * Executes the facility address migration
 */
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const { user, error: authError } = await getAuthenticatedUser(request);
        if (authError || !user) {
            return NextResponse.json(
                { error: authError || 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get Supabase credentials
        const { supabaseUrl, supabaseAnonKey } = getSupabaseClient();

        // Check for dry run mode
        const url = new URL(request.url);
        const isDryRun = url.searchParams.get('dry_run') === 'true';

        if (isDryRun) {
            // Dry run: just return statistics
            const stats = await getMigrationStats(supabaseUrl, supabaseAnonKey);
            return NextResponse.json({
                mode: 'dry_run',
                message: 'Migration statistics (dry run - no changes made)',
                stats,
            }, { status: 200 });
        }

        // Execute migration
        console.log('Starting facility address migration...');
        const result = await migrateFacilityAddresses(supabaseUrl, supabaseAnonKey);

        // Return results
        return NextResponse.json({
            mode: 'migration_executed',
            message: result.success
                ? 'Migration completed successfully'
                : 'Migration completed with errors',
            result,
        }, { status: result.success ? 200 : 207 }); // 207 = Multi-Status (partial success)

    } catch (error) {
        console.error('Unexpected error in POST /api/admin/migrate-addresses:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/migrate-addresses
 * Returns migration statistics without executing migration
 */
export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const { user, error: authError } = await getAuthenticatedUser(request);
        if (authError || !user) {
            return NextResponse.json(
                { error: authError || 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get Supabase credentials
        const { supabaseUrl, supabaseAnonKey } = getSupabaseClient();

        // Get migration statistics
        const stats = await getMigrationStats(supabaseUrl, supabaseAnonKey);

        return NextResponse.json({
            message: 'Migration statistics',
            stats,
            needsMigration: stats.facilitiesNeedingMigration > 0,
        }, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in GET /api/admin/migrate-addresses:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
