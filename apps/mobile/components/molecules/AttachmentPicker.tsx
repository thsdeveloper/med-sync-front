/**
 * AttachmentPicker Molecule Component
 *
 * Provides a button that opens a bottom sheet with options to pick attachments:
 * - Camera: Take a photo with the camera
 * - Gallery: Select photos from the device gallery
 * - Document: Select PDF documents from the device
 *
 * Handles permission requests and file selection, returning selected files to parent.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  detectFileType,
  validateFile,
  MAX_ATTACHMENTS_PER_MESSAGE,
  type SelectedFile,
} from '@/lib/attachment-utils';

interface AttachmentPickerProps {
  /** Current number of selected files */
  currentFileCount?: number;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Callback when files are selected */
  onFilesSelected: (files: SelectedFile[]) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

export default function AttachmentPicker({
  currentFileCount = 0,
  maxFiles = MAX_ATTACHMENTS_PER_MESSAGE,
  onFilesSelected,
  disabled = false,
}: AttachmentPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const isPickingRef = useRef(false);

  /**
   * Execute action and close modal after it completes
   */
  const executeAndCloseModal = useCallback(async (action: () => Promise<void>) => {
    console.log('[AttachmentPicker] executeAndCloseModal called');
    // Don't close modal first - let the native picker open while modal is visible
    // The native picker will overlay the modal
    try {
      await action();
    } finally {
      setModalVisible(false);
    }
  }, []);

  /**
   * Requests camera permissions
   */
  const requestCameraPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'É necessário permitir o acesso à câmera para tirar fotos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  /**
   * Requests media library permissions
   */
  const requestMediaLibraryPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'É necessário permitir o acesso à galeria de fotos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  /**
   * Handles camera photo capture
   */
  const launchCamera = async () => {
    console.log('[AttachmentPicker] launchCamera called, isPickingRef:', isPickingRef.current);
    if (isPickingRef.current) {
      console.log('[AttachmentPicker] Already picking, returning');
      return;
    }
    isPickingRef.current = true;

    try {
      console.log('[AttachmentPicker] Requesting camera permissions...');
      const hasPermission = await requestCameraPermissions();
      console.log('[AttachmentPicker] Camera permission result:', hasPermission);
      if (!hasPermission) {
        isPickingRef.current = false;
        return;
      }

      console.log('[AttachmentPicker] Launching camera...');

      // Wrap in Promise.race with timeout to detect hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Camera picker timeout')), 30000);
      });

      const result = await Promise.race([
        ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
          exif: false,
        }),
        timeoutPromise,
      ]);

      console.log('[AttachmentPicker] Camera result:', JSON.stringify(result));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;

        const file: SelectedFile = {
          uri: asset.uri,
          name: fileName,
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || 'image/jpeg',
          type: 'image',
        };

        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          Alert.alert('Arquivo Inválido', validation.error);
          isPickingRef.current = false;
          return;
        }

        onFilesSelected([file]);
      }
    } catch (error: any) {
      console.error('[AttachmentPicker] Error launching camera:', error?.message || error);
      if (error?.message === 'Camera picker timeout') {
        Alert.alert('Erro', 'A câmera demorou muito para responder. Tente novamente.');
      } else {
        Alert.alert('Erro', 'Não foi possível abrir a câmera.');
      }
    } finally {
      console.log('[AttachmentPicker] Camera finally block, resetting isPickingRef');
      isPickingRef.current = false;
    }
  };

  /**
   * Handles gallery image selection
   */
  const launchGallery = async () => {
    console.log('[AttachmentPicker] launchGallery called, isPickingRef:', isPickingRef.current);
    if (isPickingRef.current) {
      console.log('[AttachmentPicker] Already picking, returning');
      return;
    }
    isPickingRef.current = true;

    try {
      console.log('[AttachmentPicker] Requesting media library permissions...');
      const hasPermission = await requestMediaLibraryPermissions();
      console.log('[AttachmentPicker] Media library permission result:', hasPermission);
      if (!hasPermission) {
        isPickingRef.current = false;
        return;
      }

      const remainingSlots = maxFiles - currentFileCount;
      if (remainingSlots <= 0) {
        Alert.alert(
          'Limite Atingido',
          `Você já atingiu o limite de ${maxFiles} arquivos por mensagem.`
        );
        isPickingRef.current = false;
        return;
      }

      console.log('[AttachmentPicker] Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
        exif: false,
      });
      console.log('[AttachmentPicker] Image library result:', JSON.stringify(result));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const files: SelectedFile[] = result.assets.map((asset, index) => {
          const fileName = asset.fileName || `image_${Date.now()}_${index}.jpg`;
          return {
            uri: asset.uri,
            name: fileName,
            size: asset.fileSize || 0,
            mimeType: asset.mimeType || 'image/jpeg',
            type: 'image',
          };
        });

        // Validate all files
        for (const file of files) {
          const validation = validateFile(file);
          if (!validation.isValid) {
            Alert.alert('Arquivo Inválido', validation.error);
            isPickingRef.current = false;
            return;
          }
        }

        onFilesSelected(files);
      }
    } catch (error) {
      console.error('Error launching image library:', error);
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    } finally {
      isPickingRef.current = false;
    }
  };

  /**
   * Handles document selection
   */
  const launchDocumentPicker = async () => {
    console.log('[AttachmentPicker] launchDocumentPicker called, isPickingRef:', isPickingRef.current);
    if (isPickingRef.current) {
      console.log('[AttachmentPicker] Already picking, returning');
      return;
    }
    isPickingRef.current = true;

    try {
      const remainingSlots = maxFiles - currentFileCount;
      if (remainingSlots <= 0) {
        Alert.alert(
          'Limite Atingido',
          `Você já atingiu o limite de ${maxFiles} arquivos por mensagem.`
        );
        isPickingRef.current = false;
        return;
      }

      console.log('[AttachmentPicker] Launching document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: remainingSlots > 1,
        copyToCacheDirectory: true,
      });
      console.log('[AttachmentPicker] Document picker result:', result.canceled ? 'canceled' : 'success');

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const files: SelectedFile[] = result.assets
          .map((asset) => {
            const fileType = detectFileType(asset.mimeType || '', asset.name);
            if (!fileType) return null;

            return {
              uri: asset.uri,
              name: asset.name,
              size: asset.size || 0,
              mimeType: asset.mimeType || 'application/pdf',
              type: fileType,
            };
          })
          .filter((file): file is SelectedFile => file !== null);

        // Validate all files
        for (const file of files) {
          const validation = validateFile(file);
          if (!validation.isValid) {
            Alert.alert('Arquivo Inválido', validation.error);
            isPickingRef.current = false;
            return;
          }
        }

        if (files.length > 0) {
          onFilesSelected(files);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Erro', 'Não foi possível selecionar o documento.');
    } finally {
      isPickingRef.current = false;
    }
  };

  const handleCamera = () => {
    console.log('[AttachmentPicker] handleCamera pressed');
    executeAndCloseModal(launchCamera);
  };
  const handleGallery = () => {
    console.log('[AttachmentPicker] handleGallery pressed');
    executeAndCloseModal(launchGallery);
  };
  const handleDocument = () => {
    console.log('[AttachmentPicker] handleDocument pressed');
    executeAndCloseModal(launchDocumentPicker);
  };

  const isDisabled = disabled || currentFileCount >= maxFiles;

  return (
    <>
      <Pressable
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={() => setModalVisible(true)}
        disabled={isDisabled}
      >
        <Ionicons
          name="attach"
          size={24}
          color={isDisabled ? '#D1D5DB' : '#6B7280'}
        />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Adicionar Anexo</Text>

            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={handleCamera}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={24} color="#0066CC" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Câmera</Text>
                <Text style={styles.optionDescription}>
                  Tirar uma foto com a câmera
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={handleGallery}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="images" size={24} color="#10B981" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Galeria</Text>
                <Text style={styles.optionDescription}>
                  Selecionar fotos da galeria
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={handleDocument}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="document-text" size={24} color="#F59E0B" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Documento</Text>
                <Text style={styles.optionDescription}>
                  Selecionar arquivo PDF
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingHorizontal: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  optionPressed: {
    backgroundColor: '#E5E7EB',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonPressed: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
