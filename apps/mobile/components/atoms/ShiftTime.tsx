import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

interface ShiftTimeProps {
  startTime: string;
  endTime: string;
  size?: 'sm' | 'md' | 'lg';
  showDuration?: boolean;
  showIcon?: boolean;
  style?: ViewStyle;
}

export function formatShiftTime(start: string, end: string): string {
  return `${format(parseISO(start), 'HH:mm')} - ${format(parseISO(end), 'HH:mm')}`;
}

export function getShiftDuration(start: string, end: string): string {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const hours = differenceInHours(endDate, startDate);
  const minutes = differenceInMinutes(endDate, startDate) % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${minutes}min`;
}

export function ShiftTime({
  startTime,
  endTime,
  size = 'md',
  showDuration = false,
  showIcon = false,
  style
}: ShiftTimeProps) {
  const timeText = formatShiftTime(startTime, endTime);
  const duration = getShiftDuration(startTime, endTime);

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <Ionicons
          name="time-outline"
          size={size === 'lg' ? 18 : size === 'md' ? 16 : 14}
          color="#6B7280"
          style={styles.icon}
        />
      )}
      <Text style={[styles.time, styles[`${size}Time`]]}>
        {timeText}
      </Text>
      {showDuration && (
        <Text style={[styles.duration, styles[`${size}Duration`]]}>
          ({duration})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  time: {
    fontWeight: '700',
    color: '#1F2937',
  },
  smTime: {
    fontSize: 14,
  },
  mdTime: {
    fontSize: 16,
  },
  lgTime: {
    fontSize: 18,
  },
  duration: {
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  smDuration: {
    fontSize: 11,
  },
  mdDuration: {
    fontSize: 12,
  },
  lgDuration: {
    fontSize: 13,
  },
});
