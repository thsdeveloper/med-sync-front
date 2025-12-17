/**
 * AttachmentReviewDialog Component
 *
 * Organism component following Atomic Design methodology.
 * Provides a confirmation dialog for reviewing document attachments (accept/reject).
 *
 * Features:
 * - Accept action: Simple confirmation with attachment preview
 * - Reject action: Requires rejection reason (textarea, max 500 chars)
 * - Displays attachment metadata (filename, size, upload date)
 * - Loading states during submission
 * - Form validation for rejection reason
 *
 * @component
 * @example
 * ```tsx
 * <AttachmentReviewDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   attachment={selectedAttachment}
 *   action="accept"
 *   onConfirm={handleConfirm}
 *   isLoading={isSubmitting}
 * />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ChatAttachment } from '@medsync/shared';

interface AttachmentReviewDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * The attachment being reviewed
   */
  attachment: ChatAttachment | null;

  /**
   * The review action type
   */
  action: 'accept' | 'reject';

  /**
   * Callback when user confirms the action
   * For accept: called immediately
   * For reject: called with rejection reason as parameter
   */
  onConfirm: (rejectionReason?: string) => void;

  /**
   * Loading state during submission
   */
  isLoading?: boolean;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AttachmentReviewDialog({
  open,
  onOpenChange,
  attachment,
  action,
  onConfirm,
  isLoading = false,
}: AttachmentReviewDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [validationError, setValidationError] = useState('');

  // Reset form when dialog opens/closes or action changes
  useEffect(() => {
    if (!open) {
      setRejectionReason('');
      setValidationError('');
    }
  }, [open]);

  if (!attachment) return null;

  const handleConfirm = () => {
    // Validate rejection reason if action is 'reject'
    if (action === 'reject') {
      const trimmedReason = rejectionReason.trim();

      if (trimmedReason.length === 0) {
        setValidationError('Motivo da rejeição é obrigatório');
        return;
      }

      if (trimmedReason.length > 500) {
        setValidationError('Motivo muito longo. Máximo: 500 caracteres');
        return;
      }

      onConfirm(trimmedReason);
    } else {
      onConfirm();
    }
  };

  const handleReasonChange = (value: string) => {
    setRejectionReason(value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const uploadDate = format(new Date(attachment.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const isAccept = action === 'accept';
  const title = isAccept ? 'Aprovar Documento' : 'Rejeitar Documento';
  const description = isAccept
    ? 'Você tem certeza que deseja aprovar este documento? Ele ficará visível para todos os participantes da conversa.'
    : 'Informe o motivo da rejeição. Esta informação será visível para quem enviou o documento.';

  const confirmButtonText = isAccept ? 'Aprovar' : 'Rejeitar';
  const confirmButtonVariant = isAccept ? 'default' : 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Attachment Preview */}
        <div className="py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
            <div className="flex-shrink-0 w-12 h-12 rounded bg-background flex items-center justify-center">
              {attachment.file_type === 'pdf' ? (
                <FileText className="h-6 w-6 text-red-500" />
              ) : (
                <ImageIcon className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" title={attachment.file_name}>
                {attachment.file_name}
              </p>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <p>{formatFileSize(attachment.file_size)}</p>
                <p>Enviado {uploadDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Reason Input */}
        {!isAccept && (
          <div className="space-y-2">
            <Label htmlFor="rejection-reason" className="text-sm font-medium">
              Motivo da Rejeição <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explique por que este documento foi rejeitado..."
              value={rejectionReason}
              onChange={(e) => handleReasonChange(e.target.value)}
              rows={4}
              maxLength={500}
              className={validationError ? 'border-destructive focus-visible:ring-destructive' : ''}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center">
              {validationError ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {rejectionReason.length}/500 caracteres
                </p>
              )}
            </div>
          </div>
        )}

        {/* Warning for Accept Action */}
        {isAccept && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta ação não pode ser desfeita. O documento aprovado ficará permanentemente visível
              na conversa.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              confirmButtonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
