import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    Pressable,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeCRM, validateCRM, VALID_UFS } from '@medsync/shared';

interface CRMInputProps extends Omit<TextInputProps, 'onChangeText' | 'onBlur' | 'value'> {
    label?: string;
    error?: string;
    required?: boolean;
    containerStyle?: ViewStyle;
    value?: string;
    onChangeText?: (text: string) => void;
    onBlur?: (e: any) => void;
    onValidationChange?: (isValid: boolean, normalizedValue: string) => void;
}

export const CRMInput = forwardRef<TextInput, CRMInputProps>(
    (
        {
            label = 'CRM',
            error: externalError,
            required = false,
            containerStyle,
            onChangeText,
            onBlur,
            onValidationChange,
            value = '',
            editable,
            ...props
        },
        ref
    ) => {
        // Garantir que editable é true por padrão
        const isEditable = editable !== false;
        // Parse initial value into number and UF
        const parseValue = (val: string) => {
            if (!val) return { number: '', uf: '' };
            const parts = val.split('/');
            return {
                number: parts[0] || '',
                uf: parts[1]?.toUpperCase() || '',
            };
        };

        const [crmNumber, setCrmNumber] = useState(() => parseValue(value).number);
        const [crmUf, setCrmUf] = useState(() => parseValue(value).uf);
        const [localError, setLocalError] = useState<string | undefined>();
        const [isTouched, setIsTouched] = useState(false);
        const [isValid, setIsValid] = useState(false);
        const [showUfPicker, setShowUfPicker] = useState(false);

        // Sync with external value changes
        useEffect(() => {
            const parsed = parseValue(value);
            if (parsed.number !== crmNumber || parsed.uf !== crmUf) {
                setCrmNumber(parsed.number);
                setCrmUf(parsed.uf);
            }
        }, [value]);

        // Combine number and UF into full CRM value
        const getCombinedValue = useCallback((num: string, uf: string) => {
            if (!num && !uf) return '';
            if (num && uf) return `${num}/${uf}`;
            if (num) return num;
            return '';
        }, []);

        // Determine display error and states
        const displayError = externalError || localError;
        const hasError = isTouched && !!displayError;
        const showValid = isTouched && !displayError && isValid && !!crmNumber && !!crmUf;

        const handleNumberChange = useCallback((text: string) => {
            // Only allow digits
            const digitsOnly = text.replace(/\D/g, '');
            setCrmNumber(digitsOnly);
            setLocalError(undefined);

            const combinedValue = getCombinedValue(digitsOnly, crmUf);
            onChangeText?.(combinedValue);
        }, [crmUf, getCombinedValue, onChangeText]);

        const handleUfSelect = useCallback((uf: string) => {
            setCrmUf(uf);
            setShowUfPicker(false);
            setLocalError(undefined);

            const combinedValue = getCombinedValue(crmNumber, uf);
            onChangeText?.(combinedValue);

            // Validate after UF selection
            if (crmNumber && uf) {
                const validation = validateCRM(combinedValue);
                setIsValid(validation.isValid);
                if (!validation.isValid) {
                    setLocalError(validation.error);
                }
                onValidationChange?.(validation.isValid, validation.normalized);
            }
        }, [crmNumber, getCombinedValue, onChangeText, onValidationChange]);

        const handleBlur = useCallback((e: any) => {
            setIsTouched(true);

            const combinedValue = getCombinedValue(crmNumber, crmUf);

            if (combinedValue && crmNumber && crmUf) {
                const validation = validateCRM(combinedValue);

                if (!validation.isValid) {
                    setLocalError(validation.error);
                    setIsValid(false);
                } else {
                    setLocalError(undefined);
                    setIsValid(true);
                }

                onValidationChange?.(validation.isValid, validation.normalized);
            } else if (required && (!crmNumber || !crmUf)) {
                if (!crmNumber) {
                    setLocalError('Número do CRM é obrigatório');
                } else if (!crmUf) {
                    setLocalError('Selecione a UF do CRM');
                }
                setIsValid(false);
                onValidationChange?.(false, '');
            } else if (!required && !crmNumber && !crmUf) {
                setLocalError(undefined);
                setIsValid(true);
                onValidationChange?.(true, '');
            }

            onBlur?.(e);
        }, [crmNumber, crmUf, required, getCombinedValue, onBlur, onValidationChange]);

        const renderUfItem = ({ item }: { item: string }) => (
            <Pressable
                style={({ pressed }) => [
                    styles.ufItem,
                    item === crmUf && styles.ufItemSelected,
                    pressed && styles.ufItemPressed,
                ]}
                onPress={() => handleUfSelect(item)}
            >
                <Text
                    style={[
                        styles.ufItemText,
                        item === crmUf && styles.ufItemTextSelected,
                    ]}
                >
                    {item}
                </Text>
            </Pressable>
        );

        return (
            <View style={[styles.container, containerStyle]}>
                {label && (
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>{label}</Text>
                        {required && <Text style={styles.required}>*</Text>}
                    </View>
                )}

                <View style={styles.inputRow}>
                    {/* Number Input */}
                    <View
                        style={[
                            styles.numberInputContainer,
                            hasError && styles.inputError,
                            showValid && styles.inputValid,
                            !isEditable && styles.inputDisabled,
                        ]}
                    >
                        <Ionicons
                            name="medical-outline"
                            size={20}
                            color="#6B7280"
                            style={styles.leftIcon}
                        />
                        <TextInput
                            ref={ref}
                            style={styles.numberInput}
                            placeholder="12345"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="number-pad"
                            value={crmNumber}
                            onChangeText={handleNumberChange}
                            onBlur={handleBlur}
                            editable={isEditable}
                            maxLength={10}
                            {...props}
                        />
                    </View>

                    {/* Separator */}
                    <Text style={styles.separator}>/</Text>

                    {/* UF Picker Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.ufButton,
                            hasError && styles.inputError,
                            showValid && styles.inputValid,
                            !isEditable && styles.inputDisabled,
                            pressed && isEditable && styles.ufButtonPressed,
                        ]}
                        onPress={() => {
                            setShowUfPicker(true);
                        }}
                        disabled={!isEditable}
                    >
                        <Text
                            style={[
                                styles.ufButtonText,
                                !crmUf && styles.ufButtonPlaceholder,
                            ]}
                        >
                            {crmUf || 'UF'}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={16}
                            color="#6B7280"
                        />
                    </Pressable>

                    {/* Status Icon */}
                    {showValid && (
                        <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#22C55E"
                            style={styles.statusIcon}
                        />
                    )}
                    {hasError && (
                        <Ionicons
                            name="close-circle"
                            size={24}
                            color="#EF4444"
                            style={styles.statusIcon}
                        />
                    )}
                </View>

                {hasError && <Text style={styles.errorText}>{displayError}</Text>}
                <Text style={styles.helperText}>Formato: número/UF (ex: 1234/SP)</Text>

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
            </View>
        );
    }
);

CRMInput.displayName = 'CRMInput';

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
    inputValid: {
        borderColor: '#22C55E',
        backgroundColor: '#F0FDF4',
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
    statusIcon: {
        marginLeft: 8,
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
    ufItem: {
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
    ufItemPressed: {
        backgroundColor: '#D1D5DB',
    },
    ufItemSelected: {
        backgroundColor: '#0066CC',
    },
    ufItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    ufItemTextSelected: {
        color: '#FFFFFF',
    },
});
