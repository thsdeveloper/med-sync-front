import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AttachmentPreview from '../AttachmentPreview';

describe('AttachmentPreview', () => {
  const mockOnRemove = jest.fn();

  const mockImageFile = {
    uri: 'file:///photo.jpg',
    name: 'photo.jpg',
    size: 1024000,
    type: 'image/jpeg',
  };

  const mockPdfFile = {
    uri: 'file:///document.pdf',
    name: 'document.pdf',
    size: 2048000,
    type: 'application/pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when files array is empty', () => {
      const { queryByTestId } = render(
        <AttachmentPreview files={[]} onRemove={mockOnRemove} />
      );

      expect(queryByTestId('attachment-preview-list')).toBeNull();
    });

    it('should render image preview with thumbnail', () => {
      const { getByTestId } = render(
        <AttachmentPreview files={[mockImageFile]} onRemove={mockOnRemove} />
      );

      const imagePreview = getByTestId('attachment-preview-image-0');
      expect(imagePreview).toBeTruthy();
      expect(imagePreview.props.source.uri).toBe(mockImageFile.uri);
    });

    it('should render PDF preview with file icon', () => {
      const { getByText, getByTestId } = render(
        <AttachmentPreview files={[mockPdfFile]} onRemove={mockOnRemove} />
      );

      expect(getByTestId('attachment-preview-pdf-icon-0')).toBeTruthy();
      expect(getByText('document.pdf')).toBeTruthy();
    });

    it('should render multiple files', () => {
      const files = [mockImageFile, mockPdfFile];
      const { getByTestId } = render(
        <AttachmentPreview files={files} onRemove={mockOnRemove} />
      );

      expect(getByTestId('attachment-preview-image-0')).toBeTruthy();
      expect(getByTestId('attachment-preview-pdf-icon-1')).toBeTruthy();
    });
  });

  describe('File information display', () => {
    it('should display formatted file size for images', () => {
      const { getByText } = render(
        <AttachmentPreview files={[mockImageFile]} onRemove={mockOnRemove} />
      );

      expect(getByText('1.00 MB')).toBeTruthy();
    });

    it('should display formatted file size for PDFs', () => {
      const { getByText } = render(
        <AttachmentPreview files={[mockPdfFile]} onRemove={mockOnRemove} />
      );

      expect(getByText('2.00 MB')).toBeTruthy();
    });

    it('should display file names for PDFs', () => {
      const { getByText } = render(
        <AttachmentPreview files={[mockPdfFile]} onRemove={mockOnRemove} />
      );

      expect(getByText('document.pdf')).toBeTruthy();
    });
  });

  describe('File removal', () => {
    it('should call onRemove with correct index when delete button pressed', () => {
      const { getByTestId } = render(
        <AttachmentPreview files={[mockImageFile]} onRemove={mockOnRemove} />
      );

      const removeButton = getByTestId('attachment-preview-remove-0');
      fireEvent.press(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith(0);
    });

    it('should render delete button for each file', () => {
      const files = [mockImageFile, mockPdfFile];
      const { getByTestId } = render(
        <AttachmentPreview files={files} onRemove={mockOnRemove} />
      );

      expect(getByTestId('attachment-preview-remove-0')).toBeTruthy();
      expect(getByTestId('attachment-preview-remove-1')).toBeTruthy();
    });

    it('should call onRemove with correct index for second file', () => {
      const files = [mockImageFile, mockPdfFile];
      const { getByTestId } = render(
        <AttachmentPreview files={files} onRemove={mockOnRemove} />
      );

      const removeButton = getByTestId('attachment-preview-remove-1');
      fireEvent.press(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith(1);
    });
  });

  describe('File count and limit display', () => {
    it('should display file count badge', () => {
      const files = [mockImageFile, mockPdfFile];
      const { getByText } = render(
        <AttachmentPreview files={files} onRemove={mockOnRemove} maxFiles={3} />
      );

      expect(getByText('2/3')).toBeTruthy();
    });

    it('should highlight badge when limit reached', () => {
      const files = [mockImageFile, mockPdfFile, mockImageFile];
      const { getByTestId } = render(
        <AttachmentPreview files={files} onRemove={mockOnRemove} maxFiles={3} />
      );

      const countBadge = getByTestId('attachment-preview-count-badge');
      expect(countBadge).toBeTruthy();
      // Badge should have warning styling when at limit
    });

    it('should show remaining slots', () => {
      const files = [mockImageFile];
      const { getByText } = render(
        <AttachmentPreview files={files} onRemove={mockOnRemove} maxFiles={3} />
      );

      expect(getByText('1/3')).toBeTruthy();
    });
  });

  describe('Horizontal scroll behavior', () => {
    it('should render ScrollView for horizontal scrolling', () => {
      const files = [mockImageFile, mockPdfFile];
      const { getByTestId } = render(
        <AttachmentPreview files={files} onRemove={mockOnRemove} />
      );

      const scrollView = getByTestId('attachment-preview-list');
      expect(scrollView.props.horizontal).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle files with missing name', () => {
      const fileWithoutName = { ...mockPdfFile, name: undefined };
      const { getByText } = render(
        <AttachmentPreview files={[fileWithoutName]} onRemove={mockOnRemove} />
      );

      // Should display a fallback or handle gracefully
      expect(getByText(/\.pdf/)).toBeTruthy();
    });

    it('should handle files with very long names', () => {
      const longNameFile = {
        ...mockPdfFile,
        name: 'very_long_filename_that_exceeds_normal_length_expectations.pdf',
      };
      const { getByText } = render(
        <AttachmentPreview files={[longNameFile]} onRemove={mockOnRemove} />
      );

      expect(getByText(longNameFile.name, { exact: false })).toBeTruthy();
    });

    it('should handle zero file size', () => {
      const zeroSizeFile = { ...mockPdfFile, size: 0 };
      const { getByText } = render(
        <AttachmentPreview files={[zeroSizeFile]} onRemove={mockOnRemove} />
      );

      expect(getByText('0 B')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible delete buttons', () => {
      const { getByTestId } = render(
        <AttachmentPreview files={[mockImageFile]} onRemove={mockOnRemove} />
      );

      const removeButton = getByTestId('attachment-preview-remove-0');
      expect(removeButton.props.accessibilityLabel).toContain('Remover');
    });

    it('should have accessible file information', () => {
      const { getByText } = render(
        <AttachmentPreview files={[mockPdfFile]} onRemove={mockOnRemove} />
      );

      const fileName = getByText('document.pdf');
      expect(fileName.props.accessible).toBeTruthy();
    });
  });
});
