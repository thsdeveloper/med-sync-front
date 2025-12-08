"use client"

import { CloudUpload } from "lucide-react"
import { useCallback, useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/atoms/Button"
import { UploadHint } from "@/components/atoms/upload/UploadHint"
import { cn } from "@/lib/utils"

type UploadDropzoneProps = {
    accept?: string[]
    multiple?: boolean
    disabled?: boolean
    isLoading?: boolean
    label?: string
    helperText?: string
    onFilesSelected: (files: File[]) => void
    children?: ReactNode
}

export const UploadDropzone = ({
    accept,
    multiple,
    disabled,
    isLoading,
    label,
    helperText,
    onFilesSelected,
    children,
}: UploadDropzoneProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const handleFiles = useCallback(
        (fileList: FileList | null | undefined) => {
            if (!fileList?.length) return
            const files = Array.from(fileList)
            onFilesSelected(multiple ? files : [files[0]])
        },
        [multiple, onFilesSelected]
    )

    const handleDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault()
            if (disabled) return
            setIsDragging(false)
            handleFiles(event.dataTransfer.files)
        },
        [disabled, handleFiles]
    )

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault()
                if (disabled) return
                setIsDragging(true)
            }}
            onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) return
                setIsDragging(false)
            }}
            onDrop={handleDrop}
            className={cn(
                "rounded-2xl border-2 border-dashed p-5 transition-all",
                disabled
                    ? "border-slate-200 bg-slate-50 text-slate-400"
                    : "border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-50",
                isDragging && !disabled && "border-indigo-400 bg-indigo-50"
            )}
        >
            <div className="grid gap-3 md:grid-cols-[2fr_auto] md:items-center">
                <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-slate-800">
                        {label ?? "Arraste e solte ou clique para selecionar"}
                    </p>
                    {helperText && <UploadHint>{helperText}</UploadHint>}
                </div>
                <div className="md:text-right">
                    <Button
                        type="button"
                        variant="white"
                        className="rounded-lg border border-slate-200 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        disabled={disabled || isLoading}
                        onClick={() => inputRef.current?.click()}
                    >
                        Selecionar arquivo
                    </Button>
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                hidden
                accept={accept?.join(",")}
                multiple={multiple}
                disabled={disabled || isLoading}
                onChange={(event) => {
                    handleFiles(event.target.files)
                    event.target.value = ""
                }}
            />

            <div className="mt-6 rounded-xl border border-white/60 bg-white/70 p-6 text-center shadow-sm">
                {children ?? (
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
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700"
                            disabled={disabled || isLoading}
                            onClick={() => inputRef.current?.click()}
                        >
                            Selecionar arquivo
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}


