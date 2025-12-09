import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from '../atoms';
import type { ShiftStatus } from '@medsync/shared';

interface ShiftDateHeaderProps {
  date: string;
  status: ShiftStatus;
  showStatus?: boolean;
  style?: ViewStyle;
}

export function formatShiftDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function formatShiftDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  return format(date, "EEE, dd/MM", { locale: ptBR });
}

export function ShiftDateHeader({ date, status, showStatus = true, style }: ShiftDateHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{formatShiftDate(date)}</Text>
      </View>
      {showStatus && <StatusBadge status={status} size="sm" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
});
