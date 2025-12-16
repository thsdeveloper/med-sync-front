import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShiftCard } from '@/components/organisms';
import { Card } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { useRealtimeShifts } from '@/hooks';
import { supabase } from '@/lib/supabase';
import type { ShiftWithRelations } from '@/lib/realtime-types';

type FilterType = 'all' | 'pending' | 'accepted';

export default function ScheduleScreen() {
  const { staff } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [fetchedShifts, setFetchedShifts] = useState<ShiftWithRelations[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBulkAccepting, setIsBulkAccepting] = useState(false);
  const [isBulkDeclining, setIsBulkDeclining] = useState(false);

  // Realtime hook - auto-updates when shifts change
  const { shifts, pendingCount } = useRealtimeShifts(fetchedShifts);

  // Get all pending shifts
  const pendingShifts = useMemo(() =>
    shifts.filter((shift) => shift.status === 'pending'),
    [shifts]
  );

  // Set status bar to dark when screen is focused
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
    }, [])
  );

  const loadShifts = useCallback(async (date: Date) => {
    if (!staff?.id) return;

    setIsLoading(true);
    try {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const { data } = await supabase
        .from('shifts')
        .select(`
          *,
          sectors (id, name, color),
          organizations (name),
          fixed_schedules (
            facility_id,
            shift_type,
            facilities (name, type)
          ),
          medical_staff (name, role, color),
          shift_attendance (*)
        `)
        .eq('staff_id', staff.id)
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .order('start_time', { ascending: true });

      if (data) {
        setFetchedShifts(data as ShiftWithRelations[]);
      }
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [staff?.id]);

  // Update marked dates when shifts change (from fetch or realtime)
  useEffect(() => {
    const marked: Record<string, any> = {};
    shifts.forEach((shift) => {
      const dateKey = format(parseISO(shift.start_time), 'yyyy-MM-dd');
      const color = shift.status === 'pending' ? '#F59E0B' :
        shift.status === 'accepted' ? '#10B981' : '#6B7280';

      if (!marked[dateKey]) {
        marked[dateKey] = {
          dots: [{ key: shift.id, color }],
        };
      } else {
        marked[dateKey].dots.push({ key: shift.id, color });
      }
    });

    // Mark selected date
    const selectedKey = format(selectedDate, 'yyyy-MM-dd');
    marked[selectedKey] = {
      ...marked[selectedKey],
      selected: true,
      selectedColor: '#0066CC',
    };

    setMarkedDates(marked);
  }, [shifts, selectedDate]);

  useEffect(() => {
    loadShifts(selectedDate);
  }, [loadShifts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShifts(selectedDate);
    setRefreshing(false);
  };

  const handleBulkAccept = async () => {
    if (!staff || pendingShifts.length === 0) return;

    Alert.alert(
      'Confirmar Todas as Escalas',
      `Deseja confirmar ${pendingShifts.length} escala(s) pendente(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Todas',
          onPress: async () => {
            setIsBulkAccepting(true);
            try {
              const pendingIds = pendingShifts.map((s) => s.id);

              // Update all pending shifts to accepted
              const { error: shiftError } = await supabase
                .from('shifts')
                .update({ status: 'accepted' })
                .in('id', pendingIds);

              if (shiftError) throw shiftError;

              // Create response records for all shifts
              const responses = pendingShifts.map((shift) => ({
                shift_id: shift.id,
                staff_id: staff.id,
                response: 'accepted',
                responded_at: new Date().toISOString(),
              }));

              const { error: responseError } = await supabase
                .from('shift_responses')
                .upsert(responses);

              if (responseError) throw responseError;

              Alert.alert('Sucesso', `${pendingShifts.length} escala(s) confirmada(s) com sucesso!`);
              loadShifts(selectedDate);
            } catch (error) {
              console.error('Error bulk accepting shifts:', error);
              Alert.alert('Erro', 'Não foi possível confirmar as escalas');
            } finally {
              setIsBulkAccepting(false);
            }
          },
        },
      ]
    );
  };

  const handleBulkDecline = async () => {
    if (!staff || pendingShifts.length === 0) return;

    Alert.alert(
      'Recusar Todas as Escalas',
      `Tem certeza que deseja recusar ${pendingShifts.length} escala(s) pendente(s)? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar Todas',
          style: 'destructive',
          onPress: async () => {
            setIsBulkDeclining(true);
            try {
              const pendingIds = pendingShifts.map((s) => s.id);

              // Update all pending shifts to declined
              const { error: shiftError } = await supabase
                .from('shifts')
                .update({ status: 'declined' })
                .in('id', pendingIds);

              if (shiftError) throw shiftError;

              // Create response records for all shifts
              const responses = pendingShifts.map((shift) => ({
                shift_id: shift.id,
                staff_id: staff.id,
                response: 'declined',
                responded_at: new Date().toISOString(),
              }));

              const { error: responseError } = await supabase
                .from('shift_responses')
                .upsert(responses);

              if (responseError) throw responseError;

              Alert.alert('Escalas Recusadas', `${pendingShifts.length} escala(s) recusada(s).`);
              loadShifts(selectedDate);
            } catch (error) {
              console.error('Error bulk declining shifts:', error);
              Alert.alert('Erro', 'Não foi possível recusar as escalas');
            } finally {
              setIsBulkDeclining(false);
            }
          },
        },
      ]
    );
  };

  const onDayPress = (day: DateData) => {
    // Parse date string as local date (not UTC) to avoid timezone offset issues
    const [year, month, dayNum] = day.dateString.split('-').map(Number);
    setSelectedDate(new Date(year, month - 1, dayNum));
  };

  const onMonthChange = (month: DateData) => {
    // Parse date string as local date (not UTC) to avoid timezone offset issues
    const [year, monthNum, day] = month.dateString.split('-').map(Number);
    loadShifts(new Date(year, monthNum - 1, day));
  };

  const getFilteredShifts = () => {
    const dayShifts = shifts.filter((shift) =>
      isSameDay(parseISO(shift.start_time), selectedDate)
    );

    if (filter === 'all') return dayShifts;
    return dayShifts.filter((shift) => shift.status === filter);
  };

  const filteredShifts = getFilteredShifts();

  const renderShiftItem = ({ item }: { item: ShiftWithRelations }) => (
    <ShiftCard
      shift={item}
      variant="compact"
      showDate={false}
      showDuration={true}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Calendar */}
      <Calendar
        current={format(selectedDate, 'yyyy-MM-dd')}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: '#FFFFFF',
          calendarBackground: '#FFFFFF',
          textSectionTitleColor: '#6B7280',
          selectedDayBackgroundColor: '#0066CC',
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: '#0066CC',
          dayTextColor: '#1F2937',
          textDisabledColor: '#D1D5DB',
          arrowColor: '#0066CC',
          monthTextColor: '#1F2937',
          textDayFontWeight: '500',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '500',
        }}
      />

      {/* Bulk Actions Banner */}
      {pendingShifts.length > 0 && (
        <Card variant="elevated" style={styles.bulkActionsCard}>
          <View style={styles.bulkActionsHeader}>
            <View style={styles.bulkActionsInfo}>
              <View style={styles.pendingBadge}>
                <Ionicons name="time" size={16} color="#F59E0B" />
                <Text style={styles.pendingCount}>{pendingShifts.length}</Text>
              </View>
              <Text style={styles.bulkActionsText}>
                escala{pendingShifts.length > 1 ? 's' : ''} pendente{pendingShifts.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.bulkActionsButtons}>
            <TouchableOpacity
              style={[styles.bulkButton, styles.acceptAllButton]}
              onPress={handleBulkAccept}
              disabled={isBulkAccepting || isBulkDeclining}
            >
              {isBulkAccepting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.acceptAllText}>Aceitar Todas</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.declineAllButton]}
              onPress={handleBulkDecline}
              disabled={isBulkAccepting || isBulkDeclining}
            >
              {isBulkDeclining ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                  <Text style={styles.declineAllText}>Recusar Todas</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pendentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'accepted' && styles.filterButtonActive]}
          onPress={() => setFilter('accepted')}
        >
          <Text style={[styles.filterText, filter === 'accepted' && styles.filterTextActive]}>
            Confirmados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Date Header */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateHeaderText}>
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </Text>
        <Text style={styles.shiftCount}>
          {filteredShifts.length} plantão(s)
        </Text>
      </View>

      {/* Shifts List */}
      <FlatList
        data={filteredShifts}
        renderItem={renderShiftItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#0066CC" />
            </View>
          ) : fetchedShifts.length === 0 ? (
            <Card variant="elevated" style={styles.requestScheduleCard}>
              <View style={styles.requestScheduleContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={32} color="#0066CC" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.requestTitle}>Nenhuma escala definida</Text>
                  <Text style={styles.requestDescription}>
                    Você não possui escalas para este mês. Entre em contato para solicitar.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.requestButton}
                onPress={() => router.push('/(app)/(tabs)/chat')}
              >
                <Text style={styles.requestButtonText}>Solicitar Escala</Text>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                Nenhum plantão neste dia
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  shiftCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Bulk Actions Styles
  bulkActionsCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bulkActionsHeader: {
    marginBottom: 12,
  },
  bulkActionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  pendingCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 4,
  },
  bulkActionsText: {
    fontSize: 15,
    color: '#92400E',
    fontWeight: '500',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  acceptAllButton: {
    backgroundColor: '#10B981',
  },
  acceptAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineAllButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  declineAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Request Schedule Card Styles
  requestScheduleCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestScheduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
