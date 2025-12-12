/**
 * Custom Hook: useFacilityAddress
 *
 * Manages facility addresses with CRUD operations using Supabase client directly.
 * Follows the project pattern of client-side Supabase calls instead of Next.js API routes.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    createFacilityAddressSchema,
    updateFacilityAddressSchema,
    type FacilityAddress
} from '@/schemas/facility-address.schema';
import { z } from 'zod';

interface UseFacilityAddressReturn {
    address: FacilityAddress | null;
    isLoading: boolean;
    error: string | null;
    fetchAddress: (facilityId: string) => Promise<void>;
    createAddress: (facilityId: string, data: z.infer<typeof createFacilityAddressSchema>) => Promise<boolean>;
    updateAddress: (facilityId: string, data: z.infer<typeof updateFacilityAddressSchema>) => Promise<boolean>;
}

export function useFacilityAddress(): UseFacilityAddressReturn {
    const [address, setAddress] = useState<FacilityAddress | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches the address for a specific facility
     */
    const fetchAddress = useCallback(async (facilityId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: dbError } = await supabase
                .from('facility_addresses')
                .select('*')
                .eq('facility_id', facilityId)
                .maybeSingle();

            if (dbError) {
                throw new Error(dbError.message);
            }

            setAddress(data as FacilityAddress | null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar endereço';
            setError(errorMessage);
            console.error('Error fetching facility address:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Creates a new address for a facility
     */
    const createAddress = useCallback(async (
        facilityId: string,
        data: z.infer<typeof createFacilityAddressSchema>
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Validate data
            const validationResult = createFacilityAddressSchema.safeParse({
                ...data,
                facility_id: facilityId,
            });

            if (!validationResult.success) {
                const errorMessage = validationResult.error.issues[0]?.message || 'Dados inválidos';
                setError(errorMessage);
                toast.error(errorMessage);
                return false;
            }

            // Check if address already exists
            const { data: existingAddress } = await supabase
                .from('facility_addresses')
                .select('id')
                .eq('facility_id', facilityId)
                .maybeSingle();

            if (existingAddress) {
                const errorMessage = 'Já existe um endereço para esta unidade';
                setError(errorMessage);
                toast.error(errorMessage);
                return false;
            }

            // Insert new address
            const { data: newAddress, error: dbError } = await supabase
                .from('facility_addresses')
                .insert([validationResult.data])
                .select()
                .single();

            if (dbError) {
                throw new Error(dbError.message);
            }

            setAddress(newAddress as FacilityAddress);
            toast.success('Endereço criado com sucesso');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar endereço';
            setError(errorMessage);
            toast.error('Erro ao criar endereço');
            console.error('Error creating facility address:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Updates an existing address for a facility
     */
    const updateAddress = useCallback(async (
        facilityId: string,
        data: z.infer<typeof updateFacilityAddressSchema>
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Validate data
            const validationResult = updateFacilityAddressSchema.safeParse({
                ...data,
                facility_id: facilityId,
            });

            if (!validationResult.success) {
                const errorMessage = validationResult.error.issues[0]?.message || 'Dados inválidos';
                setError(errorMessage);
                toast.error(errorMessage);
                return false;
            }

            // Check if address exists
            const { data: existingAddress } = await supabase
                .from('facility_addresses')
                .select('id')
                .eq('facility_id', facilityId)
                .maybeSingle();

            if (!existingAddress) {
                const errorMessage = 'Endereço não encontrado';
                setError(errorMessage);
                toast.error(errorMessage);
                return false;
            }

            // Remove facility_id from update data (it's only for validation)
            const { facility_id, ...dataToUpdate } = validationResult.data;

            // Update address
            const { data: updatedAddress, error: dbError } = await supabase
                .from('facility_addresses')
                .update(dataToUpdate)
                .eq('facility_id', facilityId)
                .select()
                .single();

            if (dbError) {
                throw new Error(dbError.message);
            }

            setAddress(updatedAddress as FacilityAddress);
            toast.success('Endereço atualizado com sucesso');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar endereço';
            setError(errorMessage);
            toast.error('Erro ao atualizar endereço');
            console.error('Error updating facility address:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        address,
        isLoading,
        error,
        fetchAddress,
        createAddress,
        updateAddress,
    };
}
