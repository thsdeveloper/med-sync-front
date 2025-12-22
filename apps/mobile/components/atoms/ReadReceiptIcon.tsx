import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ReadStatus = 'sent' | 'delivered' | 'read';

interface ReadReceiptIconProps {
  status: ReadStatus;
  size?: number;
}

/**
 * ReadReceiptIcon - Shows message delivery/read status
 * - sent: Single check (gray)
 * - delivered: Double check (gray)
 * - read: Eye icon (blue)
 */
export const ReadReceiptIcon = memo(function ReadReceiptIcon({
  status,
  size = 14,
}: ReadReceiptIconProps) {
  switch (status) {
    case 'sent':
      return (
        <Ionicons
          name="checkmark"
          size={size}
          color="rgba(255, 255, 255, 0.7)"
        />
      );
    case 'delivered':
      return (
        <View style={styles.doubleCheck}>
          <Ionicons
            name="checkmark-done"
            size={size}
            color="rgba(255, 255, 255, 0.7)"
          />
        </View>
      );
    case 'read':
      return (
        <Ionicons
          name="eye"
          size={size}
          color="#60A5FA"
        />
      );
    default:
      return null;
  }
});

const styles = StyleSheet.create({
  doubleCheck: {
    flexDirection: 'row',
  },
});

export default ReadReceiptIcon;
