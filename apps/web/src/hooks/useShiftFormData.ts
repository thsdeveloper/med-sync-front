'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Facility, MedicalStaff, Sector } from '@medsync/shared';

export interface UseShiftFormDataResult {
    facilities: Facility[];
    staff: MedicalStaff[];
    sectors: Sector[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Custom hook to fetch all data needed for shift form dialogs
 *
 * Fetches facilities, medical staff, and sectors for a given organization.
 * Used by ShiftDialog and FixedScheduleDialog components.
 *
 * @param organizationId - The organization ID to fetch data for
 * @returns Object containing facilities, staff, sectors, loading state, and refetch function
 */
export function useShiftFormData(organizationId: string | null): UseShiftFormDataResult {
    // Fetch facilities
    const {
        data: facilities = [],
        isLoading: facilitiesLoading,
        error: facilitiesError,
        refetch: refetchFacilities,
    } = useQuery({
        queryKey: ['facilities', organizationId],
        queryFn: async () => {
            if (!organizationId) return [];

            const { data, error } = await supabase
                .from('facilities')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('active', true)
                .order('name');

            if (error) throw error;
            return (data as Facility[]) || [];
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    // Fetch medical staff via staff_organizations
    const {
        data: staff = [],
        isLoading: staffLoading,
        error: staffError,
        refetch: refetchStaff,
    } = useQuery({
        queryKey: ['medical-staff-for-shifts', organizationId],
        queryFn: async () => {
            if (!organizationId) return [];

            const { data: staffOrgsData, error } = await supabase
                .from('staff_organizations')
                .select(`
                    staff_id,
                    medical_staff (
                        id,
                        name,
                        email,
                        phone,
                        crm,
                        especialidade_id,
                        profissao_id,
                        color,
                        active,
                        created_at,
                        updated_at,
                        especialidade:especialidades (
                            id,
                            nome,
                            created_at
                        ),
                        profissao:profissoes (
                            id,
                            nome,
                            conselho:conselhos_profissionais (
                                sigla
                            )
                        )
                    )
                `)
                .eq('organization_id', organizationId)
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Extract medical_staff from the join
            const staffList: MedicalStaff[] = [];
            for (const staffOrg of staffOrgsData || []) {
                const medicalStaff = staffOrg.medical_staff as unknown as MedicalStaff;
                if (medicalStaff && medicalStaff.active) {
                    staffList.push(medicalStaff);
                }
            }

            // Sort by name
            staffList.sort((a, b) => a.name.localeCompare(b.name));
            return staffList;
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Fetch sectors (global + organization-specific)
    const {
        data: sectors = [],
        isLoading: sectorsLoading,
        error: sectorsError,
        refetch: refetchSectors,
    } = useQuery({
        queryKey: ['sectors', organizationId],
        queryFn: async () => {
            if (!organizationId) return [];

            // Fetch both global sectors (organization_id is null) and org-specific sectors
            const { data, error } = await supabase
                .from('sectors')
                .select('*')
                .or(`organization_id.eq.${organizationId},organization_id.is.null`)
                .order('name');

            if (error) throw error;
            return (data as Sector[]) || [];
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const isLoading = facilitiesLoading || staffLoading || sectorsLoading;
    const error = facilitiesError || staffError || sectorsError;

    const refetch = () => {
        refetchFacilities();
        refetchStaff();
        refetchSectors();
    };

    return {
        facilities,
        staff,
        sectors,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}
