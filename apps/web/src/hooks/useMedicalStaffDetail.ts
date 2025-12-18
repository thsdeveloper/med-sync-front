/**
 * useMedicalStaffDetail Hook
 *
 * Custom React hook for fetching and managing medical staff detail data with real-time updates.
 * Integrates React Query for caching and Supabase real-time subscriptions for live data updates.
 *
 * Features:
 * - React Query integration for caching and automatic refetching
 * - Supabase real-time subscriptions for live data updates
 * - Loading, error, and data state management
 * - Organization context handling with RLS enforcement
 * - Automatic cache invalidation on real-time updates
 *
 * @module hooks/useMedicalStaffDetail
 */

'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getMedicalStaffById } from '@/lib/supabase/medical-staff-queries';
import type { MedicalStaffDetailView } from '@/lib/supabase/medical-staff-queries';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook options for configuration
 */
interface UseMedicalStaffDetailOptions {
  /**
   * Whether to automatically fetch data on mount
   * @default true
   */
  enabled?: boolean;

  /**
   * Stale time in milliseconds (how long data is considered fresh)
   * @default 5 minutes (300000 ms)
   */
  staleTime?: number;

  /**
   * Whether to refetch on window focus
   * @default true
   */
  refetchOnWindowFocus?: boolean;

  /**
   * Whether to enable real-time subscriptions
   * @default true
   */
  enableRealtime?: boolean;
}

/**
 * Hook return type with all methods and states
 */
export interface UseMedicalStaffDetailResult {
  /** Medical staff detail data (null if not found or loading) */
  data: MedicalStaffDetailView | null;

  /** Whether data is loading for the first time */
  isLoading: boolean;

  /** Error object if fetch failed */
  error: Error | null;

  /**
   * Manually refetch data from the server
   */
  refetch: () => Promise<void>;
}

/**
 * Custom React hook to fetch and manage medical staff detail data
 *
 * This hook provides comprehensive medical staff profile data including:
 * - Personal information and contact details
 * - Specialty and professional registration
 * - Associated facilities
 * - Recent shift history
 * - Organization memberships
 *
 * The hook automatically subscribes to real-time updates for the medical staff record,
 * ensuring the UI stays in sync with database changes.
 *
 * **IMPORTANT:** This hook respects Row Level Security (RLS) policies.
 * The user must have access to the organization that the staff member belongs to.
 *
 * @param medicalStaffId - UUID of the medical staff member (required)
 * @param organizationId - UUID of the organization (required for RLS filtering)
 * @param options - Optional configuration for the hook
 * @returns Hook result with data, loading states, error, and refetch method
 *
 * @example
 * Basic usage
 * ```tsx
 * function StaffProfilePage({ staffId }: { staffId: string }) {
 *   const { organizationId } = useOrganization();
 *   const { data, isLoading, error, refetch } = useMedicalStaffDetail(
 *     staffId,
 *     organizationId
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return <div>Staff member not found</div>;
 *
 *   return (
 *     <div>
 *       <h1>{data.name}</h1>
 *       <p>Specialty: {data.especialidade?.nome}</p>
 *       <p>Facilities: {data.facilities.length}</p>
 *       <p>Recent Shifts: {data.recentShifts.length}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * With custom options
 * ```tsx
 * const { data, isLoading } = useMedicalStaffDetail(staffId, organizationId, {
 *   enabled: !!staffId && !!organizationId,
 *   staleTime: 10 * 60 * 1000, // 10 minutes
 *   refetchOnWindowFocus: false,
 *   enableRealtime: true,
 * });
 * ```
 *
 * @example
 * Handling real-time updates
 * ```tsx
 * function StaffProfile({ staffId }: { staffId: string }) {
 *   const { organizationId } = useOrganization();
 *   const { data, isLoading } = useMedicalStaffDetail(staffId, organizationId);
 *
 *   // Data automatically updates when changes occur in the database
 *   // No manual refetch needed for real-time changes
 *
 *   return <div>{data?.name}</div>;
 * }
 * ```
 */
export function useMedicalStaffDetail(
  medicalStaffId: string | null,
  organizationId: string | null,
  options?: UseMedicalStaffDetailOptions
): UseMedicalStaffDetailResult {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  // Build query key for React Query caching
  const queryKey = ['medical-staff-detail', medicalStaffId, organizationId];

  // Fetch medical staff detail using React Query
  const {
    data = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!medicalStaffId || !organizationId) {
        return null;
      }

      const result = await getMedicalStaffById(
        supabase,
        medicalStaffId,
        organizationId
      );

      return result;
    },
    enabled:
      options?.enabled ?? (!!medicalStaffId && !!organizationId),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on access denied (RLS failures)
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Set up real-time subscription for live updates
  useEffect(() => {
    // Skip if real-time is disabled or no staff ID
    if (
      options?.enableRealtime === false ||
      !medicalStaffId ||
      !organizationId
    ) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to changes on the medical_staff table for this specific staff member
        channel = supabase
          .channel(`medical-staff-${medicalStaffId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'medical_staff',
              filter: `id=eq.${medicalStaffId}`,
            },
            (payload) => {
              console.log(
                '[useMedicalStaffDetail] Real-time update received:',
                payload
              );

              // Invalidate the query cache to trigger a refetch
              // This ensures we get the latest data including all relationships
              queryClient.invalidateQueries({ queryKey });
            }
          )
          .subscribe((status, error) => {
            if (status === 'SUBSCRIBED') {
              console.log(
                `[useMedicalStaffDetail] Subscribed to real-time updates for staff ${medicalStaffId}`
              );
            } else if (status === 'CHANNEL_ERROR') {
              console.error(
                '[useMedicalStaffDetail] Real-time subscription error:',
                error
              );
            } else if (status === 'TIMED_OUT') {
              console.warn(
                '[useMedicalStaffDetail] Real-time subscription timed out'
              );
            } else if (status === 'CLOSED') {
              console.log(
                '[useMedicalStaffDetail] Real-time subscription closed'
              );
            }
          });
      } catch (error) {
        console.error(
          '[useMedicalStaffDetail] Error setting up real-time subscription:',
          error
        );
      }
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (channel) {
        console.log(
          `[useMedicalStaffDetail] Unsubscribing from real-time updates for staff ${medicalStaffId}`
        );
        supabase.removeChannel(channel);
      }
    };
  }, [medicalStaffId, organizationId, options?.enableRealtime, queryClient, supabase, queryKey]);

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
