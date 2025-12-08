'use client';

import type { ReactNode } from "react";
import { SupabaseAuthProvider } from "@/providers/SupabaseAuthProvider";
import { Toaster } from "@/components/ui/sonner";

export const AppProviders = ({ children }: { children: ReactNode }) => {
    return (
        <SupabaseAuthProvider>
            {children}
            <Toaster
                richColors
                closeButton
                position="top-right"
                toastOptions={{ className: "shadow-lg border border-slate-200/60" }}
            />
        </SupabaseAuthProvider>
    );
};

