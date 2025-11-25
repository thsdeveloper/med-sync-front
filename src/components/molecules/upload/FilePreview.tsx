"use client";

import { FileText, ImageIcon } from "lucide-react";

type FilePreviewProps = {
    fileName?: string;
    previewUrl?: string | null;
    mimeType?: string | null;
    variant?: "auto" | "image" | "document";
};

const canRenderImage = (variant: FilePreviewProps["variant"], mime?: string | null) => {
    if (variant === "image") return true;
    if (variant === "document") return false;
    return !!mime?.startsWith("image/");
};

export const FilePreview = ({
    fileName,
    previewUrl,
    mimeType,
    variant = "auto",
}: FilePreviewProps) => {
    const showImage = previewUrl && canRenderImage(variant, mimeType);

    if (showImage) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={previewUrl ?? undefined}
                    alt={fileName ?? "Preview do arquivo"}
                    className="h-16 w-16 rounded-md object-cover"
                />
                <div className="text-sm">
                    <p className="font-medium text-slate-700">{fileName ?? "Arquivo"}</p>
                    <p className="text-slate-500">
                        {mimeType ?? "Imagem"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
            {variant === "image" ? (
                <ImageIcon className="size-8 text-slate-400" />
            ) : (
                <FileText className="size-8 text-slate-400" />
            )}
            <div className="text-sm">
                <p className="font-medium text-slate-700">
                    {fileName ?? "Nenhum arquivo selecionado"}
                </p>
                {previewUrl && (
                    <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline-offset-2 hover:underline"
                    >
                        Abrir arquivo
                    </a>
                )}
            </div>
        </div>
    );
};


