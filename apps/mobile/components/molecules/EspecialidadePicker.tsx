import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  ActionSheetIOS,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui';
import { useEspecialidades } from '@medsync/shared';
import { supabase } from '@/lib/supabase';

interface EspecialidadePickerProps {
  label?: string;
  error?: string;
  value?: string; // UUID of selected especialidade
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  containerStyle?: ViewStyle;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * EspecialidadePicker Component (Molecule)
 *
 * Platform-appropriate picker for selecting medical specialties (especialidades).
 * - iOS: Uses ActionSheetIOS for native feel
 * - Android: Uses Modal with searchable FlatList
 *
 * Integrates with useEspecialidades hook to fetch data from Supabase.
 * Displays selected value, handles loading/error states, and provides search functionality.
 *
 * @example
 * ```tsx
 * <EspecialidadePicker
 *   label="Especialidade"
 *   value={especialidadeId}
 *   onValueChange={setEspecialidadeId}
 *   error={errors.especialidade_id?.message}
 * />
 * ```
 */
export const EspecialidadePicker: React.FC<EspecialidadePickerProps> = ({
  label,
  error,
  value,
  onValueChange,
  onBlur,
  containerStyle,
  placeholder = 'Selecione uma especialidade',
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch especialidades using shared hook
  const { data: especialidades, isLoading, error: fetchError, refetch } = useEspecialidades(supabase);

  // Find selected especialidade
  const selectedEspecialidade = useMemo(
    () => especialidades.find((esp) => esp.id === value),
    [especialidades, value]
  );

  // Filter especialidades based on search query
  const filteredEspecialidades = useMemo(() => {
    if (!searchQuery.trim()) return especialidades;
    const query = searchQuery.toLowerCase().trim();
    return especialidades.filter((esp) =>
      esp.nome.toLowerCase().includes(query)
    );
  }, [especialidades, searchQuery]);

  // Display value (selected especialidade name or placeholder)
  const displayValue = selectedEspecialidade?.nome || '';

  // Handle iOS action sheet selection
  const handleIOSPicker = () => {
    if (disabled) return;

    const options = [
      'Cancelar',
      ...especialidades.map((esp) => esp.nome),
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
        title: 'Selecione uma especialidade',
      },
      (buttonIndex) => {
        if (buttonIndex > 0) {
          const selectedEsp = especialidades[buttonIndex - 1];
          if (selectedEsp) {
            onValueChange(selectedEsp.id);
            onBlur?.();
          }
        }
      }
    );
  };

  // Handle Android modal open
  const handleAndroidPicker = () => {
    if (disabled) return;
    setModalVisible(true);
    setSearchQuery('');
  };

  // Handle selection in Android modal
  const handleSelectEspecialidade = (especialidadeId: string) => {
    onValueChange(especialidadeId);
    setModalVisible(false);
    setSearchQuery('');
    onBlur?.();
  };

  // Handle picker press
  const handlePress = () => {
    if (isLoading) return;
    if (fetchError) {
      refetch();
      return;
    }

    if (Platform.OS === 'ios') {
      handleIOSPicker();
    } else {
      handleAndroidPicker();
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0066CC" />
          <Text style={styles.loadingText}>Carregando especialidades...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (fetchError) {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TouchableOpacity style={styles.errorContainer} onPress={handlePress}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorFetchText}>Erro ao carregar. Toque para tentar novamente.</Text>
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Input-like touchable field */}
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.inputContainer,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        <Ionicons
          name="medkit"
          size={20}
          color="#6B7280"
          style={styles.leftIcon}
        />
        <Text
          style={[
            styles.inputText,
            !displayValue && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color="#6B7280"
          style={styles.rightIcon}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Android Modal */}
      {Platform.OS === 'android' && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione uma especialidade</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Input
                  placeholder="Buscar especialidade..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  leftIcon="search"
                  autoFocus
                />
              </View>

              {/* List */}
              <FlatList
                data={filteredEspecialidades}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => handleSelectEspecialidade(item.id)}
                  >
                    <Text style={styles.listItemText}>{item.nome}</Text>
                    {value === item.id && (
                      <Ionicons name="checkmark" size={20} color="#0066CC" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>
                      Nenhuma especialidade encontrada
                    </Text>
                  </View>
                }
                style={styles.list}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingLeft: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  leftIcon: {
    marginRight: 0,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  errorFetchText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#EF4444',
    flex: 1,
  },
  // Android Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  list: {
    paddingHorizontal: 24,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
