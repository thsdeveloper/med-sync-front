/**
 * DocumentAttachmentCard Component
 *
 * Molecule component following Atomic Design methodology.
 * Displays a document attachment card with thumbnail/icon, metadata, and review actions.
 *
 * Features:
 * - PDF icon or image thumbnail based on file type
 * - Filename, upload date (relative time), file size display
 * - Status badge (pending, accepted, rejected)
 * - Accept/Reject action buttons (only for pending attachments)
 * - Click to view full-size image or download PDF
 * - Rejection reason display for rejected documents
 *
 * @component
 * @example
 * ```tsx
 * <DocumentAttachmentCard
 *   attachment={attachment}
 *   onAccept={() => handleAccept(attachment.id)}
 *   onReject={() => handleReject(attachment.id)}
 *   onView={() => handleView(attachment)}
 * />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Image as ImageIcon, Download, Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ChatAttachment } from '@medsync/shared';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface DocumentAttachmentCardProps {
  /**
   * The attachment object from database
   */
  attachment: ChatAttachment;

  /**
   * Callback when Accept button is clicked (only shown for pending attachments)
   */
  onAccept?: () => void;

  /**
   * Callback when Reject button is clicked (only shown for pending attachments)
   */
  onReject?: () => void;

  /**
   * Callback when user clicks to view the attachment
   */
  onView?: () => void;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Whether to show action buttons (default: true for pending attachments)
   */
  showActions?: boolean;

  /**
   * Loading state for actions
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

/**
 * Get status badge variant and label
 */
function getStatusInfo(status: ChatAttachment['status']) {
  switch (status) {
    case 'pending':
      return { variant: 'secondary' as const, label: 'Pendente', color: 'bg-yellow-500' };
    case 'accepted':
      return { variant: 'default' as const, label: 'Aprovado', color: 'bg-green-500' };
    case 'rejected':
      return { variant: 'destructive' as const, label: 'Rejeitado', color: 'bg-red-500' };
    default:
      return { variant: 'outline' as const, label: 'Desconhecido', color: 'bg-gray-500' };
  }
}

export function DocumentAttachmentCard({
  attachment,
  onAccept,
  onReject,
  onView,
  className,
  showActions = true,
  isLoading = false,
}: DocumentAttachmentCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const isPending = attachment.status === 'pending';
  const shouldShowActions = showActions && isPending && !isLoading;
  const statusInfo = getStatusInfo(attachment.status);

  // Generate signed URL for image thumbnails
  useEffect(() => {
    if (attachment.file_type === 'image' && !thumbnailError) {
      const generateSignedUrl = async () => {
        try {
          const { data, error } = await supabase.storage
            .from('chat-documents')
            .createSignedUrl(attachment.file_path, 3600); // 1 hour expiry

          if (error) throw error;
          if (data?.signedUrl) {
            setThumbnailUrl(data.signedUrl);
          }
        } catch (err) {
          console.error('Error generating signed URL:', err);
          setThumbnailError(true);
        }
      };

      generateSignedUrl();
    }
  }, [attachment.file_type, attachment.file_path, supabase, thumbnailError]);

  // Relative time display
  const uploadedAt = formatDistanceToNow(new Date(attachment.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className={cn('overflow-hidden hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Thumbnail/Icon */}
          <button
            onClick={onView}
            className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
            disabled={!onView}
            type="button"
          >
            {attachment.file_type === 'pdf' ? (
              <FileText className="h-8 w-8 text-red-500" />
            ) : thumbnailUrl && !thumbnailError ? (
              <img
                src={thumbnailUrl}
                alt={attachment.file_name}
                className="w-full h-full object-cover"
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </button>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <button
                onClick={onView}
                className="font-medium text-sm hover:underline cursor-pointer text-left truncate"
                disabled={!onView}
                type="button"
                title={attachment.file_name}
              >
                {attachment.file_name}
              </button>
              <Badge variant={statusInfo.variant} className="flex-shrink-0 text-xs">
                {statusInfo.label}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>{formatFileSize(attachment.file_size)}</p>
              <p>{uploadedAt}</p>
            </div>

            {/* Rejection reason */}
            {attachment.status === 'rejected' && attachment.rejected_reason && (
              <div className="mt-2 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-destructive">
                    <p className="font-medium mb-0.5">Motivo da rejeição:</p>
                    <p className="leading-relaxed">{attachment.rejected_reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {shouldShowActions && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs flex-1"
                  onClick={onAccept}
                  disabled={isLoading}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs flex-1"
                  onClick={onReject}
                  disabled={isLoading}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
