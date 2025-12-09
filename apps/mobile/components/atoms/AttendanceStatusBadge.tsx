import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AttendanceStatus } from '@medsync/shared';

interface AttendanceStatusBadgeProps {
    status: AttendanceStatus;
    size?: 'sm' | 'md';
    style?: ViewStyle;
}

const STATUS_CONFIG: Record<
    AttendanceStatus,
    {
        label: string;
        color: string;
        bgColor: string;
        icon: keyof typeof Ionicons.glyphMap;
    }
> = {
    not_started: {
        label: 'Aguardando Entrada',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: 'time-outline',
    },
    in_progress: {
        label: 'Em Andamento',
        color: '#0066CC',
        bgColor: '#EBF5FF',
        icon: 'play-circle',
    },
    completed: {
        label: 'Concluido',
        color: '#10B981',
        bgColor: '#D1FAE5',
        icon: 'checkmark-circle',
    },
};

export function AttendanceStatusBadge({
    status,
    size = 'md',
    style,
}: AttendanceStatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    const isSmall = size === 'sm';

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: config.bgColor },
                isSmall && styles.badgeSmall,
                style,
            ]}
        >
            <Ionicons
                name={config.icon}
                size={isSmall ? 12 : 14}
                color={config.color}
            />
            <Text
                style={[
                    styles.text,
                    { color: config.color },
                    isSmall && styles.textSmall,
                ]}
            >
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeSmall: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
    },
    textSmall: {
        fontSize: 11,
    },
});
