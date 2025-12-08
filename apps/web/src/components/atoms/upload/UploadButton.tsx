"use client";

import { Loader2, UploadCloud } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/atoms/Button";

type UploadButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
    isLoading?: boolean;
    label?: string;
};

export const UploadButton = ({
    isLoading,
    label = "Selecionar arquivo",
    disabled,
    ...props
}: UploadButtonProps) => {
    return (
        <Button
            type="button"
            variant="secondary"
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enviando...
                </>
            ) : (
                <>
                    <UploadCloud className="mr-2 size-4" />
                    {label}
                </>
            )}
        </Button>
    );
};


