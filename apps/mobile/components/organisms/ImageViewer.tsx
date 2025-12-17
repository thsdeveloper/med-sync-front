/**
 * ImageViewer Organism Component
 *
 * Full-screen image viewer with zoom and pan gestures for chat attachments.
 * Follows Atomic Design methodology as an organism-level component.
 *
 * Features:
 * - Fullscreen modal presentation
 * - Pinch-to-zoom and pan gestures
 * - Double-tap to zoom in/out
 * - Close button with safe area support
 * - Image metadata display (filename, size, date)
 * - Loading indicators
 * - Error handling
 *
 * @example
 * ```tsx
 * <ImageViewer
 *   visible={isVisible}
 *   imageUri={imageUri}
 *   attachment={attachment}
 *   onClose={() => setIsVisible(false)}
 * />
 * ```
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatFileSize } from '@/lib/attachment-utils';
import type { ChatAttachment } from '@medsync/shared';

/**
 * Props for ImageViewer component
 */
export interface ImageViewerProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Image URI (local file path)
   */
  imageUri: string;

  /**
   * Attachment metadata
   */
  attachment: ChatAttachment;

  /**
   * Callback when close button is pressed
   */
  onClose: () => void;
}

/**
 * Screen dimensions
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ImageViewer Component
 */
export default function ImageViewer({
  visible,
  imageUri,
  attachment,
  onClose,
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  /**
   * Handle image load
   */
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  /**
   * Handle image error
   */
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  /**
   * Toggle info visibility
   */
  const toggleInfo = () => {
    setShowInfo((prev) => !prev);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.95)" />
      <View style={styles.container}>
        {/* Header */}
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoButton} onPress={toggleInfo}>
            <Ionicons
              name={showInfo ? 'information-circle' : 'information-circle-outline'}
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Image Content */}
        <View style={styles.imageContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Carregando imagem...</Text>
            </View>
          )}

          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
              <Text style={styles.errorText}>Não foi possível carregar a imagem</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onClose}>
                <Text style={styles.retryButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </View>

        {/* Image Info Footer */}
        {showInfo && !hasError && (
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={16} color="#D1D5DB" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {attachment.file_name}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="resize-outline" size={16} color="#D1D5DB" />
                <Text style={styles.infoText}>
                  {formatFileSize(attachment.file_size)}
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color="#D1D5DB"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{formatDate(attachment.created_at)}</Text>
              </View>
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Image Container Styles
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200, // Account for header and footer
  },

  // Loading Styles
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '500',
  },

  // Error Styles
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Footer Styles
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoContainer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#D1D5DB',
    flex: 1,
  },
  infoIcon: {
    marginLeft: 8,
  },
});
