import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { ShiftStatus } from '@medsync/shared';

interface StatusBadgeProps {
  status: ShiftStatus;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<ShiftStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Aguardando', color: '#F59E0B', bgColor: '#FEF3C7' },
  accepted: { label: 'Confirmado', color: '#10B981', bgColor: '#D1FAE5' },
  declined: { label: 'Recusado', color: '#EF4444', bgColor: '#FEE2E2' },
  swap_requested: { label: 'Troca Solicitada', color: '#8B5CF6', bgColor: '#EDE9FE' },
};

export function StatusBadge({ status, size = 'md', style }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, color: '#6B7280', bgColor: '#F3F4F6' };
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, isSmall && styles.badgeSmall, style]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }, isSmall && styles.textSmall]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 11,
  },
});
