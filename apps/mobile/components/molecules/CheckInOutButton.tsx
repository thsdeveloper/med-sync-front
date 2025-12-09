import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AttendanceStatus } from '@medsync/shared';

interface CheckInOutButtonProps {
    attendanceStatus: AttendanceStatus;
    canCheckIn: boolean;
    canCheckOut: boolean;
    isCheckingIn: boolean;
    isCheckingOut: boolean;
    onCheckIn: () => void;
    onCheckOut: () => void;
    minutesUntilCheckIn: number | null;
    minutesUntilCheckOut: number | null;
    isBeforeCheckInWindow: boolean;
    isAfterCheckInWindow: boolean;
    isAfterCheckOutWindow: boolean;
}

/**
 * Formata minutos em texto legivel (ex: "1h 30min")
 */
function formatMinutes(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    return `${hours}h ${mins}min`;
}

export function CheckInOutButton({
    attendanceStatus,
    canCheckIn,
    canCheckOut,
    isCheckingIn,
    isCheckingOut,
    onCheckIn,
    onCheckOut,
    minutesUntilCheckIn,
    minutesUntilCheckOut,
    isBeforeCheckInWindow,
    isAfterCheckInWindow,
    isAfterCheckOutWindow,
}: CheckInOutButtonProps) {
    // Estado: Concluido - nenhuma acao necessaria
    if (attendanceStatus === 'completed') {
        return (
            <View style={[styles.button, styles.completedButton]}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.completedText}>Plantao Concluido</Text>
            </View>
        );
    }

    // Estado: Em andamento - mostrar botao de check-out
    if (attendanceStatus === 'in_progress') {
        // Janela de check-out expirada
        if (isAfterCheckOutWindow) {
            return (
                <View style={[styles.button, styles.expiredButton]}>
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                    <Text style={styles.expiredText}>
                        Janela de check-out expirada
                    </Text>
                </View>
            );
        }

        // Aguardando janela de check-out abrir
        if (!canCheckOut && minutesUntilCheckOut !== null) {
            return (
                <View style={[styles.button, styles.waitingButton]}>
                    <Ionicons name="time-outline" size={24} color="#6B7280" />
                    <View>
                        <Text style={styles.waitingText}>
                            Check-out disponivel em
                        </Text>
                        <Text style={styles.waitingTime}>
                            {formatMinutes(minutesUntilCheckOut)}
                        </Text>
                    </View>
                </View>
            );
        }

        // Botao de check-out
        return (
            <TouchableOpacity
                style={[styles.button, styles.checkOutButton]}
                onPress={onCheckOut}
                disabled={isCheckingOut || !canCheckOut}
                activeOpacity={0.7}
            >
                {isCheckingOut ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <>
                        <Ionicons name="exit-outline" size={24} color="#FFFFFF" />
                        <Text style={styles.checkOutText}>Registrar Saida</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    }

    // Estado: Nao iniciado - mostrar botao de check-in

    // Janela de check-in expirada
    if (isAfterCheckInWindow) {
        return (
            <View style={[styles.button, styles.expiredButton]}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.expiredText}>
                    Janela de check-in expirada
                </Text>
            </View>
        );
    }

    // Aguardando janela de check-in abrir
    if (isBeforeCheckInWindow && minutesUntilCheckIn !== null) {
        return (
            <View style={[styles.button, styles.waitingButton]}>
                <Ionicons name="time-outline" size={24} color="#6B7280" />
                <View>
                    <Text style={styles.waitingText}>
                        Check-in disponivel em
                    </Text>
                    <Text style={styles.waitingTime}>
                        {formatMinutes(minutesUntilCheckIn)}
                    </Text>
                </View>
            </View>
        );
    }

    // Botao de check-in
    return (
        <TouchableOpacity
            style={[styles.button, styles.checkInButton]}
            onPress={onCheckIn}
            disabled={isCheckingIn || !canCheckIn}
            activeOpacity={0.7}
        >
            {isCheckingIn ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
                <>
                    <Ionicons name="enter-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.checkInText}>Registrar Entrada</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 10,
    },
    checkInButton: {
        backgroundColor: '#10B981',
    },
    checkInText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    checkOutButton: {
        backgroundColor: '#0066CC',
    },
    checkOutText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    completedButton: {
        backgroundColor: '#D1FAE5',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    completedText: {
        color: '#10B981',
        fontSize: 16,
        fontWeight: '600',
    },
    waitingButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    waitingText: {
        color: '#6B7280',
        fontSize: 14,
    },
    waitingTime: {
        color: '#1F2937',
        fontSize: 16,
        fontWeight: '600',
    },
    expiredButton: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    expiredText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
    },
});
