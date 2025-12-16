import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfissaoComConselho } from '../schemas/registro-profissional.schema';

/**
 * Query function to fetch profissões from Supabase with conselho data
 *
 * @param supabase - Supabase client instance
 * @param search - Optional search term to filter by name (case-insensitive partial match)
 * @returns Promise resolving to array of profissões with conselho data
 */
async function fetchProfissoes(
  supabase: SupabaseClient,
  search?: string
): Promise<ProfissaoComConselho[]> {
  let query = supabase
    .from('profissoes')
    .select(`
      id,
      nome,
      conselho_id,
      categorias_disponiveis,
      created_at,
      conselho:conselhos_profissionais (
        id,
        sigla,
        nome_completo,
        regex_validacao,
        requer_categoria
      )
    `)
    .order('nome', { ascending: true });

  // Apply search filter if provided
  if (search && search.trim()) {
    query = query.ilike('nome', `%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch profissões: ${error.message}`);
  }

  // Transform data to flatten nested conselho relationship
  // Supabase returns nested relationships as arrays, we need to extract the first element
  return (data || []).map((row: any) => ({
    id: row.id,
    nome: row.nome,
    conselho_id: row.conselho_id,
    categorias_disponiveis: row.categorias_disponiveis,
    created_at: row.created_at,
    // Flatten conselho from array to single object
    conselho: Array.isArray(row.conselho) ? row.conselho[0] : row.conselho,
  })) as ProfissaoComConselho[];
}

/**
 * Hook options interface
 */
export interface UseProfissoesOptions {
  /**
   * Optional search term to filter profissões by name
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
export interface UseProfissoesResult {
  /**
   * Array of profissões with conselho data
   */
  data: ProfissaoComConselho[];
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
 * Custom React hook to fetch and manage profissões (healthcare professions) data
 *
 * This hook uses React Query for data fetching, caching, and state management.
 * It provides loading states, error handling, and automatic refetching capabilities.
 * Each profissão includes the associated conselho (professional council) data.
 *
 * Features:
 * - Automatic caching with 1-hour stale time (data rarely changes)
 * - Background refetching on window focus
 * - Optional search/filter functionality by name
 * - Retry logic with exponential backoff (3 retries)
 * - Includes nested conselho data for each profissão
 * - Type-safe with TypeScript
 *
 * @param supabase - Supabase client instance (from web or mobile app)
 * @param options - Optional configuration for the query
 * @returns Hook result with profissões data, loading states, and refetch function
 *
 * @example
 * ```tsx
 * // Basic usage - fetch all profissões
 * const { data, isLoading, error } = useProfissoes(supabase);
 *
 * // With search filter
 * const { data, isLoading, error } = useProfissoes(supabase, {
 *   search: 'enfer'
 * });
 *
 * // Access conselho data
 * const profissao = data[0];
 * console.log(profissao.nome); // "Enfermeiro"
 * console.log(profissao.conselho?.sigla); // "COREN"
 * ```
 */
export function useProfissoes(
  supabase: SupabaseClient,
  options?: UseProfissoesOptions
): UseProfissoesResult {
  const {
    search,
    enabled = true,
    staleTime = 60 * 60 * 1000, // 1 hour default
  } = options || {};

  // Build query key for React Query caching
  const queryKey = ['profissoes', search || 'all'];

  // Use React Query to fetch and cache data
  const {
    data = [],
    isLoading,
    error,
    isFetching,
    isRefetching,
    refetch,
  }: UseQueryResult<ProfissaoComConselho[], Error> = useQuery({
    queryKey,
    queryFn: () => fetchProfissoes(supabase, search),
    enabled,
    staleTime,
    gcTime: staleTime + 10 * 60 * 1000, // gcTime = staleTime + 10 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
