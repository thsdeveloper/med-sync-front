/**
 * Facility Address Migration Script
 *
 * Migrates existing facilities with old text-based address field to new structured
 * facility_addresses table. Creates facility_addresses records for all facilities
 * that don't already have one.
 *
 * Features:
 * - Parses legacy address text into structured format where possible
 * - Uses fallback values for missing data (Brazil center coordinates)
 * - Marks auto-migrated addresses with is_migrated flag
 * - Comprehensive logging and error handling
 * - Idempotent (safe to run multiple times)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MigrationLogger } from './migration-logger';
import { BRAZILIAN_STATES } from '@/schemas/facility-address.schema';

// Default coordinates: Brazil's geographic center
const BRAZIL_CENTER_LAT = -14.235;
const BRAZIL_CENTER_LNG = -51.9253;

// Default values for migrated addresses
const DEFAULT_STREET = 'Endereço não informado';
const DEFAULT_NUMBER = 'S/N';
const DEFAULT_NEIGHBORHOOD = 'Centro';
const DEFAULT_CITY = 'Não informado';
const DEFAULT_STATE = 'SP' as const;
const DEFAULT_POSTAL_CODE = '00000-000';
const DEFAULT_COUNTRY = 'Brasil';

interface Facility {
    id: string;
    name: string;
    address?: string | null;
    organization_id: string;
}

interface ParsedAddress {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: typeof BRAZILIAN_STATES[number];
    postal_code: string;
    country: string;
    latitude: number;
    longitude: number;
}

/**
 * Attempts to parse a legacy address string into structured components
 *
 * Common Brazilian address formats:
 * - "Rua ABC, 123, Bairro, Cidade - SP, 12345-678"
 * - "Av. XYZ, 456 - Complemento, Bairro, Cidade/SP"
 * - "Simple text address"
 *
 * Returns structured data with fallbacks for unparseable parts
 */
function parseAddressText(addressText: string | null | undefined): ParsedAddress {
    const defaultAddress: ParsedAddress = {
        street: DEFAULT_STREET,
        number: DEFAULT_NUMBER,
        complement: '',
        neighborhood: DEFAULT_NEIGHBORHOOD,
        city: DEFAULT_CITY,
        state: DEFAULT_STATE,
        postal_code: DEFAULT_POSTAL_CODE,
        country: DEFAULT_COUNTRY,
        latitude: BRAZIL_CENTER_LAT,
        longitude: BRAZIL_CENTER_LNG,
    };

    if (!addressText || addressText.trim() === '') {
        return defaultAddress;
    }

    const text = addressText.trim();
    const result = { ...defaultAddress };

    // Try to extract CEP (Brazilian postal code) - format: 12345-678 or 12345678
    const cepMatch = text.match(/\b(\d{5})-?(\d{3})\b/);
    if (cepMatch) {
        result.postal_code = `${cepMatch[1]}-${cepMatch[2]}`;
    }

    // Try to extract state (2 uppercase letters)
    const stateMatch = text.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
        const stateCode = stateMatch[1] as any;
        if (BRAZILIAN_STATES.includes(stateCode)) {
            result.state = stateCode;
        }
    }

    // Try to extract city (before state or dash)
    const cityMatch = text.match(/,\s*([^,\-]+?)\s*[-\/]\s*[A-Z]{2}/);
    if (cityMatch && cityMatch[1].trim().length > 0) {
        result.city = cityMatch[1].trim();
    } else {
        // Fallback: try to get last word before state
        const cityFallback = text.match(/,\s*([^,]+?)\s*[A-Z]{2}/);
        if (cityFallback && cityFallback[1].trim().length > 0) {
            result.city = cityFallback[1].trim();
        }
    }

    // Try to extract street and number (usually at the beginning)
    // Format: "Street Name, Number" or "Street Name nº Number"
    const streetMatch = text.match(/^([^,]+),\s*(\d+[\w]*)/);
    if (streetMatch) {
        result.street = streetMatch[1].trim();
        result.number = streetMatch[2].trim();
    } else {
        // Fallback: use first part as street
        const firstPart = text.split(',')[0];
        if (firstPart && firstPart.trim().length > 0) {
            result.street = firstPart.trim();
        }
    }

    // Try to extract neighborhood (usually third segment)
    const segments = text.split(',').map(s => s.trim());
    if (segments.length >= 3) {
        // Typically: Street, Number, Neighborhood, City - State
        const neighborhoodCandidate = segments[2].replace(/[-\/]\s*[A-Z]{2}.*$/, '').trim();
        if (neighborhoodCandidate.length > 0 && neighborhoodCandidate.length < 100) {
            result.neighborhood = neighborhoodCandidate;
        }
    }

    // Try to extract complement (text after number, before neighborhood)
    const complementMatch = text.match(/,\s*\d+[\w]*\s*[-,]\s*([^,]+?)\s*,/);
    if (complementMatch && complementMatch[1].trim().length > 0) {
        const comp = complementMatch[1].trim();
        // Only use if it's not likely to be the neighborhood
        if (comp.length < 50 && !comp.match(/bairro|centro|jardim/i)) {
            result.complement = comp;
        }
    }

    return result;
}

/**
 * Creates a facility_addresses record for a facility
 */
async function createFacilityAddress(
    supabase: SupabaseClient,
    facility: Facility,
    logger: MigrationLogger
): Promise<boolean> {
    try {
        // Parse the legacy address text
        const parsedAddress = parseAddressText(facility.address);

        // Create the address record with is_migrated flag set to true
        const addressData = {
            facility_id: facility.id,
            street: parsedAddress.street,
            number: parsedAddress.number,
            complement: parsedAddress.complement || null,
            neighborhood: parsedAddress.neighborhood,
            city: parsedAddress.city,
            state: parsedAddress.state,
            postal_code: parsedAddress.postal_code,
            country: parsedAddress.country,
            latitude: parsedAddress.latitude,
            longitude: parsedAddress.longitude,
            is_migrated: true,
        };

        const { data, error } = await supabase
            .from('facility_addresses')
            .insert([addressData])
            .select()
            .single();

        if (error) {
            logger.error(
                `Failed to create address for facility: ${error.message}`,
                {
                    facilityId: facility.id,
                    facilityName: facility.name,
                    error: error.message,
                    code: error.code,
                }
            );
            return false;
        }

        logger.success(
            `Created address for facility "${facility.name}"`,
            {
                facilityId: facility.id,
                facilityName: facility.name,
                addressId: data.id,
                wasEmpty: !facility.address || facility.address.trim() === '',
                originalAddress: facility.address,
                parsedCity: parsedAddress.city,
                parsedState: parsedAddress.state,
            }
        );

        return true;
    } catch (error) {
        logger.error(
            `Unexpected error creating address for facility: ${error instanceof Error ? error.message : String(error)}`,
            {
                facilityId: facility.id,
                facilityName: facility.name,
            }
        );
        return false;
    }
}

/**
 * Main migration function
 *
 * Processes all facilities that don't have a facility_addresses record
 * and creates one based on the legacy address field.
 */
export async function migrateFacilityAddresses(
    supabaseUrl: string,
    supabaseKey: string
): Promise<ReturnType<MigrationLogger['getResult']>> {
    const logger = new MigrationLogger();
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Step 1: Get all facilities
        logger.info('Fetching all facilities...');
        const { data: allFacilities, error: facilitiesError } = await supabase
            .from('facilities')
            .select('id, name, address, organization_id')
            .order('created_at', { ascending: true });

        if (facilitiesError) {
            logger.error(`Failed to fetch facilities: ${facilitiesError.message}`);
            return logger.getResult();
        }

        if (!allFacilities || allFacilities.length === 0) {
            logger.info('No facilities found in database');
            return logger.getResult();
        }

        logger.info(`Found ${allFacilities.length} facilities`);

        // Step 2: Get all existing facility addresses
        logger.info('Fetching existing facility addresses...');
        const { data: existingAddresses, error: addressesError } = await supabase
            .from('facility_addresses')
            .select('facility_id');

        if (addressesError) {
            logger.error(`Failed to fetch existing addresses: ${addressesError.message}`);
            return logger.getResult();
        }

        const existingFacilityIds = new Set(
            (existingAddresses || []).map(addr => addr.facility_id)
        );

        logger.info(`Found ${existingFacilityIds.size} facilities with existing addresses`);

        // Step 3: Filter facilities that need migration
        const facilitiesToMigrate = allFacilities.filter(
            facility => !existingFacilityIds.has(facility.id)
        );

        if (facilitiesToMigrate.length === 0) {
            logger.info('All facilities already have addresses. No migration needed.');
            return logger.getResult();
        }

        logger.info(`Found ${facilitiesToMigrate.length} facilities without addresses. Starting migration...`);

        // Step 4: Migrate each facility
        for (const facility of facilitiesToMigrate) {
            await createFacilityAddress(supabase, facility, logger);
        }

        // Step 5: Print summary
        logger.info('Migration completed');
        logger.printSummary();

        return logger.getResult();
    } catch (error) {
        logger.error(
            `Critical migration error: ${error instanceof Error ? error.message : String(error)}`
        );
        logger.printSummary();
        return logger.getResult();
    }
}

/**
 * Helper function to get migration statistics without running migration
 */
export async function getMigrationStats(
    supabaseUrl: string,
    supabaseKey: string
): Promise<{
    totalFacilities: number;
    facilitiesWithAddresses: number;
    facilitiesNeedingMigration: number;
    migratedAddresses: number;
}> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: allFacilities } = await supabase
        .from('facilities')
        .select('id', { count: 'exact', head: true });

    const { data: existingAddresses } = await supabase
        .from('facility_addresses')
        .select('facility_id, is_migrated', { count: 'exact' });

    const { data: migratedAddresses } = await supabase
        .from('facility_addresses')
        .select('id', { count: 'exact', head: true })
        .eq('is_migrated', true);

    const totalFacilities = allFacilities?.length || 0;
    const facilitiesWithAddresses = existingAddresses?.length || 0;
    const facilitiesNeedingMigration = totalFacilities - facilitiesWithAddresses;
    const migratedCount = migratedAddresses?.length || 0;

    return {
        totalFacilities,
        facilitiesWithAddresses,
        facilitiesNeedingMigration,
        migratedAddresses: migratedCount,
    };
}
