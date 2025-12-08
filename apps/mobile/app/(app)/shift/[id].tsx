import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import type { Shift, ShiftStatus } from '@medsync/shared';

type ShiftWithRelations = Shift & {
  sectors?: { name: string; color: string };
  organizations?: { name: string };
  facilities?: { name: string; type: string };
};

export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staff } = useAuth();
  const [shift, setShift] = useState<ShiftWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

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
          medical_staff (name, role, color)
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
      case 'pending': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'declined': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: ShiftStatus) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Confirmado';
      case 'declined': return 'Recusado';
      default: return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
            <Text style={[styles.statusText, { color: getStatusColor(shift.status) }]}>
              {getStatusLabel(shift.status)}
            </Text>
          </View>
        </View>

        {/* Date & Time Card */}
        <Card variant="elevated" style={styles.mainCard}>
          <View style={styles.dateSection}>
            <View style={styles.dateIcon}>
              <Ionicons name="calendar" size={24} color="#0066CC" />
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>
                {format(startDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
              <Text style={styles.timeText}>
                {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
              </Text>
              <Text style={styles.durationText}>
                Duração: {duration} hora{duration !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </Card>

        {/* Details Card */}
        <Card variant="outlined" style={styles.detailsCard}>
          {shift.sectors && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="business" size={20} color="#6B7280" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Setor</Text>
                <View style={styles.sectorRow}>
                  <View
                    style={[
                      styles.sectorDot,
                      { backgroundColor: shift.sectors.color },
                    ]}
                  />
                  <Text style={styles.detailValue}>{shift.sectors.name}</Text>
                </View>
              </View>
            </View>
          )}

          {shift.organizations && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="medical" size={20} color="#6B7280" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Organização</Text>
                <Text style={styles.detailValue}>{shift.organizations.name}</Text>
              </View>
            </View>
          )}

          {shift.notes && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="document-text" size={20} color="#6B7280" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Observações</Text>
                <Text style={styles.detailValue}>{shift.notes}</Text>
              </View>
            </View>
          )}
        </Card>

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
      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  mainCard: {
    marginBottom: 16,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0066CC',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsCard: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailIcon: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  actions: {
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    borderColor: '#EF4444',
  },
  swapButton: {},
});
