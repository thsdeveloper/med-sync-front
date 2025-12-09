import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { parseISO, differenceInHours } from 'date-fns';
import { Button, Card } from '@/components/ui';
import { ShiftDetailHeader } from '@/components/organisms/ShiftDetailHeader';
import { AttendanceStatusBadge } from '@/components/atoms';
import { CheckInOutButton, AttendanceTimeInfo } from '@/components/molecules';
import { useAuth } from '@/providers/auth-provider';
import { useShiftAttendance } from '@/hooks';
import { supabase } from '@/lib/supabase';
import type { Shift, ShiftStatus } from '@medsync/shared';

type ShiftWithRelations = Shift & {
  sectors?: { name: string; color: string };
  organizations?: { name: string };
  fixed_schedules?: {
    facility_id: string;
    facilities: { name: string; type: string; address?: string };
  };
};

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staff } = useAuth();
  const [shift, setShift] = useState<ShiftWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  // Hook de check-in/check-out
  const {
    attendance,
    attendanceStatus,
    timeWindow,
    isCheckingIn,
    isCheckingOut,
    error: attendanceError,
    checkIn,
    checkOut,
  } = useShiftAttendance({
    shiftId: id || '',
    shiftStartTime: shift?.start_time || '',
    shiftEndTime: shift?.end_time || '',
    shiftStatus: shift?.status || '',
  });

  useEffect(() => {
    loadShift();
  }, [id]);

  const loadShift = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          sectors (name, color),
          organizations (name),
          medical_staff (name, role, color),
          fixed_schedules (
            facility_id,
            facilities (name, type, address)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setShift(data);
    } catch (error) {
      console.error('Error loading shift:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da escala');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!shift || !staff) return;

    setIsAccepting(true);
    try {
      // Update shift status
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ status: 'accepted' })
        .eq('id', shift.id);

      if (shiftError) throw shiftError;

      // Create response record
      const { error: responseError } = await supabase
        .from('shift_responses')
        .upsert({
          shift_id: shift.id,
          staff_id: staff.id,
          response: 'accepted',
          responded_at: new Date().toISOString(),
        });

      if (responseError) throw responseError;

      Alert.alert('Sucesso', 'Escala confirmada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error accepting shift:', error);
      Alert.alert('Erro', 'Não foi possível confirmar a escala');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!shift || !staff) return;

    Alert.alert(
      'Recusar Escala',
      'Tem certeza que deseja recusar esta escala? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: async () => {
            setIsDeclining(true);
            try {
              const { error: shiftError } = await supabase
                .from('shifts')
                .update({ status: 'declined' })
                .eq('id', shift.id);

              if (shiftError) throw shiftError;

              const { error: responseError } = await supabase
                .from('shift_responses')
                .upsert({
                  shift_id: shift.id,
                  staff_id: staff.id,
                  response: 'declined',
                  responded_at: new Date().toISOString(),
                });

              if (responseError) throw responseError;

              Alert.alert('Escala recusada', 'A escala foi recusada.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Error declining shift:', error);
              Alert.alert('Erro', 'Não foi possível recusar a escala');
            } finally {
              setIsDeclining(false);
            }
          },
        },
      ]
    );
  };

  const handleRequestSwap = () => {
    // TODO: Navigate to swap request screen
    Alert.alert('Em breve', 'Funcionalidade de troca em desenvolvimento');
  };

  // Handler de check-in
  const handleCheckIn = async () => {
    const success = await checkIn();
    if (success) {
      Alert.alert('Sucesso', 'Entrada registrada com sucesso!');
    } else if (attendanceError) {
      Alert.alert('Erro', attendanceError);
    }
  };

  // Handler de check-out
  const handleCheckOut = async () => {
    const success = await checkOut();
    if (success) {
      Alert.alert('Sucesso', 'Saida registrada com sucesso!');
    } else if (attendanceError) {
      Alert.alert('Erro', attendanceError);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      </SafeAreaView>
    );
  }

  if (!shift) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Escala não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startDate = parseISO(shift.start_time);
  const endDate = parseISO(shift.end_time);
  const duration = differenceInHours(endDate, startDate);

  const getStatusColor = (status: ShiftStatus) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'accepted':
        return '#10B981';
      case 'declined':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: ShiftStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Confirmado';
      case 'declined':
        return 'Recusado';
      default:
        return status;
    }
  };

  return (
    <ShiftDetailHeader startTime={shift.start_time} endTime={shift.end_time}>
      <View style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(shift.status)}20` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(shift.status) },
              ]}
            />
            <Text
              style={[styles.statusText, { color: getStatusColor(shift.status) }]}
            >
              {getStatusLabel(shift.status)}
            </Text>
          </View>
        </View>

        {/* Duration Card */}
        <Card variant="elevated" style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBadge, { backgroundColor: '#EBF5FF' }]}>
              <Ionicons name="time-outline" size={18} color="#0066CC" />
            </View>
            <Text style={styles.cardTitle}>Duração do Plantão</Text>
          </View>
          <Text style={styles.cardValueLarge}>
            {duration} hora{duration !== 1 ? 's' : ''}
          </Text>
        </Card>

        {/* Facility Card - Destaque para a Clínica/Hospital */}
        {shift.fixed_schedules?.facilities && (
          <Card variant="elevated" style={styles.facilityCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Ionicons
                  name={shift.fixed_schedules.facilities.type === 'hospital' ? 'medkit' : 'business'}
                  size={18}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.facilityTypeLabel}>
                {shift.fixed_schedules.facilities.type === 'hospital' ? 'Hospital' : 'Clínica'}
              </Text>
            </View>
            <Text style={styles.facilityName}>
              {shift.fixed_schedules.facilities.name}
            </Text>
            {shift.fixed_schedules.facilities.address && (
              <View style={styles.facilityAddressRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.facilityAddress}>
                  {shift.fixed_schedules.facilities.address}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Sector Card */}
        {shift.sectors && (
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBadge, { backgroundColor: `${shift.sectors.color}20` }]}>
                <Ionicons name="grid-outline" size={18} color={shift.sectors.color} />
              </View>
              <Text style={styles.cardTitle}>Setor</Text>
            </View>
            <View style={styles.sectorRow}>
              <View
                style={[
                  styles.sectorDot,
                  { backgroundColor: shift.sectors.color },
                ]}
              />
              <Text style={styles.cardValue}>{shift.sectors.name}</Text>
            </View>
          </Card>
        )}

        {/* Organization Card */}
        {shift.organizations && (
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBadge, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="briefcase-outline" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.cardTitle}>Organização</Text>
            </View>
            <Text style={styles.cardValue}>{shift.organizations.name}</Text>
          </Card>
        )}

        {/* Notes Card */}
        {shift.notes && (
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>Observacoes</Text>
            </View>
            <Text style={styles.cardValue}>{shift.notes}</Text>
          </Card>
        )}

        {/* Attendance Card - Check-in/Check-out */}
        {shift.status === 'accepted' && (
          <Card variant="elevated" style={styles.attendanceCard}>
            <View style={styles.attendanceHeader}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBadge, { backgroundColor: '#EBF5FF' }]}>
                  <Ionicons name="finger-print" size={18} color="#0066CC" />
                </View>
                <Text style={styles.cardTitle}>Registro de Presenca</Text>
              </View>
              <AttendanceStatusBadge status={attendanceStatus} size="sm" />
            </View>

            {attendance && (
              <View style={styles.attendanceTimeInfoContainer}>
                <AttendanceTimeInfo attendance={attendance} />
              </View>
            )}

            <View style={styles.attendanceButtonContainer}>
              <CheckInOutButton
                attendanceStatus={attendanceStatus}
                canCheckIn={timeWindow.canCheckIn}
                canCheckOut={timeWindow.canCheckOut}
                isCheckingIn={isCheckingIn}
                isCheckingOut={isCheckingOut}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                minutesUntilCheckIn={timeWindow.minutesUntilCheckIn}
                minutesUntilCheckOut={timeWindow.minutesUntilCheckOut}
                isBeforeCheckInWindow={timeWindow.isBeforeCheckInWindow}
                isAfterCheckInWindow={timeWindow.isAfterCheckInWindow}
                isAfterCheckOutWindow={timeWindow.isAfterCheckOutWindow}
              />
            </View>
          </Card>
        )}

        {/* Actions */}
        {shift.status === 'pending' && (
          <View style={styles.actions}>
            <Button
              title="Confirmar Escala"
              onPress={handleAccept}
              loading={isAccepting}
              style={styles.acceptButton}
            />
            <Button
              title="Recusar"
              onPress={handleDecline}
              variant="outline"
              loading={isDeclining}
              style={styles.declineButton}
            />
          </View>
        )}

        {shift.status === 'accepted' && (
          <View style={styles.actions}>
            <Button
              title="Solicitar Troca"
              onPress={handleRequestSwap}
              variant="secondary"
              style={styles.swapButton}
            />
          </View>
        )}
      </View>
    </ShiftDetailHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 42,
  },
  cardValueLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 42,
  },
  facilityCard: {
    marginBottom: 12,
    backgroundColor: '#0066CC',
  },
  facilityTypeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 42,
  },
  facilityAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 42,
    gap: 6,
  },
  facilityAddress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    flex: 1,
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 42,
  },
  sectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  actions: {
    gap: 12,
  },
  attendanceCard: {
    marginBottom: 12,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceTimeInfoContainer: {
    marginTop: 8,
  },
  attendanceButtonContainer: {
    marginTop: 16,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    borderColor: '#EF4444',
  },
  swapButton: {},
});
