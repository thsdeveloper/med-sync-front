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
import { useProfissoes } from '@medsync/shared';
import type { ProfissaoComConselho } from '@medsync/shared/schemas';
import { supabase } from '@/lib/supabase';

interface ProfissaoPickerProps {
  label?: string;
  error?: string;
  value?: string; // UUID of selected profissao
  onValueChange: (value: string, profissao?: ProfissaoComConselho) => void;
  onBlur?: () => void;
  containerStyle?: ViewStyle;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * ProfissaoPicker Component (Molecule)
 *
 * Platform-appropriate picker for selecting healthcare professions.
 * - iOS: Uses ActionSheetIOS for native feel
 * - Android: Uses Modal with searchable FlatList
 *
 * Integrates with useProfissoes hook to fetch data from Supabase.
 * Displays profession name with conselho sigla, handles loading/error states.
 *
 * @example
 * ```tsx
 * <ProfissaoPicker
 *   label="Profissao"
 *   value={profissaoId}
 *   onValueChange={(id, profissao) => {
 *     setProfissaoId(id);
 *     setSelectedProfissao(profissao);
 *   }}
 *   error={errors.profissao_id?.message}
 * />
 * ```
 */
export const ProfissaoPicker: React.FC<ProfissaoPickerProps> = ({
  label,
  error,
  value,
  onValueChange,
  onBlur,
  containerStyle,
  placeholder = 'Selecione uma profissao',
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch profissoes using shared hook
  const { data: profissoes, isLoading, error: fetchError, refetch } = useProfissoes(supabase);

  // Find selected profissao
  const selectedProfissao = useMemo(
    () => profissoes.find((p) => p.id === value),
    [profissoes, value]
  );

  // Filter profissoes based on search query
  const filteredProfissoes = useMemo(() => {
    if (!searchQuery.trim()) return profissoes;
    const query = searchQuery.toLowerCase().trim();
    return profissoes.filter((p) =>
      p.nome.toLowerCase().includes(query) ||
      p.conselho?.sigla?.toLowerCase().includes(query)
    );
  }, [profissoes, searchQuery]);

  // Display value (selected profissao name with conselho or placeholder)
  const displayValue = useMemo(() => {
    if (!selectedProfissao) return '';
    const conselho = selectedProfissao.conselho?.sigla;
    return conselho ? `${selectedProfissao.nome} (${conselho})` : selectedProfissao.nome;
  }, [selectedProfissao]);

  // Handle iOS action sheet selection
  const handleIOSPicker = () => {
    if (disabled) return;

    const options = [
      'Cancelar',
      ...profissoes.map((p) => {
        const conselho = p.conselho?.sigla;
        return conselho ? `${p.nome} (${conselho})` : p.nome;
      }),
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
        title: 'Selecione uma profissao',
      },
      (buttonIndex) => {
        if (buttonIndex > 0) {
          const selectedProf = profissoes[buttonIndex - 1];
          if (selectedProf) {
            onValueChange(selectedProf.id, selectedProf);
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
  const handleSelectProfissao = (profissao: ProfissaoComConselho) => {
    onValueChange(profissao.id, profissao);
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
          <Text style={styles.loadingText}>Carregando profissoes...</Text>
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
          name="briefcase"
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
                <Text style={styles.modalTitle}>Selecione uma profissao</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Input
                  placeholder="Buscar profissao..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  leftIcon="search"
                  autoFocus
                />
              </View>

              {/* List */}
              <FlatList
                data={filteredProfissoes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => handleSelectProfissao(item)}
                  >
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemText}>{item.nome}</Text>
                      {item.conselho?.sigla && (
                        <Text style={styles.listItemSubtext}>{item.conselho.sigla}</Text>
                      )}
                    </View>
                    {value === item.id && (
                      <Ionicons name="checkmark" size={20} color="#0066CC" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>
                      Nenhuma profissao encontrada
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
  listItemContent: {
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  listItemSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
