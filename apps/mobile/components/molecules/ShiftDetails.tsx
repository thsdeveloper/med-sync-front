import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShiftDetailsProps {
  facilityName?: string | null;
  facilityType?: string | null;
  organizationName?: string | null;
  sectorName?: string | null;
  sectorColor?: string | null;
  notes?: string | null;
  maxNotesLines?: number;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function ShiftDetails({
  facilityName,
  facilityType,
  organizationName,
  sectorName,
  sectorColor,
  notes,
  maxNotesLines = 1,
  size = 'md',
  style,
}: ShiftDetailsProps) {
  const getFacilityIcon = (type?: string | null) => {
    return type === 'hospital' ? 'medical' : 'business';
  };

  const hasContent = facilityName || organizationName || sectorName || notes;

  if (!hasContent) return null;

  const isSmall = size === 'sm';

  return (
    <View style={[styles.container, style]}>
      {facilityName && (
        <View style={styles.detailRow}>
          <Ionicons
            name={getFacilityIcon(facilityType) as any}
            size={isSmall ? 12 : 14}
            color="#6B7280"
          />
          <Text style={[styles.detailText, isSmall && styles.detailTextSmall]}>
            {facilityName}
          </Text>
        </View>
      )}

      {organizationName && (
        <View style={styles.detailRow}>
          <Ionicons
            name="globe-outline"
            size={isSmall ? 12 : 14}
            color="#9CA3AF"
          />
          <Text style={[styles.detailTextLight, isSmall && styles.detailTextSmall]}>
            {organizationName}
          </Text>
        </View>
      )}

      {sectorName && (
        <View style={styles.detailRow}>
          <View
            style={[
              styles.sectorDot,
              { backgroundColor: sectorColor || '#0066CC' },
              isSmall && styles.sectorDotSmall,
            ]}
          />
          <Text style={[styles.detailText, isSmall && styles.detailTextSmall]}>
            {sectorName}
          </Text>
        </View>
      )}

      {notes && (
        <View style={styles.detailRow}>
          <Ionicons
            name="document-text-outline"
            size={isSmall ? 12 : 14}
            color="#9CA3AF"
          />
          <Text
            style={[styles.notesText, isSmall && styles.notesTextSmall]}
            numberOfLines={maxNotesLines}
          >
            {notes}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  detailTextSmall: {
    fontSize: 12,
  },
  detailTextLight: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  sectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectorDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notesText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    flex: 1,
  },
  notesTextSmall: {
    fontSize: 11,
  },
});
