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
  shift_attendance?: {
    check_in_at?: string | null;
    check_out_at?: string | null;
  }[];
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

  // Check for active check-in
  const hasActiveCheckIn = shift.shift_attendance?.some(
    (attendance) => attendance.check_in_at && !attendance.check_out_at
  );

  const activeCheckInStyle = hasActiveCheckIn ? styles.activeCheckInCard : {};
  const activeCheckInBorder = hasActiveCheckIn ? styles.activeCheckInBorder : {};

  if (variant === 'minimal') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Card variant="outlined" style={[styles.minimalCard, hasActiveCheckIn && styles.activeCheckInBorder, style]}>
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
              {hasActiveCheckIn && (
                <View style={styles.activeCheckInBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeCheckInText}>Em andamento</Text>
                </View>
              )}
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
        <Card variant="elevated" style={[styles.compactCard, activeCheckInBorder, style]}>
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
              {hasActiveCheckIn && (
                <View style={styles.activeCheckInBadgeSmall}>
                  <View style={styles.activeDot} />
                </View>
              )}
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
      <Card variant="elevated" style={[styles.fullCard, activeCheckInBorder, style]}>
        {showDate && (
          <ShiftDateHeader date={shift.start_time} status={shift.status} />
        )}

        {hasActiveCheckIn && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerText}>Check-in realizado • Plantão em andamento</Text>
          </View>
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
            {hasActiveCheckIn && (
              <View style={styles.activeCheckInBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeCheckInText}>Em andamento</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Active Check-in Styles
  activeCheckInCard: {
    backgroundColor: '#F0FDF4',
  },
  activeCheckInBorder: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  activeBanner: {
    backgroundColor: '#10B981',
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeCheckInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    marginLeft: 8,
  },
  activeCheckInBadgeSmall: {
    padding: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    marginRight: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  activeCheckInText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },

  // Full variant styles
  fullCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    marginTop: 0,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Compact variant styles
  compactCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  compactInfo: {
    flex: 1,
    // Removed marginLeft as we use gap in parent now
  },
  compactTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
    flexWrap: 'wrap', // Allow wrapping if space is tight
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0, // Prevent status from shrinking
  },

  // Minimal variant styles
  minimalCard: {
    marginBottom: 8,
  },
  minimalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
