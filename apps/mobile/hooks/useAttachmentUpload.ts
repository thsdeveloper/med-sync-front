/**
 * useAttachmentUpload Hook
 *
 * Custom hook for uploading file attachments to Supabase storage
 * and creating attachment metadata records in the chat_attachments table.
 *
 * Features:
 * - Parallel file uploads with progress tracking
 * - Automatic retry on failure
 * - File validation before upload
 * - Creates chat_attachments records with proper metadata
 * - Links attachments to messages after successful upload
 */

import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { decode as base64Decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import {
  generateStoragePath,
  validateFiles,
  type SelectedFile,
} from '@/lib/attachment-utils';
import type { UploadAttachmentData } from '@medsync/shared';

interface UploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadResult {
  success: boolean;
  attachmentId?: string;
  fileName: string;
  error?: string;
}

interface UseAttachmentUploadReturn {
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Upload progress for each file */
  uploadProgress: UploadProgress[];
  /** Upload files to storage and create attachment records */
  uploadFiles: (
    files: SelectedFile[],
    conversationId: string,
    organizationId: string,
    senderId: string,
    messageId?: string
  ) => Promise<UploadResult[]>;
  /** Reset upload state */
  reset: () => void;
}

const STORAGE_BUCKET = 'chat-documents';
const MAX_RETRIES = 2;

export function useAttachmentUpload(): UseAttachmentUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  /**
   * Updates progress for a specific file
   */
  const updateFileProgress = useCallback(
    (
      fileIndex: number,
      update: Partial<Omit<UploadProgress, 'fileIndex' | 'fileName'>>
    ) => {
      setUploadProgress((prev) =>
        prev.map((item, idx) =>
          idx === fileIndex ? { ...item, ...update } : item
        )
      );
    },
    []
  );

  /**
   * Uploads a single file to Supabase storage
   */
  const uploadToStorage = async (
    file: SelectedFile,
    storagePath: string,
    retries = 0
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const arrayBuffer = base64Decode(base64);

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, arrayBuffer, {
          contentType: file.mimeType,
          upsert: false,
        });

      if (error) {
        // Retry on failure
        if (retries < MAX_RETRIES) {
          console.log(
            `Upload failed for ${file.name}, retrying... (${retries + 1}/${MAX_RETRIES})`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1)));
          return uploadToStorage(file, storagePath, retries + 1);
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      };
    }
  };

  /**
   * Creates attachment metadata record in database
   */
  const createAttachmentRecord = async (
    data: UploadAttachmentData & { sender_id: string; file_path: string }
  ): Promise<{ success: boolean; attachmentId?: string; error?: string }> => {
    try {
      const { data: attachment, error } = await supabase
        .from('chat_attachments')
        .insert({
          conversation_id: data.conversation_id,
          message_id: data.message_id,
          sender_id: data.sender_id,
          file_name: data.file_name,
          file_type: data.file_type,
          file_path: data.file_path,
          file_size: data.file_size,
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, attachmentId: attachment.id };
    } catch (error) {
      console.error('Error creating attachment record:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro ao salvar anexo',
      };
    }
  };

  /**
   * Links attachment to message after message is created
   */
  const linkAttachmentToMessage = async (
    attachmentId: string,
    messageId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('chat_attachments')
        .update({ message_id: messageId })
        .eq('id', attachmentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error linking attachment to message:', error);
      return false;
    }
  };

  /**
   * Uploads files and creates attachment records
   */
  const uploadFiles = useCallback(
    async (
      files: SelectedFile[],
      conversationId: string,
      organizationId: string,
      senderId: string,
      messageId?: string
    ): Promise<UploadResult[]> => {
      // Validate files
      const validation = validateFiles(files);
      if (!validation.isValid) {
        return files.map((file) => ({
          success: false,
          fileName: file.name,
          error: validation.error,
        }));
      }

      // Initialize progress tracking
      setIsUploading(true);
      setUploadProgress(
        files.map((file, index) => ({
          fileIndex: index,
          fileName: file.name,
          progress: 0,
          status: 'pending',
        }))
      );

      const results: UploadResult[] = [];

      // Upload files sequentially to avoid overwhelming the connection
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        updateFileProgress(i, { status: 'uploading', progress: 0 });

        // Generate storage path
        const storagePath = generateStoragePath(
          organizationId,
          conversationId,
          file.name
        );

        // Upload to storage
        updateFileProgress(i, { progress: 30 });
        const uploadResult = await uploadToStorage(file, storagePath);

        if (!uploadResult.success) {
          updateFileProgress(i, {
            status: 'error',
            progress: 0,
            error: uploadResult.error,
          });
          results.push({
            success: false,
            fileName: file.name,
            error: uploadResult.error,
          });
          continue;
        }

        // Create attachment record
        updateFileProgress(i, { progress: 70 });
        const recordResult = await createAttachmentRecord({
          conversation_id: conversationId,
          message_id: messageId || null,
          sender_id: senderId,
          file_name: file.name,
          file_type: file.type,
          file_path: storagePath,
          file_size: file.size,
        });

        if (!recordResult.success) {
          updateFileProgress(i, {
            status: 'error',
            progress: 0,
            error: recordResult.error,
          });
          results.push({
            success: false,
            fileName: file.name,
            error: recordResult.error,
          });
          continue;
        }

        // Success
        updateFileProgress(i, { status: 'success', progress: 100 });
        results.push({
          success: true,
          attachmentId: recordResult.attachmentId,
          fileName: file.name,
        });
      }

      setIsUploading(false);
      return results;
    },
    [updateFileProgress]
  );

  /**
   * Resets upload state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress([]);
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadFiles,
    reset,
  };
}

/**
 * Helper function to link attachments to a message after it's created
 */
export async function linkAttachmentsToMessage(
  attachmentIds: string[],
  messageId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_attachments')
      .update({ message_id: messageId })
      .in('id', attachmentIds);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error linking attachments to message:', error);
    return false;
  }
}
