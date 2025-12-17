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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  const handleCamera = async () => {
    setModalVisible(false);

    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

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
          return;
        }

        onFilesSelected([file]);
      }
    } catch (error) {
      console.error('Error launching camera:', error);
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  };

  /**
   * Handles gallery image selection
   */
  const handleGallery = async () => {
    setModalVisible(false);

    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    const remainingSlots = maxFiles - currentFileCount;
    if (remainingSlots <= 0) {
      Alert.alert(
        'Limite Atingido',
        `Você já atingiu o limite de ${maxFiles} arquivos por mensagem.`
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

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
            return;
          }
        }

        onFilesSelected(files);
      }
    } catch (error) {
      console.error('Error launching image library:', error);
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    }
  };

  /**
   * Handles document selection
   */
  const handleDocument = async () => {
    setModalVisible(false);

    const remainingSlots = maxFiles - currentFileCount;
    if (remainingSlots <= 0) {
      Alert.alert(
        'Limite Atingido',
        `Você já atingiu o limite de ${maxFiles} arquivos por mensagem.`
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: remainingSlots > 1,
        copyToCacheDirectory: true,
      });

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
    }
  };

  const isDisabled = disabled || currentFileCount >= maxFiles;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={() => setModalVisible(true)}
        disabled={isDisabled}
      >
        <Ionicons
          name="attach"
          size={24}
          color={isDisabled ? '#D1D5DB' : '#6B7280'}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Adicionar Anexo</Text>

            <TouchableOpacity style={styles.option} onPress={handleCamera}>
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
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleGallery}>
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
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={handleDocument}>
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
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
