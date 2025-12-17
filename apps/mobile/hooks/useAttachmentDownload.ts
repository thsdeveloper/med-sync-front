/**
 * useAttachmentDownload Hook
 *
 * Custom hook for downloading and caching chat document attachments.
 * Handles downloading files from Supabase storage, caching them locally,
 * and providing offline access to cached files.
 */

import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import type { ChatAttachment } from '@medsync/shared/schemas';

interface DownloadProgress {
  attachmentId: string;
  progress: number; // 0-100
  status: 'idle' | 'downloading' | 'success' | 'error';
  localUri?: string;
  error?: string;
}

interface UseAttachmentDownloadReturn {
  downloadAttachment: (attachment: ChatAttachment) => Promise<string | null>;
  getLocalUri: (attachment: ChatAttachment) => Promise<string | null>;
  clearCache: (attachment: ChatAttachment) => Promise<void>;
  progress: Record<string, DownloadProgress>;
  // Backwards compatibility methods for AttachmentDisplay
  getCachedUri: (attachmentId: string, fileName: string) => Promise<string | null>;
  isCached: (attachmentId: string, fileName: string) => Promise<boolean>;
}

const CACHE_DIR = `${FileSystem.cacheDirectory}chat-attachments/`;

export const useAttachmentDownload = (): UseAttachmentDownloadReturn => {
  const [progress, setProgress] = useState<Record<string, DownloadProgress>>({});

  /**
   * Ensure cache directory exists
   */
  const ensureCacheDir = useCallback(async () => {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  }, []);

  /**
   * Get local file path for attachment
   */
  const getLocalPath = useCallback((attachment: ChatAttachment): string => {
    // Use attachment ID as filename to avoid conflicts
    const extension = attachment.file_name.split('.').pop() || 'file';
    return `${CACHE_DIR}${attachment.id}.${extension}`;
  }, []);

  /**
   * Check if attachment is cached locally
   */
  const getLocalUri = useCallback(
    async (attachment: ChatAttachment): Promise<string | null> => {
      try {
        const localPath = getLocalPath(attachment);
        const fileInfo = await FileSystem.getInfoAsync(localPath);

        if (fileInfo.exists) {
          return localPath;
        }

        return null;
      } catch (error) {
        console.error('Error checking local cache:', error);
        return null;
      }
    },
    [getLocalPath]
  );

  /**
   * Download attachment from Supabase storage
   */
  const downloadAttachment = useCallback(
    async (attachment: ChatAttachment): Promise<string | null> => {
      try {
        // Check if already cached
        const cachedUri = await getLocalUri(attachment);
        if (cachedUri) {
          return cachedUri;
        }

        // Ensure cache directory exists
        await ensureCacheDir();

        // Update progress to downloading
        setProgress((prev) => ({
          ...prev,
          [attachment.id]: {
            attachmentId: attachment.id,
            progress: 0,
            status: 'downloading',
          },
        }));

        // Download from Supabase storage
        const { data, error } = await supabase.storage
          .from('chat-documents')
          .download(attachment.file_path);

        if (error) {
          throw new Error(`Falha ao baixar arquivo: ${error.message}`);
        }

        if (!data) {
          throw new Error('Nenhum dado recebido do servidor');
        }

        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove data URL prefix
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(data);

        const base64Data = await base64Promise;

        // Save to local file system
        const localPath = getLocalPath(attachment);
        await FileSystem.writeAsStringAsync(localPath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Update progress to success
        setProgress((prev) => ({
          ...prev,
          [attachment.id]: {
            attachmentId: attachment.id,
            progress: 100,
            status: 'success',
            localUri: localPath,
          },
        }));

        return localPath;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro ao baixar arquivo';

        // Update progress to error
        setProgress((prev) => ({
          ...prev,
          [attachment.id]: {
            attachmentId: attachment.id,
            progress: 0,
            status: 'error',
            error: errorMessage,
          },
        }));

        console.error('Error downloading attachment:', error);
        return null;
      }
    },
    [getLocalUri, ensureCacheDir, getLocalPath]
  );

  /**
   * Clear cached file for attachment
   */
  const clearCache = useCallback(
    async (attachment: ChatAttachment): Promise<void> => {
      try {
        const localPath = getLocalPath(attachment);
        const fileInfo = await FileSystem.getInfoAsync(localPath);

        if (fileInfo.exists) {
          await FileSystem.deleteAsync(localPath);
        }

        // Remove from progress state
        setProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[attachment.id];
          return newProgress;
        });
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    },
    [getLocalPath]
  );

  /**
   * Get cached URI by ID and filename (backwards compatibility)
   */
  const getCachedUri = useCallback(
    async (attachmentId: string, fileName: string): Promise<string | null> => {
      try {
        const extension = fileName.split('.').pop() || 'file';
        const localPath = `${CACHE_DIR}${attachmentId}.${extension}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);

        if (fileInfo.exists) {
          return localPath;
        }

        return null;
      } catch (error) {
        console.error('Error getting cached URI:', error);
        return null;
      }
    },
    []
  );

  /**
   * Check if file is cached by ID and filename (backwards compatibility)
   */
  const isCached = useCallback(
    async (attachmentId: string, fileName: string): Promise<boolean> => {
      try {
        const extension = fileName.split('.').pop() || 'file';
        const localPath = `${CACHE_DIR}${attachmentId}.${extension}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        return fileInfo.exists;
      } catch (error) {
        console.error('Error checking cache:', error);
        return false;
      }
    },
    []
  );

  return {
    downloadAttachment,
    getLocalUri,
    clearCache,
    progress,
    getCachedUri,
    isCached,
  };
};
