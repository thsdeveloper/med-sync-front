/**
 * AttachmentDisplay Molecule Component
 *
 * Displays document attachments in chat message bubbles following Atomic Design methodology.
 * Shows image thumbnails, PDF file cards, and status badges (pending/accepted/rejected).
 *
 * Features:
 * - Image thumbnails with tap-to-view fullscreen
 * - PDF file cards with icon, filename, and size
 * - Status badges with appropriate colors
 * - Loading indicators during download
 * - Rejection reason display for rejected attachments
 * - Offline support with cached files
 *
 * @example
 * ```tsx
 * <AttachmentDisplay
 *   attachments={message.attachments}
 *   onImagePress={handleImagePress}
 *   onPdfPress={handlePdfPress}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatFileSize } from '@/lib/attachment-utils';
import { useAttachmentDownload } from '@/hooks/useAttachmentDownload';
import type { ChatAttachment } from '@medsync/shared';

/**
 * Props for AttachmentDisplay component
 */
export interface AttachmentDisplayProps {
  /**
   * Array of attachments to display
   */
  attachments: ChatAttachment[];

  /**
   * Callback when image attachment is tapped
   */
  onImagePress: (attachment: ChatAttachment, imageUri: string) => void;

  /**
   * Callback when PDF attachment is tapped
   */
  onPdfPress: (attachment: ChatAttachment, pdfUri: string) => void;

  /**
   * Whether this is the user's own message (affects styling)
   */
  isOwnMessage?: boolean;

  /**
   * Callback when delete button is pressed for a pending attachment
   * Only called for own messages with pending status
   */
  onDelete?: (attachment: ChatAttachment) => void;
}

/**
 * Status badge colors
 */
const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  accepted: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};

/**
 * Status badge labels
 */
const STATUS_LABELS = {
  pending: 'Pendente',
  accepted: 'Aprovado',
  rejected: 'Rejeitado',
};

/**
 * AttachmentDisplay Component
 */
export default function AttachmentDisplay({
  attachments,
  onImagePress,
  onPdfPress,
  isOwnMessage = false,
  onDelete,
}: AttachmentDisplayProps) {
  const { getCachedUri, isCached, downloadAttachment } = useAttachmentDownload();
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  /**
   * Load cached image URIs on mount
   * For own messages, also load pending attachments
   */
  useEffect(() => {
    const loadCachedImages = async () => {
      const uris: Record<string, string> = {};

      for (const attachment of attachments) {
        // Load images that are accepted, or pending if it's own message
        const shouldLoad = attachment.file_type === 'image' &&
          (attachment.status === 'accepted' || (isOwnMessage && attachment.status === 'pending'));

        if (shouldLoad) {
          const cachedUri = await getCachedUri(attachment.id, attachment.file_name);
          if (cachedUri) {
            uris[attachment.id] = cachedUri;
          } else if (isOwnMessage && attachment.status === 'pending') {
            // For pending own attachments, try to download
            const downloaded = await downloadAttachment(attachment);
            if (downloaded) {
              uris[attachment.id] = downloaded;
            }
          }
        }
      }

      setImageUris(uris);
    };

    loadCachedImages();
  }, [attachments, getCachedUri, isOwnMessage, downloadAttachment]);

  /**
   * Handle image tap - download if not cached
   * Allow own pending messages to be viewed
   */
  const handleImageTap = async (attachment: ChatAttachment) => {
    // Block viewing for non-accepted attachments unless it's own pending message
    const canView = attachment.status === 'accepted' ||
      (isOwnMessage && attachment.status === 'pending');

    if (!canView) {
      Alert.alert('Imagem Indisponível', 'Esta imagem ainda não foi aprovada.');
      return;
    }

    setLoadingImages((prev) => new Set(prev).add(attachment.id));

    try {
      // Check if already cached
      let uri = imageUris[attachment.id];

      if (!uri) {
        // Download and cache
        const cached = await isCached(attachment.id, attachment.file_name);
        if (cached) {
          uri = (await getCachedUri(attachment.id, attachment.file_name))!;
          setImageUris((prev) => ({ ...prev, [attachment.id]: uri }));
        } else {
          // Try to download
          const downloaded = await downloadAttachment(attachment);
          if (downloaded) {
            uri = downloaded;
            setImageUris((prev) => ({ ...prev, [attachment.id]: uri }));
          }
        }
      }

      if (uri) {
        onImagePress(attachment, uri);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      Alert.alert('Erro', 'Não foi possível carregar a imagem.');
    } finally {
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(attachment.id);
        return next;
      });
    }
  };

  /**
   * Handle PDF tap - download if not cached
   * Allow own pending messages to be viewed
   */
  const handlePdfTap = async (attachment: ChatAttachment) => {
    // Block viewing for non-accepted attachments unless it's own pending message
    const canView = attachment.status === 'accepted' ||
      (isOwnMessage && attachment.status === 'pending');

    if (!canView) {
      Alert.alert('PDF Indisponível', 'Este documento ainda não foi aprovado.');
      return;
    }

    try {
      const cached = await isCached(attachment.id, attachment.file_name);
      let uri = cached
        ? await getCachedUri(attachment.id, attachment.file_name)
        : null;

      if (!uri) {
        // Try to download
        uri = await downloadAttachment(attachment);
      }

      if (uri) {
        onPdfPress(attachment, uri);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar o documento.');
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      Alert.alert('Erro', 'Não foi possível carregar o documento.');
    }
  };

  /**
   * Render status badge
   */
  const renderStatusBadge = (status: ChatAttachment['status']) => {
    const colors = STATUS_COLORS[status];
    const label = STATUS_LABELS[status];

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: colors.bg, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.statusText, { color: colors.text }]}>{label}</Text>
      </View>
    );
  };

  /**
   * Render image attachment
   */
  const renderImageAttachment = (attachment: ChatAttachment) => {
    const imageUri = imageUris[attachment.id];
    const isLoading = loadingImages.has(attachment.id);
    // Allow tap for accepted or own pending attachments
    const canTap = attachment.status === 'accepted' ||
      (isOwnMessage && attachment.status === 'pending');
    // Show delete button for own pending attachments
    const canDelete = isOwnMessage && attachment.status === 'pending' && onDelete;

    return (
      <View key={attachment.id} style={styles.attachmentWrapper}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => handleImageTap(attachment)}
          disabled={!canTap || isLoading}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imageThumbnail} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            </View>
          )}

          {isLoading && (
            <View style={styles.imageLoading}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}

          {attachment.status !== 'accepted' && (
            <View style={styles.imageOverlay}>
              {renderStatusBadge(attachment.status)}
            </View>
          )}

          {attachment.status === 'rejected' && attachment.rejected_reason && (
            <View style={styles.rejectedReason}>
              <Text style={styles.rejectedReasonText} numberOfLines={2}>
                {attachment.rejected_reason}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Delete button for own pending attachments */}
        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(attachment)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Approved checkmark for own accepted attachments */}
        {isOwnMessage && attachment.status === 'accepted' && (
          <View style={styles.approvedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
      </View>
    );
  };

  /**
   * Render PDF attachment
   */
  const renderPdfAttachment = (attachment: ChatAttachment) => {
    // Allow tap for accepted or own pending attachments
    const canTap = attachment.status === 'accepted' ||
      (isOwnMessage && attachment.status === 'pending');
    // Show delete button for own pending attachments
    const canDelete = isOwnMessage && attachment.status === 'pending' && onDelete;
    // Only show as disabled for rejected or non-own pending
    const isDisabled = attachment.status === 'rejected' ||
      (attachment.status === 'pending' && !isOwnMessage);

    return (
      <View key={attachment.id} style={styles.attachmentWrapper}>
        <TouchableOpacity
          style={[
            styles.pdfContainer,
            isDisabled && styles.pdfContainerDisabled,
          ]}
          onPress={() => handlePdfTap(attachment)}
          disabled={!canTap}
        >
          <View style={styles.pdfIcon}>
            <Ionicons name="document-text" size={32} color="#DC2626" />
          </View>

          <View style={styles.pdfInfo}>
            <Text style={styles.pdfFileName} numberOfLines={1}>
              {attachment.file_name}
            </Text>
            <Text style={styles.pdfFileSize}>
              {formatFileSize(attachment.file_size)}
            </Text>
          </View>

          {attachment.status !== 'accepted' && renderStatusBadge(attachment.status)}

          {attachment.status === 'rejected' && attachment.rejected_reason && (
            <View style={styles.pdfRejectedReason}>
              <Text style={styles.rejectedReasonText} numberOfLines={2}>
                {attachment.rejected_reason}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Delete button for own pending attachments */}
        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButtonPdf}
            onPress={() => onDelete(attachment)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Approved checkmark for own accepted attachments */}
        {isOwnMessage && attachment.status === 'accepted' && (
          <View style={styles.approvedBadgePdf}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
      </View>
    );
  };

  // Don't render if no attachments
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {attachments.map((attachment) => {
        if (attachment.file_type === 'image') {
          return renderImageAttachment(attachment);
        } else if (attachment.file_type === 'pdf') {
          return renderPdfAttachment(attachment);
        }
        return null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 4,
  },

  // Wrapper for attachment with delete button
  attachmentWrapper: {
    position: 'relative',
  },

  // Delete button for images (positioned at top-right corner)
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 10,
  },

  // Delete button for PDFs (positioned at top-right corner)
  deleteButtonPdf: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 10,
  },

  // Approved badge for images (positioned at top-right corner)
  approvedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 10,
  },

  // Approved badge for PDFs (positioned at top-right corner)
  approvedBadgePdf: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 10,
  },

  // Image Attachment Styles
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // PDF Attachment Styles
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  pdfContainerDisabled: {
    opacity: 0.6,
  },
  pdfIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfInfo: {
    flex: 1,
  },
  pdfFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  pdfFileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  pdfRejectedReason: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },

  // Status Badge Styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Rejected Reason Styles
  rejectedReason: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  rejectedReasonText: {
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 14,
  },
});
