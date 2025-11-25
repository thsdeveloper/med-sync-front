"use client";

import type { ReactNode } from "react";

type UploadHintProps = {
    children: ReactNode;
};

export const UploadHint = ({ children }: UploadHintProps) => {
    return (
        <p className="text-xs font-medium text-slate-500">
            {children}
        </p>
    );
};


