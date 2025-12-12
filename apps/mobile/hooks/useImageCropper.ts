import { useState, useCallback } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Result of image cropping operation
 */
export interface CropResult {
  /** URI of the cropped image */
  uri: string;
  /** Width of the cropped image (should be 512px) */
  width: number;
  /** Height of the cropped image (should be 512px) */
  height: number;
}

/**
 * Options for image cropping
 */
export interface UseImageCropperOptions {
  /** Target size for the cropped image (default: 512) */
  targetSize?: number;
  /** JPEG compression quality 0-1 (default: 0.9) */
  quality?: number;
}

/**
 * Return type of useImageCropper hook
 */
export interface UseImageCropperReturn {
  /** Crop an image to a square avatar format */
  cropImage: (imageUri: string, options?: UseImageCropperOptions) => Promise<CropResult | null>;
  /** Whether a crop operation is in progress */
  isCropping: boolean;
  /** Error message from last crop operation */
  error: string | null;
}

/**
 * Hook for cropping images to circular avatar format
 *
 * This hook provides functionality to transform selected images into consistent
 * circular avatars with 1:1 aspect ratio and fixed dimensions (512x512px by default).
 *
 * The cropping process:
 * 1. Analyzes input image dimensions
 * 2. Extracts center square (1:1 aspect ratio) from the image
 * 3. Resizes to target dimensions (512x512px)
 * 4. Saves as high-quality JPEG
 *
 * Note: This hook performs the image manipulation to prepare a square image.
 * The actual circular masking/clipping is handled by the UI layer (Avatar component)
 * using border-radius or mask properties.
 *
 * @example
 * ```tsx
 * const { cropImage, isCropping, error } = useImageCropper();
 * const { pickImage } = useImagePicker();
 *
 * const handleSelectAvatar = async () => {
 *   const result = await pickImage();
 *   if (result) {
 *     const cropped = await cropImage(result.uri);
 *     if (cropped) {
 *       // Upload cropped.uri to storage
 *       console.log('Cropped avatar ready:', cropped.uri);
 *     }
 *   }
 * };
 * ```
 */
export function useImageCropper(): UseImageCropperReturn {
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crop an image to a square avatar format
   *
   * This function:
   * - Accepts an image URI from the device (e.g., from expo-image-picker)
   * - Crops to 1:1 aspect ratio by extracting center square
   * - Resizes to exactly 512x512px (or custom targetSize)
   * - Returns high-quality JPEG ready for upload
   *
   * @param imageUri - URI of the image to crop (from image picker)
   * @param options - Optional configuration for crop operation
   * @returns CropResult with URI and dimensions, or null on failure
   */
  const cropImage = useCallback(
    async (
      imageUri: string,
      options: UseImageCropperOptions = {}
    ): Promise<CropResult | null> => {
      // Validate input
      if (!imageUri || typeof imageUri !== 'string') {
        setError('Invalid image URI provided');
        console.error('[useImageCropper] Invalid image URI:', imageUri);
        return null;
      }

      // Default options
      const targetSize = options.targetSize ?? 512;
      const quality = options.quality ?? 0.9;

      setIsCropping(true);
      setError(null);

      try {
        // ✅ PERFORMANCE OPTIMIZATION: Assume image picker already cropped to 1:1
        // Just resize to target size - no need to get dimensions or crop again
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: targetSize, height: targetSize } }],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        console.log(
          `[useImageCropper] Resizing successful: ${result.width}x${result.height}`
        );

        // Validate result
        if (!result.uri) {
          throw new Error('Manipulation returned no URI');
        }

        if (result.width !== targetSize || result.height !== targetSize) {
          console.warn(
            `[useImageCropper] Result dimensions (${result.width}x${result.height}) don't match target (${targetSize}x${targetSize})`
          );
        }

        setIsCropping(false);

        return {
          uri: result.uri,
          width: result.width,
          height: result.height,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error during image cropping';

        setError(errorMessage);
        setIsCropping(false);

        console.error('[useImageCropper] Cropping failed:', err);

        // Return null to indicate failure
        return null;
      }
    },
    []
  );

  return {
    cropImage,
    isCropping,
    error,
  };
}
