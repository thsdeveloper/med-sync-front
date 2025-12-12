'use client';

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SupabaseAuthProvider } from "@/providers/SupabaseAuthProvider";
import { Toaster } from "@/components/ui/sonner";

export const AppProviders = ({ children }: { children: ReactNode }) => {
    // Create QueryClient instance with useState to ensure it's only created once
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Default staleTime: 5 minutes
                        staleTime: 5 * 60 * 1000,
                        // Default gcTime (cache time): 10 minutes
                        gcTime: 10 * 60 * 1000,
                        // Refetch on window focus
                        refetchOnWindowFocus: true,
                        // Retry failed queries
                        retry: 2,
                        // Exponential backoff for retries
                        retryDelay: (attemptIndex) =>
                            Math.min(1000 * 2 ** attemptIndex, 30000),
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <SupabaseAuthProvider>
                {children}
                <Toaster
                    richColors
                    closeButton
                    position="top-right"
                    toastOptions={{ className: "shadow-lg border border-slate-200/60" }}
                />
            </SupabaseAuthProvider>
        </QueryClientProvider>
    );
};

