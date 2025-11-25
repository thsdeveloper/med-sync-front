"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CloudUpload, FileText, Trash2 } from "lucide-react";
import { useSupabaseSignedUrl } from "@/hooks/useSupabaseSignedUrl";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToastMessage } from "@/hooks/useToastMessage";
import { UploadDropzone } from "@/components/molecules/upload/UploadDropzone";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/atoms/Button";

const DEFAULT_ACCEPTED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "application/pdf",
] as const;

const STORAGE_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "med-sync-bucket";

export type UploadedFileInfo = {
    path: string;
    signedUrl: string | null;
    mimeType: string;
    size: number;
};

export type SupabaseFileUploaderProps = {
    label?: string;
    description?: string;
    helperText?: string;
    bucket?: string;
    value?: string | null;
    previewVariant?: "auto" | "image" | "document";
    fileName?: string;
    mimeTypeHint?: string;
    accept?: string[];
    maxSizeMb?: number;
    signedUrlTTL?: number;
    upsert?: boolean;
    disabled?: boolean;
    getFilePath: (file: File) => string;
    onFileUploaded?: (info: UploadedFileInfo) => Promise<void> | void;
};

const isExternalUrl = (value: string) => /^https?:\/\//i.test(value);

const formatFileSize = (bytes: number) =>
    `${(bytes / (1024 * 1024)).toFixed(2)}MB`;

const guessMimeTypeFromPath = (path: string | null) => {
    if (!path) return null;
    const extension = path.split(".").pop()?.toLowerCase();
    if (!extension) return null;
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) {
        return extension === "jpg" ? "image/jpeg" : `image/${extension}`;
    }
    if (extension === "svg") return "image/svg+xml";
    if (extension === "pdf") return "application/pdf";
    return null;
};

const formatAcceptLabel = (value: string) => {
    if (value.includes("/")) {
        return value.split("/").pop()?.toUpperCase() ?? value;
    }
    return value.toUpperCase();
};

const isPdfMime = (value?: string | null) =>
    value?.toLowerCase().includes("pdf") ?? false;

export const SupabaseFileUploader = ({
    label = "Enviar arquivo",
    description = "Envie um arquivo em formato suportado.",
    helperText,
    bucket = STORAGE_BUCKET,
    value,
    previewVariant = "auto",
    fileName,
    mimeTypeHint,
    accept = [...DEFAULT_ACCEPTED_TYPES],
    maxSizeMb = 2,
    signedUrlTTL = 60 * 60 * 24,
    upsert = true,
    disabled,
    getFilePath,
    onFileUploaded,
}: SupabaseFileUploaderProps) => {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const { notifyError, notifySuccess } = useToastMessage();

    const [currentPath, setCurrentPath] = useState<string | null>(value ?? null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [currentMimeType, setCurrentMimeType] = useState<string | null>(
        mimeTypeHint ?? guessMimeTypeFromPath(value ?? null)
    );
    const [currentFileName, setCurrentFileName] = useState<string | null>(
        fileName ?? value?.split("/").pop() ?? null
    );
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null
    );

    useEffect(() => {
        setCurrentPath(value ?? null);
    }, [value]);

    useEffect(() => {
        if (pendingPreviewUrl) return;
        setCurrentMimeType(mimeTypeHint ?? guessMimeTypeFromPath(value ?? null));
        setCurrentFileName(fileName ?? value?.split("/").pop() ?? null);
    }, [fileName, mimeTypeHint, value, pendingPreviewUrl]);

    const {
        url: signedUrl,
        isLoading: isResolvingUrl,
        refresh,
    } = useSupabaseSignedUrl(bucket, currentPath, {
        expiresIn: signedUrlTTL,
        autoRefresh: true,
    });

    useEffect(() => {
        return () => {
            if (pendingPreviewUrl) {
                URL.revokeObjectURL(pendingPreviewUrl);
            }
        };
    }, [pendingPreviewUrl]);

    const clearPendingFile = useCallback(() => {
        if (pendingPreviewUrl) {
            URL.revokeObjectURL(pendingPreviewUrl);
        }
        setPendingFile(null);
        setPendingPreviewUrl(null);
    }, [pendingPreviewUrl]);

    const stopProgressSimulation = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    const startProgressSimulation = useCallback(() => {
        stopProgressSimulation();
        progressIntervalRef.current = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 95) return prev;
                return prev + 5;
            });
        }, 300);
    }, [stopProgressSimulation]);

    useEffect(() => () => stopProgressSimulation(), [stopProgressSimulation]);

    const handleFiles = useCallback(
        (files: File[]) => {
            const file = files[0];
            if (!file) return;

            if (!accept.includes(file.type)) {
                notifyError("Formato não suportado.", {
                    description: `Apenas ${accept
                        .map((type) => formatAcceptLabel(type))
                        .join(", ")} são permitidos.`,
                });
                return;
            }

            if (file.size > maxSizeMb * 1024 * 1024) {
                notifyError("Arquivo muito grande.", {
                    description: `Limite de ${maxSizeMb}MB (${formatFileSize(
                        file.size
                    )} enviados).`,
                });
                return;
            }

            if (pendingPreviewUrl) {
                URL.revokeObjectURL(pendingPreviewUrl);
            }

            setPendingFile(file);
            setPendingPreviewUrl(URL.createObjectURL(file));
            setUploadProgress(0);
        },
        [accept, maxSizeMb, notifyError, pendingPreviewUrl]
    );

    const executeUpload = useCallback(async () => {
        if (!pendingFile) {
            notifyError("Selecione um arquivo antes de enviar.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(5);
        startProgressSimulation();

        const path = getFilePath(pendingFile);

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, pendingFile, {
                cacheControl: "3600",
                contentType: pendingFile.type,
                upsert,
            });

        if (uploadError) {
            console.error("Erro ao enviar arquivo", uploadError);
            notifyError("Não foi possível enviar o arquivo.");
            setIsUploading(false);
            stopProgressSimulation();
            setUploadProgress(0);
            return;
        }

        try {
            const signed = await refresh(path);

            await onFileUploaded?.({
                path,
                signedUrl: signed,
                mimeType: pendingFile.type,
                size: pendingFile.size,
            });

            setCurrentPath(path);
            setCurrentMimeType(pendingFile.type);
            setCurrentFileName(pendingFile.name);
            notifySuccess("Arquivo enviado com sucesso!");
            stopProgressSimulation();
            setUploadProgress(100);
            setTimeout(() => setUploadProgress(0), 800);
            clearPendingFile();
        } catch (error) {
            console.error("Erro pós-upload", error);
            notifyError("Arquivo enviado, mas não foi possível concluir a ação.");
        } finally {
            setIsUploading(false);
            stopProgressSimulation();
        }
    }, [
        bucket,
        clearPendingFile,
        getFilePath,
        notifyError,
        notifySuccess,
        onFileUploaded,
        pendingFile,
        refresh,
        supabase,
        startProgressSimulation,
        stopProgressSimulation,
        upsert,
    ]);

    const previewUrl =
        signedUrl ??
        (isExternalUrl(currentPath ?? "") ? currentPath : null);

    const displayFileName =
        currentFileName ??
        fileName ??
        currentPath?.split("/").pop() ??
        undefined;

    const displayMimeType =
        currentMimeType ?? guessMimeTypeFromPath(currentPath ?? null) ??
        undefined;

    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <UploadDropzone
                    label={label}
                    helperText={
                        helperText ??
                        `Aceitamos ${accept.map(formatAcceptLabel).join(", ")}. Tamanho máximo de ${maxSizeMb}MB.`
                    }
                    accept={accept}
                    onFilesSelected={handleFiles}
                    isLoading={isUploading}
                    disabled={disabled || isUploading}
                >
                    {pendingFile ? (
                        <div className="flex items-center rounded-xl border border-slate-100 bg-white/90 p-4 text-left shadow-sm">
                            <div className="relative mr-4 h-14 w-14 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                {!isPdfMime(pendingFile.type) && pendingPreviewUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={pendingPreviewUrl}
                                        alt={pendingFile.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-red-500">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                    {pendingFile.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {pendingFile.type} • {formatFileSize(pendingFile.size)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-3">
                            <div className="rounded-full bg-white p-3 shadow-sm">
                                <CloudUpload className="h-8 w-8 text-indigo-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">
                                Arraste e solte seu arquivo aqui
                            </p>
                            <p className="text-xs text-slate-500">
                                ou clique para procurar no dispositivo
                            </p>
                        </div>
                    )}
                </UploadDropzone>
                <p className="text-center text-xs text-slate-400">
                    Formatos aceitos: {accept.map(formatAcceptLabel).join(", ")}. Máximo:{" "}
                    {maxSizeMb}MB.
                </p>
            </div>

            {(isUploading || uploadProgress > 0) && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium text-blue-800">
                        <span>Enviando arquivo...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                </div>
            )}

            <div className="h-px w-full bg-slate-200" />

            {currentPath ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">
                            Logo em uso atualmente
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-slate-400 hover:text-red-500"
                            disabled={!onFileUploaded || isUploading}
                            onClick={() => {
                                setCurrentPath(null);
                                setCurrentFileName(null);
                                setCurrentMimeType(null);
                                clearPendingFile();
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {previewUrl && !isPdfMime(displayMimeType) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={previewUrl}
                                    alt="Logo atual"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-red-500">
                                    <FileText className="h-6 w-6" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                                {displayFileName ?? "Logo atual"}
                            </p>
                            <p className="text-xs text-slate-500">
                                {displayMimeType ?? "Formato desconhecido"}
                            </p>
                        </div>
                    </div>
                    {isResolvingUrl && (
                        <p className="mt-2 text-xs text-slate-400">
                            Gerando link seguro...
                        </p>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Nenhum arquivo ainda foi enviado para esta organização.
                </div>
            )}

            <div className="flex flex-col justify-end gap-3 border-t border-slate-100 pt-4 text-right sm:flex-row">
                <Button
                    type="button"
                    variant="ghost"
                    className="text-sm font-medium text-slate-600 hover:text-slate-800"
                    disabled={isUploading}
                    onClick={() => {
                        clearPendingFile();
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    className="rounded-lg bg-indigo-600 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    disabled={!pendingFile || isUploading || disabled}
                    onClick={executeUpload}
                >
                    Salvar alterações
                </Button>
            </div>
        </div>
    );
};