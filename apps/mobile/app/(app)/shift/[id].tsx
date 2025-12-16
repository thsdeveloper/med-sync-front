import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { differenceInHours, parseISO } from 'date-fns';
import { Button, Card } from '@/components/ui';
import { ShiftDetailHeader } from '@/components/organisms/ShiftDetailHeader';
import { AttendanceStatusBadge } from '@/components/atoms';
import {
  CheckInOutButton,
  AttendanceTimeInfo,
  FacilityLocationActions,
  AddressDetailsCollapsible,
} from '@/components/molecules';
import { useAuth } from '@/providers/auth-provider';
import { useShiftAttendance } from '@/hooks';
import { supabase } from '@/lib/supabase';
import type { Shift, ShiftStatus } from '@medsync/shared';

type FacilityAddress = {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
};

type ShiftWithRelations = Shift & {
  sectors?: { name: string; color: string };
  organizations?: { name: string };
  fixed_schedules?: {
    facility_id: string;
    facilities: {
      name: string;
      type: string;
      address?: string;
      facility_addresses?: FacilityAddress | null;
    };
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
            facilities (
              name,
              type,
              address,
              facility_addresses (
                id,
                street,
                number,
                complement,
                neighborhood,
                city,
                state,
                postal_code,
                country,
                latitude,
                longitude
              )
            )
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
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ status: 'accepted' })
        .eq('id', shift.id);

      if (shiftError) throw shiftError;

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
    router.push(`/(app)/shift/${id}/request-swap`);
  };

  const handleCheckIn = async () => {
    const success = await checkIn();
    if (success) {
      // Force refresh or optimistic update could be good here
      Alert.alert('Sucesso', 'Entrada registrada com sucesso!');
    } else if (attendanceError) {
      Alert.alert('Erro', attendanceError);
    }
  };

  const handleCheckOut = async () => {
    const success = await checkOut();
    if (success) {
      Alert.alert('Sucesso', 'Saída registrada com sucesso!');
    } else if (attendanceError) {
      Alert.alert('Erro', attendanceError);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!shift) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Escala não encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  const startDate = parseISO(shift.start_time);
  const headerColor = shift.sectors?.color || (shift.status === 'pending' ? '#F59E0B' : '#0066CC');

  // Determine shift period name (Turno)
  const hour = startDate.getHours();
  let periodName = 'Plantão';
  let iconName: keyof typeof Ionicons.glyphMap = 'moon';

  if (hour >= 5 && hour < 12) {
    periodName = 'Plantão Matutino';
    iconName = 'sunny';
  } else if (hour >= 12 && hour < 18) {
    periodName = 'Plantão Vespertino';
    iconName = 'partly-sunny';
  } else {
    periodName = 'Plantão Noturno';
    iconName = 'moon';
  }

  const facilityType = shift.fixed_schedules?.facilities?.type || 'Clínica';

  return (
    <ShiftDetailHeader
      startTime={shift.start_time}
      endTime={shift.end_time}
      color={headerColor}
      title={periodName}
      iconName={iconName}
    >
      <View style={styles.content}>

        {/* Status Section */}
        {shift.status === 'pending' && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time" size={20} color="#B45309" />
            <Text style={styles.pendingText}>Esta escala requer sua confirmação</Text>
          </View>
        )}

        {/* Action Buttons for Pending */}
        {shift.status === 'pending' && (
          <View style={styles.actionRow}>
            <Button
              title="Confirmar"
              onPress={handleAccept}
              loading={isAccepting}
              style={{ ...styles.actionButton, backgroundColor: '#10B981' }}
              icon={<Ionicons name="checkmark-circle" size={18} color="white" />}
            />
            <Button
              title="Recusar"
              onPress={handleDecline}
              variant="outline"
              loading={isDeclining}
              style={{ ...styles.actionButton, borderColor: '#EF4444' }}
              textStyle={{ color: '#EF4444' }}
              icon={<Ionicons name="close-circle" size={18} color="#EF4444" />}
            />
          </View>
        )}


        {/* Attendance Card - Main Action if Accepted */}
        {shift.status === 'accepted' && (
          <Card variant="elevated" style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="finger-print" size={24} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Registro de Ponto</Text>
                <AttendanceStatusBadge status={attendanceStatus} size="sm" />
              </View>
            </View>

            {attendance && (
              <View style={styles.attendanceTimeContainer}>
                <AttendanceTimeInfo attendance={attendance} />
              </View>
            )}

            <View style={styles.checkInOutContainer}>
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


        {/* Location Info */}
        <Text style={styles.sectionTitle}>Localização</Text>
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons
                name={facilityType === 'hospital' ? 'business' : 'medkit'}
                size={20}
                color="#4B5563"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{facilityType === 'hospital' ? 'Hospital' : 'Unidade'}</Text>
              <Text style={styles.infoValue}>{shift.fixed_schedules?.facilities?.name}</Text>
            </View>
          </View>

          {/* Address Details - Structured from facility_addresses or fallback to old address field */}
          {shift.fixed_schedules?.facilities?.facility_addresses ? (
            <>
              <View style={[styles.row, { marginTop: 12 }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                  <Ionicons name="location" size={20} color="#4B5563" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Endereço</Text>
                  <Text style={styles.infoValueAddress}>
                    {shift.fixed_schedules.facilities.facility_addresses.street}, {shift.fixed_schedules.facilities.facility_addresses.number}
                    {shift.fixed_schedules.facilities.facility_addresses.complement && ` - ${shift.fixed_schedules.facilities.facility_addresses.complement}`}
                  </Text>
                  <Text style={styles.infoValueAddress}>
                    {shift.fixed_schedules.facilities.facility_addresses.neighborhood} - {shift.fixed_schedules.facilities.facility_addresses.city}/{shift.fixed_schedules.facilities.facility_addresses.state}
                  </Text>
                </View>
              </View>
              <AddressDetailsCollapsible address={shift.fixed_schedules.facilities.facility_addresses} />
              <FacilityLocationActions
                facilityAddress={shift.fixed_schedules.facilities.facility_addresses}
                facilityName={shift.fixed_schedules.facilities.name}
              />
            </>
          ) : shift.fixed_schedules?.facilities?.address ? (
            <>
              <View style={[styles.row, { marginTop: 12 }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                  <Ionicons name="location" size={20} color="#4B5563" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Endereço</Text>
                  <Text style={styles.infoValueAddress}>{shift.fixed_schedules.facilities.address}</Text>
                </View>
              </View>
              <FacilityLocationActions
                fallbackAddress={shift.fixed_schedules.facilities.address}
                facilityName={shift.fixed_schedules.facilities.name}
              />
            </>
          ) : null}
        </Card>

        {/* Sector & Org Info */}
        <Text style={styles.sectionTitle}>Detalhes</Text>
        <View style={styles.gridContainer}>
          {/* Sector */}
          <Card variant="outlined" style={[styles.gridCard, { borderLeftWidth: 4, borderLeftColor: shift.sectors?.color }]}>
            <Text style={styles.gridLabel}>Setor</Text>
            <Text style={styles.gridValue}>{shift.sectors?.name}</Text>
          </Card>

          {/* Organization */}
          <Card variant="outlined" style={styles.gridCard}>
            <Text style={styles.gridLabel}>Organização</Text>
            <Text style={styles.gridValue}>{shift.organizations?.name}</Text>
          </Card>
        </View>

        {/* Notes */}
        {shift.notes && (
          <>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Card variant="outlined" style={styles.noteCard}>
              <Text style={styles.noteText}>{shift.notes}</Text>
            </Card>
          </>
        )}


        {/* Secondary Actions */}
        {shift.status === 'accepted' && (
          <Button
            title="Solicitar Troca"
            onPress={handleRequestSwap}
            variant="ghost"
            style={styles.swapLink}
            textStyle={{ color: '#6B7280' }}
          />
        )}

      </View>
    </ShiftDetailHeader>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  pendingText: {
    marginLeft: 8,
    color: '#92400E',
    fontWeight: '600',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  mainCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  checkInOutContainer: {
    marginTop: 8,
  },
  attendanceTimeContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoValueAddress: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  gridLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  noteCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    marginBottom: 16,
  },
  noteText: {
    fontSize: 14,
    color: '#854D0E',
    lineHeight: 22,
  },
  swapLink: {
    marginTop: 8,
    alignSelf: 'center',
  }
});

