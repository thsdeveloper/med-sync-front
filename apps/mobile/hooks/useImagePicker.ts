import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
}

export interface UseImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
}

export interface UseImagePickerReturn {
  /**
   * Current permission status
   */
  permissionStatus: ImagePicker.PermissionStatus | null;

  /**
   * Whether the permission request is in progress
   */
  isRequestingPermission: boolean;

  /**
   * Whether the image picker is currently open
   */
  isPickingImage: boolean;

  /**
   * Request media library permissions
   * @returns Promise resolving to true if granted, false otherwise
   */
  requestPermission: () => Promise<boolean>;

  /**
   * Check current permission status without requesting
   * @returns Promise resolving to the current permission status
   */
  checkPermission: () => Promise<ImagePicker.PermissionStatus>;

  /**
   * Launch the image picker to select an image
   * @param options - Configuration options for the image picker
   * @returns Promise resolving to the selected image or null if cancelled/failed
   */
  pickImage: (options?: UseImagePickerOptions) => Promise<ImagePickerResult | null>;
}

/**
 * Hook to handle image selection with permission management
 *
 * This hook encapsulates the logic for:
 * - Checking and requesting media library permissions
 * - Launching the image picker with configurable options
 * - Handling permission denials with user-friendly feedback
 * - Error handling for various failure scenarios
 *
 * @example
 * ```tsx
 * const { pickImage, permissionStatus, requestPermission } = useImagePicker();
 *
 * const handleSelectImage = async () => {
 *   const image = await pickImage({
 *     allowsEditing: true,
 *     aspect: [1, 1],
 *     quality: 0.8,
 *   });
 *
 *   if (image) {
 *     console.log('Selected image:', image.uri);
 *   }
 * };
 * ```
 */
export function useImagePicker(): UseImagePickerReturn {
  const [permissionStatus, setPermissionStatus] = useState<ImagePicker.PermissionStatus | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  /**
   * Check current permission status
   */
  const checkPermission = useCallback(async (): Promise<ImagePicker.PermissionStatus> => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking media library permission:', error);
      return ImagePicker.PermissionStatus.UNDETERMINED;
    }
  }, []);

  /**
   * Request media library permission with user feedback
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsRequestingPermission(true);

    try {
      // First check if we already have permission
      const currentStatus = await checkPermission();

      if (currentStatus === ImagePicker.PermissionStatus.GRANTED) {
        setIsRequestingPermission(false);
        return true;
      }

      // Request permission
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setPermissionStatus(status);

      if (status === ImagePicker.PermissionStatus.GRANTED) {
        setIsRequestingPermission(false);
        return true;
      }

      // Permission denied
      if (status === ImagePicker.PermissionStatus.DENIED) {
        if (!canAskAgain) {
          // User denied permission and selected "Don't ask again"
          Alert.alert(
            'Permission Required',
            'Photo library access is required to select a profile picture. Please enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    ImagePicker.requestMediaLibraryPermissionsAsync();
                  } else {
                    // On Android, we can't directly open settings, but the alert guides the user
                    Alert.alert(
                      'Enable Permission',
                      'Go to Settings > Apps > MedSync > Permissions and enable Photo/Media access.'
                    );
                  }
                },
              },
            ]
          );
        } else {
          // Permission denied but can ask again
          Alert.alert(
            'Permission Denied',
            'Photo library access is needed to select a profile picture. You can grant permission in the next prompt.',
            [{ text: 'OK' }]
          );
        }
      }

      setIsRequestingPermission(false);
      return false;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      setIsRequestingPermission(false);

      Alert.alert(
        'Permission Error',
        'An error occurred while requesting photo library access. Please try again.',
        [{ text: 'OK' }]
      );

      return false;
    }
  }, [checkPermission]);

  /**
   * Launch image picker with permission check
   */
  const pickImage = useCallback(async (
    options: UseImagePickerOptions = {}
  ): Promise<ImagePickerResult | null> => {
    setIsPickingImage(true);

    try {
      // Check and request permission if needed
      const currentStatus = await checkPermission();

      if (currentStatus !== ImagePicker.PermissionStatus.GRANTED) {
        const granted = await requestPermission();

        if (!granted) {
          setIsPickingImage(false);
          return null;
        }
      }

      // Launch image picker with provided options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: options.mediaTypes ?? ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        allowsMultipleSelection: false,
      });

      setIsPickingImage(false);

      // User cancelled the picker
      if (result.canceled) {
        return null;
      }

      // Extract first selected asset
      const asset = result.assets[0];

      if (!asset) {
        return null;
      }

      // Return normalized result
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileName: asset.fileName ?? undefined,
        fileSize: asset.fileSize ?? undefined,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      setIsPickingImage(false);

      Alert.alert(
        'Image Selection Error',
        'An error occurred while selecting an image. Please try again.',
        [{ text: 'OK' }]
      );

      return null;
    }
  }, [checkPermission, requestPermission]);

  return {
    permissionStatus,
    isRequestingPermission,
    isPickingImage,
    requestPermission,
    checkPermission,
    pickImage,
  };
}
