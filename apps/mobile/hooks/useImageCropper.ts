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
        // Step 1: Get image info to determine dimensions
        const imageInfo = await ImageManipulator.manipulateAsync(
          imageUri,
          [], // No transformations, just getting info
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );

        const { width: originalWidth, height: originalHeight } = imageInfo;

        console.log(
          `[useImageCropper] Original image dimensions: ${originalWidth}x${originalHeight}`
        );

        // Step 2: Calculate crop parameters for center square
        // We want to extract the largest possible square from the center of the image
        const cropSize = Math.min(originalWidth, originalHeight);

        // Calculate origin point to center the crop
        const originX = (originalWidth - cropSize) / 2;
        const originY = (originalHeight - cropSize) / 2;

        console.log(
          `[useImageCropper] Crop parameters: size=${cropSize}, origin=(${originX}, ${originY})`
        );

        // Step 3: Apply transformations
        const transformations: ImageManipulator.Action[] = [];

        // Only crop if image is not already square
        if (originalWidth !== originalHeight) {
          transformations.push({
            crop: {
              originX,
              originY,
              width: cropSize,
              height: cropSize,
            },
          });
        }

        // Always resize to target dimensions for consistency
        // This ensures all avatars are exactly the same size
        transformations.push({
          resize: {
            width: targetSize,
            height: targetSize,
          },
        });

        // Step 4: Execute manipulation
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          transformations,
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        console.log(
          `[useImageCropper] Cropping successful: ${result.width}x${result.height}`
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
