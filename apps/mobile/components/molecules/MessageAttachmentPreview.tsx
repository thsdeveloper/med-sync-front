/**
 * MessageAttachmentPreview Molecule Component
 *
 * Displays document attachments within chat messages.
 * Shows image thumbnails, PDF icons, status badges, and handles
 * tap interactions for viewing/opening documents.
 *
 * Part of Atomic Design: Molecule
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import type { ChatAttachment } from '@medsync/shared/schemas';
import { StatusBadge } from '../atoms/StatusBadge';
import { ImageViewer } from './ImageViewer';
import { useAttachmentDownload } from '../../hooks/useAttachmentDownload';

interface MessageAttachmentPreviewProps {
  attachments: ChatAttachment[];
}

/**
 * Format file size to human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  const roundedSize = Math.round(size * 100) / 100;
  return `${roundedSize} ${sizes[i]}`;
};

export const MessageAttachmentPreview: React.FC<MessageAttachmentPreviewProps> = ({
  attachments,
}) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const { downloadAttachment, getLocalUri, progress } = useAttachmentDownload();

  // Separate images and PDFs
  const images = attachments.filter((att) => att.file_type === 'image');
  const pdfs = attachments.filter((att) => att.file_type === 'pdf');

  /**
   * Handle image tap - open fullscreen viewer
   */
  const handleImagePress = async (attachment: ChatAttachment) => {
    try {
      // Check if already cached
      let localUri = await getLocalUri(attachment);

      // If not cached, download
      if (!localUri) {
        localUri = await downloadAttachment(attachment);
      }

      if (localUri) {
        setSelectedImageUri(localUri);
        setViewerVisible(true);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar a imagem');
      }
    } catch (error) {
      console.error('Error opening image:', error);
      Alert.alert('Erro', 'Erro ao abrir imagem');
    }
  };

  /**
   * Handle PDF tap - download and share/open
   */
  const handlePdfPress = async (attachment: ChatAttachment) => {
    try {
      // Check if already cached
      let localUri = await getLocalUri(attachment);

      // If not cached, download
      if (!localUri) {
        localUri = await downloadAttachment(attachment);
      }

      if (!localUri) {
        Alert.alert('Erro', 'Não foi possível baixar o documento');
        return;
      }

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: attachment.file_name,
          UTI: 'com.adobe.pdf', // iOS UTI for PDF
        });
      } else {
        Alert.alert(
          'Indisponível',
          'Compartilhamento de arquivos não está disponível neste dispositivo'
        );
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Erro', 'Erro ao abrir documento');
    }
  };

  /**
   * Handle status badge press - show rejected reason
   */
  const handleReasonPress = (attachment: ChatAttachment) => {
    if (attachment.status === 'rejected' && attachment.rejected_reason) {
      Alert.alert('Motivo da Rejeição', attachment.rejected_reason);
    }
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Image attachments */}
      {images.length > 0 && (
        <View style={styles.imagesContainer}>
          {images.map((attachment) => {
            const downloadProgress = progress[attachment.id];
            const isDownloading = downloadProgress?.status === 'downloading';

            return (
              <TouchableOpacity
                key={attachment.id}
                style={styles.imageCard}
                onPress={() => handleImagePress(attachment)}
                activeOpacity={0.8}
                disabled={isDownloading}
              >
                <ImageThumbnail
                  attachment={attachment}
                  isDownloading={isDownloading}
                />

                {/* Status badge overlay */}
                <View style={styles.imageBadgeContainer}>
                  <StatusBadge
                    status={attachment.status}
                    rejectedReason={attachment.rejected_reason}
                    onReasonPress={() => handleReasonPress(attachment)}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* PDF attachments */}
      {pdfs.map((attachment) => {
        const downloadProgress = progress[attachment.id];
        const isDownloading = downloadProgress?.status === 'downloading';

        return (
          <TouchableOpacity
            key={attachment.id}
            style={styles.pdfCard}
            onPress={() => handlePdfPress(attachment)}
            activeOpacity={0.8}
            disabled={isDownloading}
          >
            <View style={styles.pdfContent}>
              {/* PDF icon */}
              <View style={styles.pdfIcon}>
                <Ionicons name="document-text" size={32} color="#EF4444" />
              </View>

              {/* PDF info */}
              <View style={styles.pdfInfo}>
                <Text style={styles.pdfName} numberOfLines={1}>
                  {attachment.file_name}
                </Text>
                <Text style={styles.pdfSize}>
                  {formatFileSize(attachment.file_size)}
                </Text>
              </View>

              {/* Download indicator or open icon */}
              {isDownloading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="open-outline" size={24} color="#6B7280" />
              )}
            </View>

            {/* Status badge */}
            <View style={styles.pdfBadgeContainer}>
              <StatusBadge
                status={attachment.status}
                rejectedReason={attachment.rejected_reason}
                onReasonPress={() => handleReasonPress(attachment)}
              />
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Image viewer modal */}
      <ImageViewer
        visible={viewerVisible}
        imageUri={selectedImageUri}
        onClose={() => {
          setViewerVisible(false);
          setSelectedImageUri('');
        }}
      />
    </View>
  );
};

/**
 * Image thumbnail component with download handling
 */
const ImageThumbnail: React.FC<{
  attachment: ChatAttachment;
  isDownloading: boolean;
}> = ({ attachment, isDownloading }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { downloadAttachment, getLocalUri } = useAttachmentDownload();

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Check if already cached
        let localUri = await getLocalUri(attachment);

        // If not cached, download
        if (!localUri) {
          localUri = await downloadAttachment(attachment);
        }

        if (localUri) {
          setImageUri(localUri);
        }
      } catch (error) {
        console.error('Error loading thumbnail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [attachment.id]);

  return (
    <View style={styles.imageThumbnailContainer}>
      {loading || isDownloading ? (
        <View style={styles.imageLoading}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      ) : imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.imageThumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imageError}>
          <Ionicons name="image-outline" size={32} color="#9CA3AF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  imageThumbnailContainer: {
    width: '100%',
    height: '100%',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  imageLoading: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imageError: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imageBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  pdfCard: {
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  pdfContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    gap: 4,
  },
  pdfName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  pdfSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  pdfBadgeContainer: {
    marginTop: 4,
  },
});
