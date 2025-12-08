"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const isExternalUrl = (value: string) => /^https?:\/\//i.test(value);

type UseSupabaseSignedUrlOptions = {
    expiresIn?: number;
    autoRefresh?: boolean;
};

type SignedUrlState = {
    url: string | null;
    isLoading: boolean;
    error: string | null;
};

export const useSupabaseSignedUrl = (
    bucket: string,
    path: string | null,
    { expiresIn = 60 * 60, autoRefresh = true }: UseSupabaseSignedUrlOptions = {}
) => {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const [state, setState] = useState<SignedUrlState>({
        url: null,
        isLoading: false,
        error: null,
    });

    const generate = useCallback(
        async (customPath?: string) => {
            const targetPath = customPath ?? path;

            if (!targetPath) {
                setState({ url: null, isLoading: false, error: null });
                return null;
            }

            if (isExternalUrl(targetPath)) {
                setState({ url: targetPath, isLoading: false, error: null });
                return targetPath;
            }

            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(targetPath, expiresIn);

            if (error || !data?.signedUrl) {
                console.error("Erro ao gerar URL assinada", error);
                setState({
                    url: null,
                    isLoading: false,
                    error: "Não foi possível gerar a URL assinada.",
                });
                return null;
            }

            setState({ url: data.signedUrl, isLoading: false, error: null });
            return data.signedUrl;
        },
        [bucket, expiresIn, path, supabase]
    );

    useEffect(() => {
        if (autoRefresh) {
            void generate();
        }
    }, [autoRefresh, generate, path]);

    return {
        url: state.url,
        isLoading: state.isLoading,
        error: state.error,
        refresh: generate,
    };
};


