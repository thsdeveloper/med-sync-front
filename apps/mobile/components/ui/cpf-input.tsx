import React, { forwardRef, useState, useCallback } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeCpf, formatCpf, isValidCpfChecksum } from '@medsync/shared';

interface CpfInputProps {
    label?: string;
    error?: string;
    required?: boolean;
    containerStyle?: ViewStyle;
    value: string;
    onChange: (value: string) => void;
    onBlur?: (e: any) => void;
    editable?: boolean;
    placeholder?: string;
    showValidation?: boolean;
}

/**
 * CpfInput - Input component for Brazilian CPF (mobile)
 *
 * Features:
 * - Auto-formats CPF as XXX.XXX.XXX-XX
 * - Stores only digits internally
 * - Validates checksum using official algorithm
 * - Shows visual feedback (checkmark when valid)
 */
export const CpfInput = forwardRef<TextInput, CpfInputProps>(
    (
        {
            label = 'CPF',
            error,
            required = false,
            containerStyle,
            value,
            onChange,
            onBlur,
            editable,
            placeholder,
            showValidation = true,
        },
        ref
    ) => {
        const [isTouched, setIsTouched] = useState(false);
        const isEditable = editable !== false;

        // Format display value
        const displayValue = formatCpf(value || '');

        // Validate
        const normalizedValue = normalizeCpf(value || '');
        const isComplete = normalizedValue.length === 11;
        const isValid = isComplete && isValidCpfChecksum(normalizedValue);
        const showError = isTouched && error;
        const showSuccess = showValidation && isTouched && isValid && !error;

        const handleChange = useCallback((text: string) => {
            // Store only digits (max 11)
            const digits = text.replace(/\D/g, '').slice(0, 11);
            onChange(digits);
        }, [onChange]);

        const handleBlur = useCallback((e: any) => {
            setIsTouched(true);
            onBlur?.(e);
        }, [onBlur]);

        return (
            <View style={[styles.container, containerStyle]}>
                {/* Label */}
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    {required && <Text style={styles.required}>*</Text>}
                </View>

                {/* Input */}
                <View
                    style={[
                        styles.inputContainer,
                        showError && styles.inputError,
                        showSuccess && styles.inputSuccess,
                        !isEditable && styles.inputDisabled,
                    ]}
                >
                    <Ionicons
                        name="card-outline"
                        size={20}
                        color={showSuccess ? '#22C55E' : '#6B7280'}
                        style={styles.leftIcon}
                    />
                    <TextInput
                        ref={ref}
                        style={styles.input}
                        placeholder={placeholder || '000.000.000-00'}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        value={displayValue}
                        onChangeText={handleChange}
                        onBlur={handleBlur}
                        editable={isEditable}
                        maxLength={14} // Formatted length: XXX.XXX.XXX-XX
                    />
                    {showSuccess && (
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#22C55E"
                            style={styles.rightIcon}
                        />
                    )}
                </View>

                {/* Error Message */}
                {showError && <Text style={styles.errorText}>{error}</Text>}

                {/* Helper Text */}
                <Text style={styles.helperText}>
                    Digite apenas os numeros do seu CPF
                </Text>
            </View>
        );
    }
);

CpfInput.displayName = 'CpfInput';

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
    inputContainer: {
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
    inputSuccess: {
        borderColor: '#22C55E',
        backgroundColor: '#F0FDF4',
    },
    inputDisabled: {
        backgroundColor: '#F3F4F6',
        opacity: 0.7,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        paddingRight: 16,
        fontSize: 16,
        color: '#1F2937',
        letterSpacing: 1,
    },
    leftIcon: {
        marginLeft: 16,
    },
    rightIcon: {
        marginRight: 16,
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
});
