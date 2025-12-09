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
import type { ShiftSwapRequestWithDetails, SwapStatus, AdminSwapStatus } from '@medsync/shared';

type SwapRequestWithAdmin = ShiftSwapRequestWithDetails & {
  admin_status: AdminSwapStatus;
  admin_notes: string | null;
  organization_id: string;
};

export default function SwapDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staff } = useAuth();
  const [request, setRequest] = useState<SwapRequestWithAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const isTargetStaff = request?.target_staff_id === staff?.id;
  const isRequester = request?.requester_id === staff?.id;
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
          requester:medical_staff!shift_swap_requests_requester_id_fkey (id, name, color, specialty),
          target_staff:medical_staff!shift_swap_requests_target_staff_id_fkey (id, name, color, specialty),
          original_shift:shifts!shift_swap_requests_original_shift_id_fkey (
            id, start_time, end_time, status,
            sectors (name, color)
          ),
          target_shift:shifts!shift_swap_requests_target_shift_id_fkey (
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
      'Tem certeza que deseja aceitar esta troca de escala? A troca será enviada para aprovação do administrador.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: async () => {
            setIsAccepting(true);
            try {
              // Atualizar status do swap request - NÃO faz o swap ainda!
              const { error: updateError } = await supabase
                .from('shift_swap_requests')
                .update({
                  status: 'accepted',
                  admin_status: 'pending_admin', // Agora aguarda aprovação do admin
                  responded_at: new Date().toISOString(),
                })
                .eq('id', request.id);

              if (updateError) throw updateError;

              // Buscar admins da organização para notificar
              const { data: admins } = await supabase
                .from('user_organizations')
                .select('user_id')
                .eq('organization_id', request.organization_id)
                .in('role', ['owner', 'admin']);

              // Criar notificações para os admins
              if (admins && admins.length > 0) {
                const notifications = admins.map((admin) => ({
                  organization_id: request.organization_id,
                  user_id: admin.user_id,
                  type: 'shift_swap_accepted',
                  title: 'Troca de plantão aguardando aprovação',
                  body: `${staff.name} aceitou uma solicitação de troca de ${request.requester?.name}`,
                  data: { swap_request_id: request.id },
                }));

                await supabase.from('notifications').insert(notifications);
              }

              // Notificar o solicitante que o colega aceitou
              await supabase.from('notifications').insert({
                organization_id: request.organization_id,
                staff_id: request.requester_id,
                type: 'shift_swap_accepted',
                title: 'Sua solicitação de troca foi aceita',
                body: `${staff.name} aceitou sua solicitação. Aguardando aprovação do administrador.`,
                data: { swap_request_id: request.id },
              });

              Alert.alert(
                'Troca Aceita',
                'Você aceitou a troca! Agora ela será analisada pelo administrador.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
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
    if (!request || !staff) return;

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

              // Notificar o solicitante
              await supabase.from('notifications').insert({
                organization_id: request.organization_id,
                staff_id: request.requester_id,
                type: 'shift_swap_rejected',
                title: 'Solicitação de troca recusada',
                body: `${staff.name} recusou sua solicitação de troca.`,
                data: { swap_request_id: request.id },
              });

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

  const getStatusInfo = () => {
    if (!request) return { color: '#6B7280', label: 'Desconhecido', icon: 'help-circle' };

    const { status, admin_status } = request;

    // Primeiro verifica admin_status
    if (admin_status === 'admin_approved') {
      return { color: '#10B981', label: 'Troca Aprovada', icon: 'checkmark-circle' };
    }
    if (admin_status === 'admin_rejected') {
      return { color: '#EF4444', label: 'Troca Rejeitada', icon: 'close-circle' };
    }
    if (admin_status === 'pending_admin') {
      return { color: '#8B5CF6', label: 'Aguardando Admin', icon: 'time' };
    }

    // Se não está com admin, verifica status normal
    switch (status) {
      case 'pending':
        return { color: '#F59E0B', label: 'Aguardando Resposta', icon: 'time' };
      case 'accepted':
        return { color: '#10B981', label: 'Aceita', icon: 'checkmark-circle' };
      case 'declined':
        return { color: '#EF4444', label: 'Recusada', icon: 'close-circle' };
      case 'cancelled':
        return { color: '#6B7280', label: 'Cancelada', icon: 'ban' };
      default:
        return { color: '#6B7280', label: status, icon: 'help-circle' };
    }
  };

  const formatShiftDateTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
  };

  const renderTimeline = () => {
    if (!request) return null;

    const steps = [
      {
        label: 'Solicitação Enviada',
        done: true,
        active: request.status === 'pending' && request.admin_status === 'pending_staff',
      },
      {
        label: isRequester ? 'Colega Respondeu' : 'Você Respondeu',
        done: request.status === 'accepted' || request.status === 'declined',
        active: request.status === 'pending',
      },
      {
        label: 'Aprovação do Admin',
        done: request.admin_status === 'admin_approved' || request.admin_status === 'admin_rejected',
        active: request.admin_status === 'pending_admin',
      },
      {
        label: 'Troca Concluída',
        done: request.admin_status === 'admin_approved',
        active: false,
      },
    ];

    return (
      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <View key={index} style={styles.timelineStep}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.timelineDot,
                  step.done && styles.timelineDotDone,
                  step.active && styles.timelineDotActive,
                ]}
              >
                {step.done && <Ionicons name="checkmark" size={12} color="white" />}
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    step.done && styles.timelineLineDone,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.timelineLabel,
                step.done && styles.timelineLabelDone,
                step.active && styles.timelineLabelActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    );
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

  const statusInfo = getStatusInfo();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusInfo.color}20` },
            ]}
          >
            <Ionicons
              name={statusInfo.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={statusInfo.color}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <Card variant="outlined" style={styles.timelineCard}>
          <Text style={styles.sectionLabel}>Progresso</Text>
          {renderTimeline()}
        </Card>

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
            {isRequester && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>Você</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Target Staff */}
        {request.target_staff && (
          <Card variant="outlined" style={styles.personCard}>
            <Text style={styles.sectionLabel}>Convidado</Text>
            <View style={styles.personRow}>
              <Avatar
                name={request.target_staff.name || '?'}
                color={request.target_staff.color || '#6B7280'}
                size="lg"
              />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{request.target_staff.name}</Text>
                <Text style={styles.personSpecialty}>
                  {request.target_staff.specialty || 'Médico(a)'}
                </Text>
              </View>
              {isTargetStaff && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>Você</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Shifts Comparison */}
        <Card variant="elevated" style={styles.shiftsCard}>
          <View style={styles.shiftSection}>
            <Text style={styles.shiftLabel}>
              Plantão de {request.requester?.name?.split(' ')[0]}
            </Text>
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
            <Text style={styles.shiftLabel}>
              Plantão de {request.target_staff?.name?.split(' ')[0]}
            </Text>
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

        {/* Admin Notes */}
        {request.admin_notes && (
          <Card variant="outlined" style={[styles.notesCard, { borderColor: '#8B5CF6' }]}>
            <Text style={styles.sectionLabel}>Observação do Administrador</Text>
            <Text style={styles.notesText}>"{request.admin_notes}"</Text>
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
              icon={<Ionicons name="checkmark-circle" size={20} color="white" />}
            />
            <Button
              title="Recusar"
              onPress={handleDecline}
              variant="outline"
              loading={isDeclining}
              style={styles.declineButton}
              textStyle={{ color: '#EF4444' }}
              icon={<Ionicons name="close-circle" size={20} color="#EF4444" />}
            />
          </View>
        )}

        {/* Info message for waiting states */}
        {request.admin_status === 'pending_admin' && (
          <View style={styles.infoMessage}>
            <Ionicons name="information-circle" size={20} color="#8B5CF6" />
            <Text style={styles.infoText}>
              Aguardando aprovação do administrador. Você será notificado quando houver uma decisão.
            </Text>
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
    paddingBottom: 40,
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
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineCard: {
    marginBottom: 16,
    padding: 16,
  },
  timeline: {
    marginTop: 8,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotDone: {
    backgroundColor: '#10B981',
  },
  timelineDotActive: {
    backgroundColor: '#0066CC',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  timelineLineDone: {
    backgroundColor: '#10B981',
  },
  timelineLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    paddingTop: 2,
    flex: 1,
  },
  timelineLabelDone: {
    color: '#1F2937',
  },
  timelineLabelActive: {
    color: '#0066CC',
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
    flex: 1,
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
  youBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
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
    marginBottom: 16,
  },
  notesText: {
    fontSize: 16,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    borderColor: '#EF4444',
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EDE9FE',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#5B21B6',
    lineHeight: 20,
  },
});
