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
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button, Card, Avatar } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import type { ShiftSwapRequestWithDetails, SwapStatus } from '@medsync/shared';

export default function SwapDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staff } = useAuth();
  const [request, setRequest] = useState<ShiftSwapRequestWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const isTargetStaff = request?.target_staff_id === staff?.id;
  const canRespond = request?.status === 'pending' && isTargetStaff;

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('shift_swap_requests')
        .select(`
          *,
          requester:medical_staff!requester_id (id, name, color, specialty),
          target_staff:medical_staff!target_staff_id (id, name, color, specialty),
          original_shift:shifts!original_shift_id (
            id, start_time, end_time, status,
            sectors (name, color)
          ),
          target_shift:shifts!target_shift_id (
            id, start_time, end_time, status,
            sectors (name, color)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!request || !staff) return;

    Alert.alert(
      'Aceitar Troca',
      'Tem certeza que deseja aceitar esta troca de escala?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: async () => {
            setIsAccepting(true);
            try {
              // Update swap request status
              const { error: updateError } = await supabase
                .from('shift_swap_requests')
                .update({
                  status: 'accepted',
                  responded_at: new Date().toISOString(),
                })
                .eq('id', request.id);

              if (updateError) throw updateError;

              // Swap the staff_id on the shifts
              if (request.original_shift && request.target_shift) {
                // Swap original shift to target staff
                await supabase
                  .from('shifts')
                  .update({ staff_id: request.target_staff_id })
                  .eq('id', request.original_shift_id);

                // Swap target shift to requester
                await supabase
                  .from('shifts')
                  .update({ staff_id: request.requester_id })
                  .eq('id', request.target_shift_id);
              }

              Alert.alert('Sucesso', 'Troca aceita com sucesso!', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Error accepting swap:', error);
              Alert.alert('Erro', 'Não foi possível aceitar a troca');
            } finally {
              setIsAccepting(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async () => {
    if (!request) return;

    Alert.alert(
      'Recusar Troca',
      'Tem certeza que deseja recusar esta solicitação de troca?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: async () => {
            setIsDeclining(true);
            try {
              const { error } = await supabase
                .from('shift_swap_requests')
                .update({
                  status: 'declined',
                  responded_at: new Date().toISOString(),
                })
                .eq('id', request.id);

              if (error) throw error;

              Alert.alert('Solicitação recusada', 'A troca foi recusada.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Error declining swap:', error);
              Alert.alert('Erro', 'Não foi possível recusar a troca');
            } finally {
              setIsDeclining(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: SwapStatus) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'declined': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: SwapStatus) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceita';
      case 'declined': return 'Recusada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const formatShiftDateTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
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

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Solicitação não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(request.status)}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {getStatusLabel(request.status)}
            </Text>
          </View>
        </View>

        {/* Requester Info */}
        <Card variant="outlined" style={styles.personCard}>
          <Text style={styles.sectionLabel}>Solicitante</Text>
          <View style={styles.personRow}>
            <Avatar
              name={request.requester?.name || '?'}
              color={request.requester?.color || '#6B7280'}
              size="lg"
            />
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{request.requester?.name}</Text>
              <Text style={styles.personSpecialty}>
                {request.requester?.specialty || 'Médico(a)'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Shifts Comparison */}
        <Card variant="elevated" style={styles.shiftsCard}>
          <View style={styles.shiftSection}>
            <Text style={styles.shiftLabel}>Escala a trocar</Text>
            {request.original_shift ? (
              <View style={styles.shiftInfo}>
                <View
                  style={[
                    styles.shiftDot,
                    { backgroundColor: request.original_shift.sectors?.color || '#0066CC' },
                  ]}
                />
                <View>
                  <Text style={styles.shiftDateTime}>
                    {formatShiftDateTime(request.original_shift.start_time)}
                  </Text>
                  {request.original_shift.sectors?.name && (
                    <Text style={styles.shiftSector}>
                      {request.original_shift.sectors.name}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.noShift}>Escala não definida</Text>
            )}
          </View>

          <View style={styles.swapIcon}>
            <Ionicons name="swap-vertical" size={24} color="#0066CC" />
          </View>

          <View style={styles.shiftSection}>
            <Text style={styles.shiftLabel}>Por esta escala</Text>
            {request.target_shift ? (
              <View style={styles.shiftInfo}>
                <View
                  style={[
                    styles.shiftDot,
                    { backgroundColor: request.target_shift.sectors?.color || '#10B981' },
                  ]}
                />
                <View>
                  <Text style={styles.shiftDateTime}>
                    {formatShiftDateTime(request.target_shift.start_time)}
                  </Text>
                  {request.target_shift.sectors?.name && (
                    <Text style={styles.shiftSector}>
                      {request.target_shift.sectors.name}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.noShift}>Qualquer escala disponível</Text>
            )}
          </View>
        </Card>

        {/* Notes */}
        {request.requester_notes && (
          <Card variant="outlined" style={styles.notesCard}>
            <Text style={styles.sectionLabel}>Mensagem do solicitante</Text>
            <Text style={styles.notesText}>"{request.requester_notes}"</Text>
          </Card>
        )}

        {/* Actions */}
        {canRespond && (
          <View style={styles.actions}>
            <Button
              title="Aceitar Troca"
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  personCard: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personInfo: {
    marginLeft: 16,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  personSpecialty: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  shiftsCard: {
    marginBottom: 16,
  },
  shiftSection: {
    paddingVertical: 8,
  },
  shiftLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shiftDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  shiftDateTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  shiftSector: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  noShift: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  swapIcon: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  notesCard: {
    marginBottom: 24,
  },
  notesText: {
    fontSize: 16,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 24,
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
});
