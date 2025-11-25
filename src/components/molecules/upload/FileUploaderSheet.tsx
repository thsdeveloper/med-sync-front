"use client";

import type { ReactNode } from "react";

import { BaseSheet, type BaseSheetProps } from "@/components/molecules/BaseSheet";
import {
    SupabaseFileUploader,
    type SupabaseFileUploaderProps,
} from "@/components/organisms/upload/SupabaseFileUploader";

type FileUploaderSheetProps = Omit<BaseSheetProps, "children" | "trigger"> & {
    trigger: ReactNode;
    uploaderProps: SupabaseFileUploaderProps;
};

export const FileUploaderSheet = ({
    trigger,
    uploaderProps,
    title = "Atualizar arquivo",
    description = "Envie um novo arquivo e substitua o anterior.",
    ...sheetProps
}: FileUploaderSheetProps) => {
    return (
        <BaseSheet
            trigger={trigger}
            title={title}
            description={description}
            {...sheetProps}
        >
            <SupabaseFileUploader {...uploaderProps} />
        </BaseSheet>
    );
};


