import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ShiftAttendance } from '@medsync/shared';

interface AttendanceTimeInfoProps {
    attendance: ShiftAttendance | null;
}

/**
 * Formata timestamp ISO para hora (HH:mm)
 */
function formatTime(isoString: string | null): string {
    if (!isoString) return '--:--';
    return format(parseISO(isoString), 'HH:mm', { locale: ptBR });
}

/**
 * Formata duracao em minutos para texto legivel
 */
function formatDuration(minutes: number | null): string {
    if (minutes === null) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
}

export function AttendanceTimeInfo({ attendance }: AttendanceTimeInfoProps) {
    if (!attendance) return null;

    return (
        <View style={styles.container}>
            {/* Horario de entrada */}
            <View style={styles.timeRow}>
                <View style={[styles.iconContainer, styles.checkInIcon]}>
                    <Ionicons name="enter-outline" size={16} color="#10B981" />
                </View>
                <View style={styles.timeInfo}>
                    <Text style={styles.label}>Entrada</Text>
                    <Text
                        style={[
                            styles.time,
                            !attendance.check_in_at && styles.timeEmpty,
                        ]}
                    >
                        {formatTime(attendance.check_in_at)}
                    </Text>
                </View>
            </View>

            {/* Divisor */}
            <View style={styles.divider} />

            {/* Horario de saida */}
            <View style={styles.timeRow}>
                <View style={[styles.iconContainer, styles.checkOutIcon]}>
                    <Ionicons name="exit-outline" size={16} color="#0066CC" />
                </View>
                <View style={styles.timeInfo}>
                    <Text style={styles.label}>Saida</Text>
                    <Text
                        style={[
                            styles.time,
                            !attendance.check_out_at && styles.timeEmpty,
                        ]}
                    >
                        {formatTime(attendance.check_out_at)}
                    </Text>
                </View>
            </View>

            {/* Duracao total - apenas se concluido */}
            {attendance.worked_minutes !== null && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.timeRow}>
                        <View style={[styles.iconContainer, styles.durationIcon]}>
                            <Ionicons name="time" size={16} color="#7C3AED" />
                        </View>
                        <View style={styles.timeInfo}>
                            <Text style={styles.label}>Duracao Total</Text>
                            <Text style={styles.duration}>
                                {formatDuration(attendance.worked_minutes)}
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkInIcon: {
        backgroundColor: '#D1FAE5',
    },
    checkOutIcon: {
        backgroundColor: '#EBF5FF',
    },
    durationIcon: {
        backgroundColor: '#EDE9FE',
    },
    timeInfo: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    time: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    timeEmpty: {
        color: '#D1D5DB',
    },
    duration: {
        fontSize: 18,
        fontWeight: '700',
        color: '#7C3AED',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
});
