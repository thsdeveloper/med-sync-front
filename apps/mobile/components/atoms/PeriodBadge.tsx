import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';

export type ShiftPeriod = 'morning' | 'afternoon' | 'night';

interface PeriodConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const PERIOD_CONFIG: Record<ShiftPeriod, PeriodConfig> = {
  morning: { label: 'Manhã', icon: 'sunny', color: '#F59E0B' },
  afternoon: { label: 'Tarde', icon: 'partly-sunny', color: '#F97316' },
  night: { label: 'Noite', icon: 'moon', color: '#6366F1' },
};

export function getShiftPeriod(startTime: string): ShiftPeriod {
  const hour = parseISO(startTime).getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

export function getShiftPeriodConfig(startTime: string): PeriodConfig {
  const period = getShiftPeriod(startTime);
  return PERIOD_CONFIG[period];
}

interface PeriodBadgeProps {
  startTime: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function PeriodBadge({ startTime, showIcon = false, size = 'sm', style }: PeriodBadgeProps) {
  const config = getShiftPeriodConfig(startTime);

  return (
    <View style={[styles.badge, { backgroundColor: `${config.color}15` }, styles[size], style]}>
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={size === 'lg' ? 16 : size === 'md' ? 14 : 12}
          color={config.color}
        />
      )}
      <Text style={[styles.text, { color: config.color }, styles[`${size}Text`]]}>
        {config.label}
      </Text>
    </View>
  );
}

interface PeriodIconProps {
  startTime: string;
  size?: number;
  style?: ViewStyle;
}

export function PeriodIcon({ startTime, size = 48, style }: PeriodIconProps) {
  const config = getShiftPeriodConfig(startTime);

  return (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: `${config.color}15`,
          width: size,
          height: size,
          borderRadius: size * 0.25,
        },
        style
      ]}
    >
      <Ionicons name={config.icon} size={size * 0.5} color={config.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    gap: 4,
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontWeight: '600',
  },
  smText: {
    fontSize: 11,
  },
  mdText: {
    fontSize: 12,
  },
  lgText: {
    fontSize: 13,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
