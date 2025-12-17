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
}: AttachmentDisplayProps) {
  const { getCachedUri, isCached } = useAttachmentDownload();
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  /**
   * Load cached image URIs on mount
   */
  useEffect(() => {
    const loadCachedImages = async () => {
      const uris: Record<string, string> = {};

      for (const attachment of attachments) {
        if (attachment.file_type === 'image' && attachment.status === 'accepted') {
          const cachedUri = await getCachedUri(attachment.id, attachment.file_name);
          if (cachedUri) {
            uris[attachment.id] = cachedUri;
          }
        }
      }

      setImageUris(uris);
    };

    loadCachedImages();
  }, [attachments, getCachedUri]);

  /**
   * Handle image tap - download if not cached
   */
  const handleImageTap = async (attachment: ChatAttachment) => {
    if (attachment.status !== 'accepted') {
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
   */
  const handlePdfTap = async (attachment: ChatAttachment) => {
    if (attachment.status !== 'accepted') {
      Alert.alert('PDF Indisponível', 'Este documento ainda não foi aprovado.');
      return;
    }

    try {
      const cached = await isCached(attachment.id, attachment.file_name);
      const uri = cached
        ? await getCachedUri(attachment.id, attachment.file_name)
        : null;

      if (uri) {
        onPdfPress(attachment, uri);
      } else {
        Alert.alert(
          'Download Necessário',
          'Este documento precisa ser baixado. Deseja baixar agora?'
        );
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

    return (
      <TouchableOpacity
        key={attachment.id}
        style={styles.imageContainer}
        onPress={() => handleImageTap(attachment)}
        disabled={attachment.status !== 'accepted' || isLoading}
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
    );
  };

  /**
   * Render PDF attachment
   */
  const renderPdfAttachment = (attachment: ChatAttachment) => {
    return (
      <TouchableOpacity
        key={attachment.id}
        style={[
          styles.pdfContainer,
          attachment.status !== 'accepted' && styles.pdfContainerDisabled,
        ]}
        onPress={() => handlePdfTap(attachment)}
        disabled={attachment.status !== 'accepted'}
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
