/**
 * AttachmentPreview Molecule Component
 *
 * Displays preview of selected files before sending:
 * - Image files: Show thumbnail preview
 * - PDF files: Show file icon with name and size
 * - Allows removing individual attachments
 * - Shows file count and limit warning
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatFileSize,
  getFileIconName,
  isImageFile,
  MAX_ATTACHMENTS_PER_MESSAGE,
  type SelectedFile,
} from '@/lib/attachment-utils';

interface AttachmentPreviewProps {
  /** Array of selected files to preview */
  files: SelectedFile[];
  /** Callback when a file is removed */
  onRemoveFile: (index: number) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
}

export default function AttachmentPreview({
  files,
  onRemoveFile,
  maxFiles = MAX_ATTACHMENTS_PER_MESSAGE,
}: AttachmentPreviewProps) {
  if (files.length === 0) return null;

  const isAtLimit = files.length >= maxFiles;

  return (
    <View style={styles.container}>
      {/* File count and limit indicator */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'} selecionado
          {files.length !== 1 ? 's' : ''}
        </Text>
        {isAtLimit && (
          <View style={styles.limitBadge}>
            <Text style={styles.limitText}>Limite atingido</Text>
          </View>
        )}
      </View>

      {/* File previews */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {files.map((file, index) => (
          <View key={`${file.uri}-${index}`} style={styles.fileCard}>
            {/* Remove button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveFile(index)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>

            {/* File preview */}
            {isImageFile(file.type) ? (
              <Image source={{ uri: file.uri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.documentPreview}>
                <Ionicons
                  name={getFileIconName(file.type) as any}
                  size={40}
                  color="#F59E0B"
                />
              </View>
            )}

            {/* File info */}
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  limitBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  fileCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  imagePreview: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  documentPreview: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    marginTop: 8,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});
