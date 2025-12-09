import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '../ui';
import { StatusBadge, PeriodBadge, PeriodIcon, ShiftTime } from '../atoms';
import { ShiftDetails, ShiftDateHeader } from '../molecules';
import type { ShiftStatus } from '@medsync/shared';

// Extended Shift type with relations from Supabase
interface ShiftWithRelations {
  id: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  notes?: string | null;
  sectors?: {
    id?: string;
    name?: string;
    color?: string;
  } | null;
  organizations?: {
    name?: string;
  } | null;
  fixed_schedules?: {
    facility_id?: string;
    shift_type?: string;
    facilities?: {
      name?: string;
      type?: string;
    } | null;
  } | null;
  medical_staff?: {
    name?: string;
    role?: string;
    color?: string;
  } | null;
}

type ShiftCardVariant = 'full' | 'compact' | 'minimal';

interface ShiftCardProps {
  shift: ShiftWithRelations;
  variant?: ShiftCardVariant;
  showDate?: boolean;
  showDuration?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ShiftCard({
  shift,
  variant = 'full',
  showDate = true,
  showDuration = false,
  showChevron = true,
  onPress,
  style,
}: ShiftCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(app)/shift/${shift.id}`);
    }
  };

  const facilityName = shift.fixed_schedules?.facilities?.name;
  const facilityType = shift.fixed_schedules?.facilities?.type;
  const organizationName = shift.organizations?.name;
  const sectorName = shift.sectors?.name;
  const sectorColor = shift.sectors?.color;

  if (variant === 'minimal') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Card variant="outlined" style={[styles.minimalCard, style]}>
          <View style={styles.minimalContent}>
            <View
              style={[
                styles.minimalIndicator,
                { backgroundColor: sectorColor || '#0066CC' },
              ]}
            />
            <View style={styles.minimalInfo}>
              <ShiftTime
                startTime={shift.start_time}
                endTime={shift.end_time}
                size="md"
                showDuration={showDuration}
              />
              {sectorName && (
                <Text style={styles.minimalSector}>{sectorName}</Text>
              )}
              {shift.notes && (
                <Text style={styles.minimalNotes} numberOfLines={1}>
                  {shift.notes}
                </Text>
              )}
            </View>
            <View style={styles.minimalStatus}>
              <StatusBadge status={shift.status} size="sm" />
              {showChevron && (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Card variant="elevated" style={[styles.compactCard, style]}>
          <View style={styles.compactContent}>
            <PeriodIcon startTime={shift.start_time} size={40} />
            <View style={styles.compactInfo}>
              <View style={styles.compactTimeRow}>
                <ShiftTime
                  startTime={shift.start_time}
                  endTime={shift.end_time}
                  size="md"
                  showDuration={showDuration}
                />
                <PeriodBadge startTime={shift.start_time} size="sm" />
              </View>
              <ShiftDetails
                facilityName={facilityName}
                sectorName={sectorName}
                sectorColor={sectorColor}
                size="sm"
              />
            </View>
            <View style={styles.compactRight}>
              <StatusBadge status={shift.status} size="sm" />
              {showChevron && (
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  // Full variant (default)
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card variant="elevated" style={[styles.fullCard, style]}>
        {showDate && (
          <ShiftDateHeader date={shift.start_time} status={shift.status} />
        )}

        <View style={styles.fullBody}>
          <PeriodIcon startTime={shift.start_time} size={48} />

          <View style={styles.fullInfo}>
            <View style={styles.fullTimeRow}>
              <ShiftTime
                startTime={shift.start_time}
                endTime={shift.end_time}
                size="lg"
                showDuration={showDuration}
              />
              <PeriodBadge startTime={shift.start_time} size="sm" />
            </View>

            <ShiftDetails
              facilityName={facilityName}
              facilityType={facilityType}
              organizationName={organizationName}
              sectorName={sectorName}
              sectorColor={sectorColor}
              notes={shift.notes}
              size="md"
            />
          </View>

          {showChevron && (
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          )}
        </View>

        {!showDate && (
          <View style={styles.statusRow}>
            <StatusBadge status={shift.status} size="md" />
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Full variant styles
  fullCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fullTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  statusRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'flex-start',
  },

  // Compact variant styles
  compactCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 10,
  },
  compactTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Minimal variant styles
  minimalCard: {
    marginBottom: 8,
  },
  minimalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimalIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 12,
  },
  minimalInfo: {
    flex: 1,
  },
  minimalSector: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  minimalNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  minimalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
