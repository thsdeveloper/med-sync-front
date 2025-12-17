import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import useAttachmentUpload from '../useAttachmentUpload';

// Mock dependencies
jest.mock('expo-file-system');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      update: jest.fn(),
    })),
  },
}));

jest.spyOn(Alert, 'alert');

describe('useAttachmentUpload', () => {
  const mockSupabase = require('../../lib/supabase').supabase;
  const mockConversationId = '123e4567-e89b-12d3-a456-426614174000';
  const mockOrganizationId = '223e4567-e89b-12d3-a456-426614174000';

  const mockFile = {
    uri: 'file:///document.pdf',
    name: 'document.pdf',
    size: 1024000,
    type: 'application/pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with empty upload state', () => {
      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      expect(result.current.uploadState).toEqual({});
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadProgress).toBe(0);
    });
  });

  describe('uploadFiles function', () => {
    it('should upload single file successfully', async () => {
      const mockBase64 = 'base64encodeddata';
      (FileSystem.readAsStringAsync as jest.Mock) = jest.fn().mockResolvedValue(mockBase64);

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'org/conv/document.pdf' },
        error: null,
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'attachment-id-1' }],
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({ upload: mockUpload });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      await act(async () => {
        await result.current.uploadFiles([mockFile], null);
      });

      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        mockFile.uri,
        { encoding: FileSystem.EncodingType.Base64 }
      );

      expect(mockUpload).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
      expect(result.current.isUploading).toBe(false);
    });

    it('should upload multiple files in parallel', async () => {
      const mockFiles = [
        { ...mockFile, name: 'doc1.pdf' },
        { ...mockFile, name: 'doc2.pdf' },
      ];

      (FileSystem.readAsStringAsync as jest.Mock) = jest.fn().mockResolvedValue('base64');

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'org/conv/doc.pdf' },
        error: null,
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'attachment-id' }],
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({ upload: mockUpload });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      await act(async () => {
        await result.current.uploadFiles(mockFiles, null);
      });

      expect(mockUpload).toHaveBeenCalledTimes(2);
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('should track upload progress', async () => {
      (FileSystem.readAsStringAsync as jest.Mock) = jest.fn().mockResolvedValue('base64');

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'path' },
        error: null,
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'id' }],
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({ upload: mockUpload });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      act(() => {
        result.current.uploadFiles([mockFile], null);
      });

      // Should show uploading state
      expect(result.current.isUploading).toBe(true);

      await waitFor(() => {
        expect(result.current.isUploading).toBe(false);
      });
    });

    it('should handle upload failures with retry', async () => {
      (FileSystem.readAsStringAsync as jest.Mock) = jest.fn().mockResolvedValue('base64');

      const mockUpload = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { path: 'path' },
          error: null,
        });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'id' }],
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({ upload: mockUpload });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      await act(async () => {
        await result.current.uploadFiles([mockFile], null);
      });

      // Should retry and eventually succeed
      expect(mockUpload).toHaveBeenCalledTimes(2);
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it('should handle max retries exceeded', async () => {
      (FileSystem.readAsStringAsync as jest.Mock) = jest.fn().mockResolvedValue('base64');

      const mockUpload = jest.fn().mockRejectedValue(new Error('Network error'));

      mockSupabase.storage.from.mockReturnValue({ upload: mockUpload });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      await act(async () => {
        await result.current.uploadFiles([mockFile], null);
      });

      // Should retry max times (3 attempts total)
      expect(mockUpload).toHaveBeenCalledTimes(3);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro no upload',
        expect.stringContaining('document.pdf'),
        expect.any(Array)
      );
    });
  });

  describe('linkToMessage function', () => {
    it('should link uploaded attachments to message', async () => {
      const mockAttachmentIds = ['id1', 'id2'];
      const mockMessageId = 'message-id';

      const mockUpdate = jest.fn().mockResolvedValue({
        data: mockAttachmentIds.map((id) => ({ id })),
        error: null,
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      await act(async () => {
        await result.current.linkToMessage(mockAttachmentIds, mockMessageId);
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        { message_id: mockMessageId },
        expect.any(Object)
      );
    });

    it('should handle link failures', async () => {
      const mockAttachmentIds = ['id1'];
      const mockMessageId = 'message-id';

      const mockUpdate = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      await act(async () => {
        await result.current.linkToMessage(mockAttachmentIds, mockMessageId);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro',
        expect.stringContaining('vincular'),
        expect.any(Array)
      );
    });
  });

  describe('resetUploadState function', () => {
    it('should reset upload state', async () => {
      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      // Set some upload state
      act(() => {
        result.current.uploadFiles([mockFile], null);
      });

      // Reset
      act(() => {
        result.current.resetUploadState();
      });

      expect(result.current.uploadState).toEqual({});
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadProgress).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should show detailed error messages for specific failures', async () => {
      (FileSystem.readAsStringAsync as jest.Mock) = jest.fn().mockResolvedValue('base64');

      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'File too large' },
      });

      mockSupabase.storage.from.mockReturnValue({ upload: mockUpload });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      await act(async () => {
        await result.current.uploadFiles([mockFile], null);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('File too large'),
        expect.any(Array)
      );
    });
  });

  describe('Upload progress calculation', () => {
    it('should calculate correct progress percentage', async () => {
      const mockFiles = [
        { ...mockFile, name: 'doc1.pdf' },
        { ...mockFile, name: 'doc2.pdf' },
        { ...mockFile, name: 'doc3.pdf' },
      ];

      (FileSystem.readAsStringAsync as jest.Mock) = jest.fn().mockResolvedValue('base64');

      let uploadCount = 0;
      const mockUpload = jest.fn().mockImplementation(async () => {
        uploadCount++;
        return {
          data: { path: 'path' },
          error: null,
        };
      });

      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 'id' }],
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({ upload: mockUpload });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() =>
        useAttachmentUpload(mockConversationId, mockOrganizationId)
      );

      await act(async () => {
        await result.current.uploadFiles(mockFiles, null);
      });

      // Final progress should be 100%
      expect(result.current.uploadProgress).toBe(100);
    });
  });
});
