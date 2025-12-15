import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Especialidade } from '../schemas/medical-staff.schema';

/**
 * Query function to fetch especialidades from Supabase
 *
 * @param supabase - Supabase client instance
 * @param search - Optional search term to filter by name (case-insensitive partial match)
 * @returns Promise resolving to array of especialidades
 */
async function fetchEspecialidades(
  supabase: SupabaseClient,
  search?: string
): Promise<Especialidade[]> {
  let query = supabase
    .from('especialidades')
    .select('id, nome, created_at')
    .order('nome', { ascending: true });

  // Apply search filter if provided
  if (search && search.trim()) {
    query = query.ilike('nome', `%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch especialidades: ${error.message}`);
  }

  return data || [];
}

/**
 * Hook options interface
 */
export interface UseEspecialidadesOptions {
  /**
   * Optional search term to filter especialidades by name
   * Uses case-insensitive partial matching (ILIKE)
   */
  search?: string;
  /**
   * Whether the query should be enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Time in milliseconds until data is considered stale
   * @default 3600000 (1 hour)
   */
  staleTime?: number;
}

/**
 * Hook return interface
 */
export interface UseEspecialidadesResult {
  /**
   * Array of especialidades
   */
  data: Especialidade[];
  /**
   * Whether the query is currently loading for the first time
   */
  isLoading: boolean;
  /**
   * Error object if the query failed
   */
  error: Error | null;
  /**
   * Whether the query is currently fetching (including background refetches)
   */
  isFetching: boolean;
  /**
   * Whether the query is currently refetching in the background
   */
  isRefetching: boolean;
  /**
   * Function to manually refetch the data
   */
  refetch: () => void;
}

/**
 * Custom React hook to fetch and manage especialidades (medical specialties) data
 *
 * This hook uses React Query for data fetching, caching, and state management.
 * It provides loading states, error handling, and automatic refetching capabilities.
 *
 * Features:
 * - Automatic caching with 1-hour stale time (data rarely changes)
 * - Background refetching on window focus
 * - Optional search/filter functionality by name
 * - Retry logic with exponential backoff (3 retries)
 * - Comprehensive error handling
 * - Type-safe with TypeScript
 *
 * @param supabase - Supabase client instance (from web or mobile app)
 * @param options - Optional configuration for the query
 * @returns Hook result with especialidades data, loading states, and refetch function
 *
 * @example
 * ```tsx
 * // Basic usage - fetch all especialidades
 * const { data, isLoading, error } = useEspecialidades(supabase);
 *
 * // With search filter
 * const { data, isLoading, error } = useEspecialidades(supabase, {
 *   search: 'cardio'
 * });
 *
 * // With custom options
 * const { data, isLoading, error, refetch } = useEspecialidades(supabase, {
 *   search: searchTerm,
 *   enabled: isDialogOpen,
 *   staleTime: 30 * 60 * 1000, // 30 minutes
 * });
 * ```
 */
export function useEspecialidades(
  supabase: SupabaseClient,
  options?: UseEspecialidadesOptions
): UseEspecialidadesResult {
  const {
    search,
    enabled = true,
    staleTime = 60 * 60 * 1000, // 1 hour default
  } = options || {};

  // Build query key for React Query caching
  // Include search term to create separate cache entries for different searches
  const queryKey = ['especialidades', search || 'all'];

  // Use React Query to fetch and cache data
  const {
    data = [],
    isLoading,
    error,
    isFetching,
    isRefetching,
    refetch,
  }: UseQueryResult<Especialidade[], Error> = useQuery({
    queryKey,
    queryFn: () => fetchEspecialidades(supabase, search),
    enabled,
    staleTime,
    gcTime: staleTime + 10 * 60 * 1000, // gcTime = staleTime + 10 minutes
    refetchOnWindowFocus: true,
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s (max 30s)
  });

  return {
    data,
    isLoading,
    error: error as Error | null,
    isFetching,
    isRefetching,
    refetch: () => {
      refetch();
    },
  };
}
