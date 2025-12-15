import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import type { Shift, MedicalStaff } from '@medsync/shared';

type ShiftWithRelations = Shift & {
  sectors?: { name: string; color: string };
  medical_staff?: { id: string; name: string; color: string };
};

type ColleagueWithShifts = MedicalStaff & {
  shifts: ShiftWithRelations[];
};

export default function RequestSwapScreen() {
  const { id: shiftId } = useLocalSearchParams<{ id: string }>();
  const { staff } = useAuth();

  const [originalShift, setOriginalShift] = useState<ShiftWithRelations | null>(null);
  const [colleagues, setColleagues] = useState<ColleagueWithShifts[]>([]);
  const [selectedColleague, setSelectedColleague] = useState<string | null>(null);
  const [selectedTargetShift, setSelectedTargetShift] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [shiftId]);

  const loadData = async () => {
    if (!shiftId || !staff) return;

    try {
      // Carregar o plantão original
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .select(`
          *,
          sectors (name, color),
          medical_staff (id, name, color)
        `)
        .eq('id', shiftId)
        .single();

      if (shiftError) throw shiftError;
      setOriginalShift(shiftData);

      // Carregar colegas da mesma organização com seus plantões
      const { data: staffData, error: staffError } = await supabase
        .from('medical_staff')
        .select(`
          id, name, color, role,
          especialidade:especialidade_id(id, nome)
        `)
        .eq('active', true)
        .neq('id', staff.id);

      if (staffError) throw staffError;

      // Para cada colega, buscar seus plantões futuros
      const colleaguesWithShifts: ColleagueWithShifts[] = [];

      for (const colleague of staffData || []) {
        const { data: colleagueShifts } = await supabase
          .from('shifts')
          .select(`
            *,
            sectors (name, color),
            medical_staff (id, name, color)
          `)
          .eq('staff_id', colleague.id)
          .eq('organization_id', shiftData.organization_id)
          .eq('status', 'accepted')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(10);

        if (colleagueShifts && colleagueShifts.length > 0) {
          colleaguesWithShifts.push({
            ...colleague,
            shifts: colleagueShifts,
          });
        }
      }

      setColleagues(colleaguesWithShifts);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedColleague || !selectedTargetShift || !originalShift || !staff) {
      Alert.alert('Atenção', 'Selecione um colega e um plantão para trocar');
      return;
    }

    setIsSubmitting(true);
    try {
      // Criar a solicitação de troca
      const { data, error } = await supabase
        .from('shift_swap_requests')
        .insert({
          requester_id: staff.id,
          original_shift_id: shiftId,
          target_shift_id: selectedTargetShift,
          target_staff_id: selectedColleague,
          status: 'pending',
          admin_status: 'pending_staff',
          requester_notes: notes || null,
          organization_id: originalShift.organization_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar notificação para o colega
      await supabase.from('notifications').insert({
        organization_id: originalShift.organization_id,
        staff_id: selectedColleague,
        type: 'shift_swap_request',
        title: 'Solicitação de Troca',
        body: `${staff.name} quer trocar um plantão com você`,
        data: { swap_request_id: data.id },
      });

      Alert.alert(
        'Sucesso',
        'Solicitação de troca enviada! Aguarde a resposta do seu colega.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting swap request:', error);
      Alert.alert('Erro', 'Não foi possível enviar a solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatShiftDate = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return `${format(start, "EEE, dd/MM 'às' HH:mm", { locale: ptBR })} - ${format(end, 'HH:mm', { locale: ptBR })}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  const selectedColleagueData = colleagues.find((c) => c.id === selectedColleague);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Solicitar Troca',
          headerBackTitle: 'Voltar',
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Seu plantão */}
          <Text style={styles.sectionTitle}>Seu Plantão</Text>
          {originalShift && (
            <Card variant="elevated" style={styles.shiftCard}>
              <View style={styles.shiftRow}>
                <View style={[styles.sectorDot, { backgroundColor: originalShift.sectors?.color || '#0066CC' }]} />
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftDate}>
                    {formatShiftDate(originalShift.start_time, originalShift.end_time)}
                  </Text>
                  <Text style={styles.shiftSector}>{originalShift.sectors?.name}</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Selecionar colega */}
          <Text style={styles.sectionTitle}>Selecione um Colega</Text>
          {colleagues.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Nenhum colega com plantões disponíveis</Text>
            </Card>
          ) : (
            <View style={styles.colleagueList}>
              {colleagues.map((colleague) => (
                <TouchableOpacity
                  key={colleague.id}
                  style={[
                    styles.colleagueCard,
                    selectedColleague === colleague.id && styles.colleagueCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedColleague(colleague.id);
                    setSelectedTargetShift(null);
                  }}
                >
                  <View style={[styles.avatar, { backgroundColor: colleague.color || '#0066CC' }]}>
                    <Text style={styles.avatarText}>{getInitials(colleague.name)}</Text>
                  </View>
                  <View style={styles.colleagueInfo}>
                    <Text style={styles.colleagueName}>{colleague.name}</Text>
                    <Text style={styles.colleagueRole}>{colleague.especialidade?.nome || colleague.role}</Text>
                  </View>
                  {selectedColleague === colleague.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Selecionar plantão do colega */}
          {selectedColleagueData && (
            <>
              <Text style={styles.sectionTitle}>
                Plantões de {selectedColleagueData.name.split(' ')[0]}
              </Text>
              <View style={styles.shiftList}>
                {selectedColleagueData.shifts.map((shift) => (
                  <TouchableOpacity
                    key={shift.id}
                    style={[
                      styles.selectableShift,
                      selectedTargetShift === shift.id && styles.selectableShiftSelected,
                    ]}
                    onPress={() => setSelectedTargetShift(shift.id)}
                  >
                    <View style={[styles.sectorDot, { backgroundColor: shift.sectors?.color || '#0066CC' }]} />
                    <View style={styles.shiftInfo}>
                      <Text style={styles.shiftDate}>
                        {formatShiftDate(shift.start_time, shift.end_time)}
                      </Text>
                      <Text style={styles.shiftSector}>{shift.sectors?.name}</Text>
                    </View>
                    {selectedTargetShift === shift.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Notas */}
          <Text style={styles.sectionTitle}>Motivo (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Explique o motivo da troca..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />

          {/* Botão de enviar */}
          <Button
            title="Enviar Solicitação"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedColleague || !selectedTargetShift || isSubmitting}
            style={styles.submitButton}
            icon={<Ionicons name="swap-horizontal" size={20} color="white" />}
          />
        </ScrollView>
      </SafeAreaView>
    </>
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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 16,
  },
  shiftCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  shiftSector: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  colleagueList: {
    gap: 8,
  },
  colleagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colleagueCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  colleagueInfo: {
    flex: 1,
  },
  colleagueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  colleagueRole: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  shiftList: {
    gap: 8,
  },
  selectableShift: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectableShiftSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitButton: {
    marginTop: 24,
  },
});
