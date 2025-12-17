import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AttachmentPicker from '../AttachmentPicker';

// Mock expo modules
jest.mock('expo-image-picker');
jest.mock('expo-document-picker');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AttachmentPicker', () => {
  const mockOnFilesSelected = jest.fn();
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onFilesSelected: mockOnFilesSelected,
    maxFiles: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all file source options', () => {
      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      expect(getByText('Câmera')).toBeTruthy();
      expect(getByText('Galeria')).toBeTruthy();
      expect(getByText('Documento PDF')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <AttachmentPicker {...defaultProps} visible={false} />
      );

      expect(queryByText('Câmera')).toBeNull();
    });

    it('should display correct descriptions for each option', () => {
      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      expect(getByText('Tirar uma foto')).toBeTruthy();
      expect(getByText('Escolher da galeria')).toBeTruthy();
      expect(getByText('Selecionar arquivo PDF')).toBeTruthy();
    });
  });

  describe('Camera functionality', () => {
    it('should request camera permissions when camera option selected', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue({ granted: true });
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock) = mockRequestPermission;
      (ImagePicker.launchCameraAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: true,
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Câmera'));

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });

    it('should show alert when camera permission denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
        granted: false,
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Câmera'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permissão Necessária',
          expect.stringContaining('câmera'),
          expect.any(Array)
        );
      });
    });

    it('should call onFilesSelected with camera photo', async () => {
      const mockAsset = {
        uri: 'file:///photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
      };

      (ImagePicker.requestCameraPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchCameraAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: false,
        assets: [mockAsset],
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Câmera'));

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalledWith([mockAsset]);
      });
    });
  });

  describe('Gallery functionality', () => {
    it('should request media library permissions when gallery option selected', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue({ granted: true });
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock) = mockRequestPermission;
      (ImagePicker.launchImageLibraryAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: true,
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Galeria'));

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });

    it('should show alert when media library permission denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
        granted: false,
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Galeria'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permissão Necessária',
          expect.stringContaining('galeria'),
          expect.any(Array)
        );
      });
    });

    it('should allow multiple image selection from gallery', async () => {
      const mockAssets = [
        { uri: 'file:///photo1.jpg', fileName: 'photo1.jpg', fileSize: 1024000, mimeType: 'image/jpeg' },
        { uri: 'file:///photo2.jpg', fileName: 'photo2.jpg', fileSize: 2048000, mimeType: 'image/jpeg' },
      ];

      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock) = jest.fn().mockResolvedValue({
        granted: true,
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: false,
        assets: mockAssets,
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Galeria'));

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalledWith(mockAssets);
      });
    });
  });

  describe('Document picker functionality', () => {
    it('should launch document picker for PDFs', async () => {
      const mockDocument = {
        uri: 'file:///document.pdf',
        name: 'document.pdf',
        size: 1024000,
        mimeType: 'application/pdf',
      };

      (DocumentPicker.getDocumentAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: false,
        assets: [mockDocument],
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Documento PDF'));

      await waitFor(() => {
        expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
          type: 'application/pdf',
          multiple: true,
        });
      });
    });

    it('should call onFilesSelected with selected PDF', async () => {
      const mockDocument = {
        uri: 'file:///document.pdf',
        name: 'document.pdf',
        size: 5242880,
        mimeType: 'application/pdf',
      };

      (DocumentPicker.getDocumentAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: false,
        assets: [mockDocument],
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Documento PDF'));

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalledWith([mockDocument]);
      });
    });
  });

  describe('File validation', () => {
    it('should reject files larger than 10MB', async () => {
      const mockLargeFile = {
        uri: 'file:///large.pdf',
        name: 'large.pdf',
        size: 20971520, // 20MB
        mimeType: 'application/pdf',
      };

      (DocumentPicker.getDocumentAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: false,
        assets: [mockLargeFile],
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Documento PDF'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Arquivo muito grande',
          expect.stringContaining('10MB'),
          expect.any(Array)
        );
      });

      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });

    it('should reject files with invalid extensions', async () => {
      const mockInvalidFile = {
        uri: 'file:///document.txt',
        name: 'document.txt',
        size: 1024000,
        mimeType: 'text/plain',
      };

      (DocumentPicker.getDocumentAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: false,
        assets: [mockInvalidFile],
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} />);

      fireEvent.press(getByText('Documento PDF'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Tipo de arquivo inválido',
          expect.any(String),
          expect.any(Array)
        );
      });

      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });

    it('should enforce max file count limit', async () => {
      const mockFiles = [
        { uri: 'file:///doc1.pdf', name: 'doc1.pdf', size: 1024000, mimeType: 'application/pdf' },
        { uri: 'file:///doc2.pdf', name: 'doc2.pdf', size: 1024000, mimeType: 'application/pdf' },
        { uri: 'file:///doc3.pdf', name: 'doc3.pdf', size: 1024000, mimeType: 'application/pdf' },
        { uri: 'file:///doc4.pdf', name: 'doc4.pdf', size: 1024000, mimeType: 'application/pdf' },
      ];

      (DocumentPicker.getDocumentAsync as jest.Mock) = jest.fn().mockResolvedValue({
        canceled: false,
        assets: mockFiles,
      });

      const { getByText } = render(<AttachmentPicker {...defaultProps} maxFiles={3} />);

      fireEvent.press(getByText('Documento PDF'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('3 arquivos'),
          expect.any(Array)
        );
      });

      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });
  });

  describe('Close behavior', () => {
    it('should call onClose when bottom sheet is dismissed', () => {
      const mockOnClose = jest.fn();
      const { getByTestId } = render(
        <AttachmentPicker {...defaultProps} onClose={mockOnClose} />
      );

      // Simulate bottom sheet dismiss
      const bottomSheet = getByTestId('attachment-picker-sheet');
      fireEvent(bottomSheet, 'onDismiss');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
