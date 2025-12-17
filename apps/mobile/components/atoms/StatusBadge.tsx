/**
 * StatusBadge Atom Component
 *
 * A reusable badge component for displaying attachment status.
 * Shows color-coded badges for pending, accepted, and rejected states.
 *
 * Part of Atomic Design: Atom
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { AttachmentStatus } from '@medsync/shared/schemas';

interface StatusBadgeProps {
  status: AttachmentStatus;
  rejectedReason?: string | null;
  onReasonPress?: () => void;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    backgroundColor: '#FEF3C7', // yellow-100
    textColor: '#92400E', // yellow-900
    borderColor: '#FCD34D', // yellow-300
  },
  accepted: {
    label: 'Aceito',
    backgroundColor: '#D1FAE5', // green-100
    textColor: '#065F46', // green-900
    borderColor: '#6EE7B7', // green-300
  },
  rejected: {
    label: 'Rejeitado',
    backgroundColor: '#FEE2E2', // red-100
    textColor: '#991B1B', // red-900
    borderColor: '#FCA5A5', // red-300
  },
} as const;

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  rejectedReason,
  onReasonPress,
}) => {
  const config = STATUS_CONFIG[status];
  const isRejected = status === 'rejected';
  const hasReason = isRejected && rejectedReason;

  const BadgeContent = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <Text style={[styles.text, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );

  // If rejected with reason and onReasonPress provided, make it touchable
  if (hasReason && onReasonPress) {
    return (
      <TouchableOpacity onPress={onReasonPress} activeOpacity={0.7}>
        {BadgeContent}
      </TouchableOpacity>
    );
  }

  return BadgeContent;
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
