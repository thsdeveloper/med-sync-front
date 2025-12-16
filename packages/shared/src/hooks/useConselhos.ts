import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConselhoProfissional } from '../schemas/registro-profissional.schema';

/**
 * Query function to fetch conselhos profissionais from Supabase
 *
 * @param supabase - Supabase client instance
 * @returns Promise resolving to array of conselhos profissionais
 */
async function fetchConselhos(
  supabase: SupabaseClient
): Promise<ConselhoProfissional[]> {
  const { data, error } = await supabase
    .from('conselhos_profissionais')
    .select('id, sigla, nome_completo, regex_validacao, requer_categoria, created_at')
    .order('sigla', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch conselhos profissionais: ${error.message}`);
  }

  return data || [];
}

/**
 * Hook options interface
 */
export interface UseConselhosOptions {
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
export interface UseConselhosResult {
  /**
   * Array of conselhos profissionais
   */
  data: ConselhoProfissional[];
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
  /**
   * Find a conselho by its sigla (e.g., 'CRM', 'COREN')
   */
  findBySigla: (sigla: string) => ConselhoProfissional | undefined;
}

/**
 * Custom React hook to fetch and manage conselhos profissionais (professional councils) data
 *
 * This hook uses React Query for data fetching, caching, and state management.
 * It provides loading states, error handling, and automatic refetching capabilities.
 *
 * Features:
 * - Automatic caching with 1-hour stale time (data rarely changes)
 * - Background refetching on window focus
 * - Retry logic with exponential backoff (3 retries)
 * - Helper function to find conselho by sigla
 * - Type-safe with TypeScript
 *
 * @param supabase - Supabase client instance (from web or mobile app)
 * @param options - Optional configuration for the query
 * @returns Hook result with conselhos data, loading states, and helper functions
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading, error, findBySigla } = useConselhos(supabase);
 *
 * // Find CRM conselho
 * const crm = findBySigla('CRM');
 * console.log(crm?.nome_completo); // "Conselho Regional de Medicina"
 * console.log(crm?.requer_categoria); // false
 *
 * // Check if COREN requires categoria
 * const coren = findBySigla('COREN');
 * console.log(coren?.requer_categoria); // true
 * ```
 */
export function useConselhos(
  supabase: SupabaseClient,
  options?: UseConselhosOptions
): UseConselhosResult {
  const {
    enabled = true,
    staleTime = 60 * 60 * 1000, // 1 hour default
  } = options || {};

  // Build query key for React Query caching
  const queryKey = ['conselhos_profissionais'];

  // Use React Query to fetch and cache data
  const {
    data = [],
    isLoading,
    error,
    isFetching,
    isRefetching,
    refetch,
  }: UseQueryResult<ConselhoProfissional[], Error> = useQuery({
    queryKey,
    queryFn: () => fetchConselhos(supabase),
    enabled,
    staleTime,
    gcTime: staleTime + 10 * 60 * 1000, // gcTime = staleTime + 10 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Helper function to find conselho by sigla
  const findBySigla = (sigla: string): ConselhoProfissional | undefined => {
    return data.find((c) => c.sigla.toUpperCase() === sigla.toUpperCase());
  };

  return {
    data,
    isLoading,
    error: error as Error | null,
    isFetching,
    isRefetching,
    refetch: () => {
      refetch();
    },
    findBySigla,
  };
}
