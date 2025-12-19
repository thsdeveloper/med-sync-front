/**
 * ImageCropDialog Molecule Component
 *
 * A dialog that allows users to crop and zoom their profile image before uploading.
 * Uses react-easy-crop for the crop functionality.
 *
 * Features:
 * - Circular crop area (perfect for avatars)
 * - Zoom slider control
 * - Preview of the cropped result
 * - Cancel and confirm actions
 *
 * @module components/molecules/ImageCropDialog
 */

'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/atoms/Button';
import { Slider } from '@/components/ui/slider';

/**
 * Props for the ImageCropDialog component
 */
export interface ImageCropDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** The image source URL (object URL from file input) */
  imageSrc: string | null;
  /** Callback when the user confirms the crop with the cropped file */
  onCropComplete: (croppedFile: File) => void;
  /** Whether the crop is being processed */
  isProcessing?: boolean;
}

/**
 * Creates a cropped image from the source image and crop area
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 400 // Output image size in pixels
): Promise<File> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to desired output
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        // Create file from blob
        const file = new File([blob], `avatar-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        resolve(file);
      },
      'image/jpeg',
      0.9 // Quality
    );
  });
}

/**
 * ImageCropDialog - Dialog for cropping profile images
 *
 * @example
 * ```tsx
 * function AvatarUploader() {
 *   const [showCrop, setShowCrop] = useState(false);
 *   const [imageSrc, setImageSrc] = useState<string | null>(null);
 *
 *   const handleFileSelect = (file: File) => {
 *     setImageSrc(URL.createObjectURL(file));
 *     setShowCrop(true);
 *   };
 *
 *   const handleCropComplete = async (croppedFile: File) => {
 *     // Upload the cropped file
 *     await uploadAvatar(croppedFile);
 *     setShowCrop(false);
 *   };
 *
 *   return (
 *     <>
 *       <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} />
 *       <ImageCropDialog
 *         open={showCrop}
 *         onOpenChange={setShowCrop}
 *         imageSrc={imageSrc}
 *         onCropComplete={handleCropComplete}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  isProcessing = false,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [imageSrc, croppedAreaPixels, onCropComplete]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    // Reset state when closing
    setTimeout(() => {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }, 200);
  }, [onOpenChange]);

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Ajustar foto de perfil</DialogTitle>
          <DialogDescription>
            Arraste para posicionar e use o zoom para ajustar sua foto.
          </DialogDescription>
        </DialogHeader>

        {/* Crop area */}
        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaChange}
            onZoomChange={onZoomChange}
            minZoom={1}
            maxZoom={3}
            zoomSpeed={0.1}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="h-4 w-4 text-slate-500" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(values) => setZoom(values[0])}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-slate-500" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="ml-2"
            title="Resetar posição"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Salvando...' : 'Salvar foto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImageCropDialog;
