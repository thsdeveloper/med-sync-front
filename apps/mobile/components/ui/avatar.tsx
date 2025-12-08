import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export function Avatar({ name, color = '#0066CC', size = 'md', style }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <View style={[styles.avatar, styles[size], { backgroundColor: color }, style]}>
      <Text style={[styles.text, styles[`text_${size}`]]}>{initials}</Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 40,
    height: 40,
  },
  lg: {
    width: 56,
    height: 56,
  },
  xl: {
    width: 80,
    height: 80,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 12,
  },
  text_md: {
    fontSize: 14,
  },
  text_lg: {
    fontSize: 20,
  },
  text_xl: {
    fontSize: 28,
  },
});
