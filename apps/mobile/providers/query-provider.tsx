import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * QueryProvider Component
 *
 * Provides React Query context to the entire app.
 * Configures QueryClient with optimized settings for mobile:
 * - Default staleTime: 5 minutes (data considered fresh for 5 min)
 * - Default gcTime: 10 minutes (cache garbage collection after 10 min)
 * - Retry: 3 attempts with exponential backoff
 * - refetchOnWindowFocus: true (refetch when app comes to foreground)
 * - refetchOnReconnect: true (refetch when network reconnects)
 */

// Create a client with mobile-optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Garbage collect unused data after 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch when app comes to foreground
      refetchOnWindowFocus: true,
      // Refetch when network reconnects
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps the app with React Query's QueryClientProvider.
 * Use this at the root of your app to enable data fetching with React Query.
 *
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
