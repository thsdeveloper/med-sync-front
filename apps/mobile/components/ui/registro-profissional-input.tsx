import React, { forwardRef, useState, useCallback } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    Pressable,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    VALID_UFS,
    normalizeRegistroNumero,
    type ProfissaoComConselho,
} from '@medsync/shared';

export interface RegistroProfissionalValue {
    numero: string;
    uf: string;
    categoria?: string;
}

interface RegistroProfissionalInputProps {
    label?: string;
    error?: string;
    required?: boolean;
    containerStyle?: ViewStyle;
    value: RegistroProfissionalValue;
    onChange: (value: RegistroProfissionalValue) => void;
    onBlur?: (e: any) => void;
    profissao?: ProfissaoComConselho | null;
    errors?: {
        numero?: string;
        uf?: string;
        categoria?: string;
    };
    editable?: boolean;
    placeholder?: string;
}

/**
 * RegistroProfissionalInput - Input group for professional registration (mobile)
 *
 * A component that combines number input, UF picker, and optional categoria picker
 * for Brazilian healthcare professional registration.
 *
 * Features:
 * - Input for registration number (digits only)
 * - Modal picker for UF (Brazilian state)
 * - Conditional categoria picker when conselho requires it (e.g., COREN)
 * - Dynamic label based on the selected conselho
 * - Auto-normalizes input (removes non-digits)
 */
export const RegistroProfissionalInput = forwardRef<TextInput, RegistroProfissionalInputProps>(
    (
        {
            label,
            error: externalError,
            required = false,
            containerStyle,
            value,
            onChange,
            onBlur,
            profissao,
            errors,
            editable,
            placeholder,
        },
        ref
    ) => {
        const isEditable = editable !== false;
        const conselho = profissao?.conselho;
        const conselhoSigla = conselho?.sigla || 'Registro';
        const requerCategoria = conselho?.requer_categoria ?? false;
        const categoriasDisponiveis = profissao?.categorias_disponiveis || [];

        const [showUfPicker, setShowUfPicker] = useState(false);
        const [showCategoriaPicker, setShowCategoriaPicker] = useState(false);
        const [isTouched, setIsTouched] = useState(false);

        // Determine display errors
        const numeroError = errors?.numero || externalError;
        const ufError = errors?.uf;
        const categoriaError = errors?.categoria;

        const hasNumeroError = isTouched && !!numeroError;
        const hasUfError = isTouched && !!ufError;
        const hasCategoriaError = isTouched && !!categoriaError;

        const handleNumeroChange = useCallback((text: string) => {
            const normalized = normalizeRegistroNumero(text);
            onChange({
                ...value,
                numero: normalized,
            });
        }, [value, onChange]);

        const handleUfSelect = useCallback((uf: string) => {
            setShowUfPicker(false);
            onChange({
                ...value,
                uf,
            });
        }, [value, onChange]);

        const handleCategoriaSelect = useCallback((categoria: string) => {
            setShowCategoriaPicker(false);
            onChange({
                ...value,
                categoria,
            });
        }, [value, onChange]);

        const handleBlur = useCallback((e: any) => {
            setIsTouched(true);
            onBlur?.(e);
        }, [onBlur]);

        const renderUfItem = ({ item }: { item: string }) => (
            <Pressable
                style={({ pressed }) => [
                    styles.pickerItem,
                    item === value.uf && styles.pickerItemSelected,
                    pressed && styles.pickerItemPressed,
                ]}
                onPress={() => handleUfSelect(item)}
            >
                <Text
                    style={[
                        styles.pickerItemText,
                        item === value.uf && styles.pickerItemTextSelected,
                    ]}
                >
                    {item}
                </Text>
            </Pressable>
        );

        const renderCategoriaItem = ({ item }: { item: string }) => (
            <Pressable
                style={({ pressed }) => [
                    styles.categoriaItem,
                    item === value.categoria && styles.categoriaItemSelected,
                    pressed && styles.pickerItemPressed,
                ]}
                onPress={() => handleCategoriaSelect(item)}
            >
                <Text
                    style={[
                        styles.categoriaItemText,
                        item === value.categoria && styles.categoriaItemTextSelected,
                    ]}
                >
                    {item}
                </Text>
                {item === value.categoria && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
            </Pressable>
        );

        return (
            <View style={[styles.container, containerStyle]}>
                {/* Label */}
                {label !== undefined && (
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>{label || `Numero do ${conselhoSigla}`}</Text>
                        {required && <Text style={styles.required}>*</Text>}
                    </View>
                )}

                {/* Number + UF Row */}
                <View style={styles.inputRow}>
                    {/* Number Input */}
                    <View
                        style={[
                            styles.numberInputContainer,
                            hasNumeroError && styles.inputError,
                            !isEditable && styles.inputDisabled,
                        ]}
                    >
                        <Ionicons
                            name="document-text-outline"
                            size={20}
                            color="#6B7280"
                            style={styles.leftIcon}
                        />
                        <TextInput
                            ref={ref}
                            style={styles.numberInput}
                            placeholder={placeholder || '123456'}
                            placeholderTextColor="#9CA3AF"
                            keyboardType="number-pad"
                            value={value.numero}
                            onChangeText={handleNumeroChange}
                            onBlur={handleBlur}
                            editable={isEditable}
                            maxLength={10}
                        />
                    </View>

                    {/* Separator */}
                    <Text style={styles.separator}>/</Text>

                    {/* UF Picker Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.ufButton,
                            hasUfError && styles.inputError,
                            !isEditable && styles.inputDisabled,
                            pressed && isEditable && styles.ufButtonPressed,
                        ]}
                        onPress={() => setShowUfPicker(true)}
                        disabled={!isEditable}
                    >
                        <Text
                            style={[
                                styles.ufButtonText,
                                !value.uf && styles.ufButtonPlaceholder,
                            ]}
                        >
                            {value.uf || 'UF'}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={16}
                            color="#6B7280"
                        />
                    </Pressable>
                </View>

                {/* Error Messages */}
                {hasNumeroError && <Text style={styles.errorText}>{numeroError}</Text>}
                {hasUfError && !hasNumeroError && <Text style={styles.errorText}>{ufError}</Text>}

                <Text style={styles.helperText}>
                    Informe o numero e UF do seu {conselhoSigla}
                </Text>

                {/* Categoria Picker (conditional for COREN) */}
                {requerCategoria && categoriasDisponiveis.length > 0 && (
                    <View style={styles.categoriaContainer}>
                        <Text style={styles.categoriaLabel}>Categoria</Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.categoriaButton,
                                hasCategoriaError && styles.inputError,
                                !isEditable && styles.inputDisabled,
                                pressed && isEditable && styles.ufButtonPressed,
                            ]}
                            onPress={() => setShowCategoriaPicker(true)}
                            disabled={!isEditable}
                        >
                            <Text
                                style={[
                                    styles.categoriaButtonText,
                                    !value.categoria && styles.ufButtonPlaceholder,
                                ]}
                            >
                                {value.categoria || 'Selecione a categoria'}
                            </Text>
                            <Ionicons
                                name="chevron-down"
                                size={16}
                                color="#6B7280"
                            />
                        </Pressable>
                        {hasCategoriaError && <Text style={styles.errorText}>{categoriaError}</Text>}
                    </View>
                )}

                {/* UF Picker Modal */}
                <Modal
                    visible={showUfPicker}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowUfPicker(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowUfPicker(false)}
                    >
                        <Pressable
                            style={styles.modalContent}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Selecione a UF</Text>
                                <Pressable
                                    onPress={() => setShowUfPicker(false)}
                                    style={styles.modalCloseButton}
                                    hitSlop={10}
                                >
                                    <Ionicons name="close" size={24} color="#374151" />
                                </Pressable>
                            </View>
                            <FlatList
                                data={[...VALID_UFS]}
                                renderItem={renderUfItem}
                                keyExtractor={(item) => item}
                                numColumns={4}
                                contentContainerStyle={styles.ufGrid}
                                showsVerticalScrollIndicator={false}
                            />
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* Categoria Picker Modal */}
                <Modal
                    visible={showCategoriaPicker}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowCategoriaPicker(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowCategoriaPicker(false)}
                    >
                        <Pressable
                            style={styles.modalContent}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Selecione a Categoria</Text>
                                <Pressable
                                    onPress={() => setShowCategoriaPicker(false)}
                                    style={styles.modalCloseButton}
                                    hitSlop={10}
                                >
                                    <Ionicons name="close" size={24} color="#374151" />
                                </Pressable>
                            </View>
                            <FlatList
                                data={categoriasDisponiveis as string[]}
                                renderItem={renderCategoriaItem}
                                keyExtractor={(item) => item}
                                contentContainerStyle={styles.categoriaList}
                                showsVerticalScrollIndicator={false}
                            />
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>
        );
    }
);

RegistroProfissionalInput.displayName = 'RegistroProfissionalInput';

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    required: {
        fontSize: 14,
        fontWeight: '500',
        color: '#EF4444',
        marginLeft: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    numberInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
    },
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    inputDisabled: {
        backgroundColor: '#F3F4F6',
        opacity: 0.7,
    },
    numberInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        fontSize: 16,
        color: '#1F2937',
    },
    leftIcon: {
        marginLeft: 16,
    },
    separator: {
        fontSize: 20,
        fontWeight: '600',
        color: '#6B7280',
        marginHorizontal: 8,
    },
    ufButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        minWidth: 70,
        gap: 4,
    },
    ufButtonPressed: {
        backgroundColor: '#E5E7EB',
    },
    ufButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    ufButtonPlaceholder: {
        color: '#9CA3AF',
        fontWeight: '400',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    },
    helperText: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 4,
    },
    // Categoria styles
    categoriaContainer: {
        marginTop: 16,
    },
    categoriaLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    categoriaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    categoriaButtonText: {
        fontSize: 16,
        color: '#1F2937',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    modalCloseButton: {
        padding: 4,
    },
    ufGrid: {
        padding: 16,
    },
    pickerItem: {
        flex: 1,
        margin: 4,
        paddingVertical: 14,
        paddingHorizontal: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
    },
    pickerItemPressed: {
        backgroundColor: '#D1D5DB',
    },
    pickerItemSelected: {
        backgroundColor: '#0066CC',
    },
    pickerItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    pickerItemTextSelected: {
        color: '#FFFFFF',
    },
    categoriaList: {
        padding: 16,
    },
    categoriaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginVertical: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    categoriaItemSelected: {
        backgroundColor: '#0066CC',
    },
    categoriaItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    categoriaItemTextSelected: {
        color: '#FFFFFF',
    },
});
