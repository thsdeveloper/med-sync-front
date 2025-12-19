/**
 * Query Configuration
 *
 * Default configurations for React Query across web and mobile.
 * These can be customized per-query as needed.
 */

/**
 * Standard time constants (in milliseconds)
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
} as const;

/**
 * Default query options for different data types.
 * Use these to maintain consistency across the application.
 */
export const queryConfig = {
  /**
   * Frequently changing data (chat messages, shifts status)
   * - Short stale time for freshness
   * - Refetch on window focus
   */
  realtime: {
    staleTime: 30 * TIME.SECOND, // 30 seconds
    gcTime: 5 * TIME.MINUTE, // 5 minutes cache
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  },

  /**
   * Standard data (conversations list, staff list, shifts)
   * - Moderate stale time
   * - Refetch on focus
   */
  standard: {
    staleTime: 5 * TIME.MINUTE, // 5 minutes
    gcTime: 10 * TIME.MINUTE, // 10 minutes cache
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
  },

  /**
   * Reference data (especialidades, profissoes, conselhos)
   * - Long stale time (rarely changes)
   * - Large cache time
   */
  reference: {
    staleTime: TIME.HOUR, // 1 hour
    gcTime: 24 * TIME.HOUR, // 24 hours cache
    refetchOnWindowFocus: false, // No need to refetch on focus
    refetchOnReconnect: false,
    retry: 3,
  },

  /**
   * User/staff profile data
   * - Moderate stale time
   * - Refetch on focus for freshness
   */
  profile: {
    staleTime: 5 * TIME.MINUTE,
    gcTime: 30 * TIME.MINUTE,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  },

  /**
   * Infinite scroll queries (messages, large lists)
   * - Similar to realtime but with pagination considerations
   */
  infinite: {
    staleTime: TIME.MINUTE, // 1 minute
    gcTime: 10 * TIME.MINUTE,
    refetchOnWindowFocus: false, // Avoid refetching paginated data on focus
    refetchOnReconnect: true,
    retry: 2,
    // Keep only last 3 pages in memory to avoid bloat
    maxPages: 3,
  },
} as const;

/**
 * Default mutation options
 */
export const mutationConfig = {
  /**
   * Standard mutations
   */
  standard: {
    retry: 1,
    retryDelay: 1000,
  },

  /**
   * Critical mutations (should not fail silently)
   */
  critical: {
    retry: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  },

  /**
   * Optimistic mutations
   * - For fast UI feedback
   */
  optimistic: {
    retry: 1,
    retryDelay: 500,
  },
} as const;

/**
 * Creates a query config with conditional enabled logic.
 * Useful for queries that depend on multiple parameters.
 */
export function createQueryConfig<T extends Record<string, unknown>>(
  baseConfig: T,
  dependencies: (string | null | undefined | boolean)[]
) {
  const enabled = dependencies.every((dep) => {
    if (typeof dep === 'boolean') return dep;
    return dep != null && dep !== '';
  });

  return {
    ...baseConfig,
    enabled,
  };
}
