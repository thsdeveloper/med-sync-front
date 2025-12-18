'use client';

import { memo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { cn } from '@/lib/utils';
import type { ChatAttachment } from '@medsync/shared';

interface AttachmentPreviewModalProps {
  attachment: ChatAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (attachment: ChatAttachment) => void;
  signedUrl?: string | null;
  isLoading?: boolean;
}

/**
 * AttachmentPreviewModal - Full-screen lightbox for viewing PDFs and images
 */
export const AttachmentPreviewModal = memo(function AttachmentPreviewModal({
  attachment,
  open,
  onOpenChange,
  onDownload,
  signedUrl,
  isLoading,
}: AttachmentPreviewModalProps) {
  const [imageRotation, setImageRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  const isImage = attachment?.file_type === 'image';
  const isPdf = attachment?.file_type === 'pdf';

  const handleRotate = useCallback(() => {
    setImageRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    if (attachment && onDownload) {
      onDownload(attachment);
    }
  }, [attachment, onDownload]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset state on close
    setImageRotation(0);
    setImageError(false);
  }, [onOpenChange]);

  if (!attachment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 bg-black/95 border-none">
        <DialogTitle className="sr-only">
          Visualizar {attachment.file_name}
        </DialogTitle>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3 text-white">
            <FileText className="h-5 w-5" />
            <span className="font-medium truncate max-w-[300px]">
              {attachment.file_name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Image controls */}
            {isImage && signedUrl && !imageError && (
              <>
                <TransformWrapper>
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => zoomOut()}
                        className="text-white hover:bg-white/20"
                        aria-label="Diminuir zoom"
                      >
                        <ZoomOut className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => zoomIn()}
                        className="text-white hover:bg-white/20"
                        aria-label="Aumentar zoom"
                      >
                        <ZoomIn className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </TransformWrapper>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRotate}
                  className="text-white hover:bg-white/20"
                  aria-label="Girar imagem"
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Download */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
              aria-label="Baixar arquivo"
            >
              <Download className="h-5 w-5" />
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-white">
              <Loader2 className="h-12 w-12 animate-spin" />
              <p>Carregando...</p>
            </div>
          ) : !signedUrl ? (
            <div className="flex flex-col items-center gap-4 text-white">
              <FileText className="h-16 w-16 opacity-50" />
              <p>Não foi possível carregar o arquivo</p>
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar arquivo
              </Button>
            </div>
          ) : isImage ? (
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit
            >
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                {imageError ? (
                  <div className="flex flex-col items-center gap-4 text-white">
                    <FileText className="h-16 w-16 opacity-50" />
                    <p>Não foi possível carregar a imagem</p>
                  </div>
                ) : (
                  <img
                    src={signedUrl}
                    alt={attachment.file_name}
                    className="max-w-full max-h-[80vh] object-contain"
                    style={{ transform: `rotate(${imageRotation}deg)` }}
                    onError={() => setImageError(true)}
                  />
                )}
              </TransformComponent>
            </TransformWrapper>
          ) : isPdf ? (
            <iframe
              src={`${signedUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full bg-white"
              title={attachment.file_name}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white">
              <FileText className="h-16 w-16 opacity-50" />
              <p>Formato não suportado para visualização</p>
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar arquivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
