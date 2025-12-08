import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, Avatar } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import type { Shift, ShiftSwapRequest } from '@medsync/shared';

export default function HomeScreen() {
  const { staff, signOut } = useAuth();
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [pendingAccepts, setPendingAccepts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!staff?.id) return;

    try {
      // Load upcoming shifts
      const { data: shifts } = await supabase
        .from('shifts')
        .select(`
          *,
          sectors (name, color),
          medical_staff (name, role, color)
        `)
        .eq('staff_id', staff.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      setUpcomingShifts(shifts || []);

      // Count pending swap requests
      const { count: swapCount } = await supabase
        .from('shift_swap_requests')
        .select('*', { count: 'exact', head: true })
        .eq('target_staff_id', staff.id)
        .eq('status', 'pending');

      setPendingRequests(swapCount || 0);

      // Count pending shift accepts
      const { count: acceptCount } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('staff_id', staff.id)
        .eq('status', 'pending');

      setPendingAccepts(acceptCount || 0);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [staff?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatShiftDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const formatShiftTime = (start: string, end: string) => {
    return `${format(parseISO(start), 'HH:mm')} - ${format(parseISO(end), 'HH:mm')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{staff?.name?.split(' ')[0] || 'Doutor(a)'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(app)/profile')}
          >
            <Avatar
              name={staff?.name || '?'}
              color={staff?.color || '#0066CC'}
              size="md"
            />
          </TouchableOpacity>
        </View>

        {/* Pending Actions */}
        {(pendingAccepts > 0 || pendingRequests > 0) && (
          <Card variant="elevated" style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              <Text style={styles.alertTitle}>Pendências</Text>
            </View>
            {pendingAccepts > 0 && (
              <TouchableOpacity
                style={styles.alertItem}
                onPress={() => router.push('/(app)/(tabs)/schedule')}
              >
                <Text style={styles.alertText}>
                  {pendingAccepts} escala(s) aguardando confirmação
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            {pendingRequests > 0 && (
              <TouchableOpacity
                style={styles.alertItem}
                onPress={() => router.push('/(app)/(tabs)/requests')}
              >
                <Text style={styles.alertText}>
                  {pendingRequests} solicitação(ões) de troca
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Upcoming Shifts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Plantões</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/schedule')}>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {upcomingShifts.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhum plantão agendado</Text>
            </Card>
          ) : (
            upcomingShifts.map((shift) => (
              <TouchableOpacity
                key={shift.id}
                onPress={() => router.push(`/(app)/shift/${shift.id}`)}
              >
                <Card variant="outlined" style={styles.shiftCard}>
                  <View style={styles.shiftHeader}>
                    <View
                      style={[
                        styles.shiftIndicator,
                        { backgroundColor: shift.sectors?.color || '#0066CC' },
                      ]}
                    />
                    <View style={styles.shiftInfo}>
                      <Text style={styles.shiftDate}>
                        {formatShiftDate(shift.start_time)}
                      </Text>
                      <Text style={styles.shiftTime}>
                        {formatShiftTime(shift.start_time, shift.end_time)}
                      </Text>
                      {shift.sectors?.name && (
                        <Text style={styles.shiftSector}>{shift.sectors.name}</Text>
                      )}
                    </View>
                    <View style={styles.shiftStatus}>
                      {shift.status === 'pending' && (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>Pendente</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(app)/(tabs)/schedule')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EBF5FF' }]}>
                <Ionicons name="calendar" size={24} color="#0066CC" />
              </View>
              <Text style={styles.quickActionText}>Escalas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(app)/(tabs)/requests')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="swap-horizontal" size={24} color="#D97706" />
              </View>
              <Text style={styles.quickActionText}>Trocas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(app)/(tabs)/chat')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="chatbubbles" size={24} color="#059669" />
              </View>
              <Text style={styles.quickActionText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(app)/profile')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="person" size={24} color="#7C3AED" />
              </View>
              <Text style={styles.quickActionText}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileButton: {
    marginLeft: 16,
  },
  alertCard: {
    backgroundColor: '#FFFBEB',
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#78350F',
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionLink: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  shiftCard: {
    marginBottom: 8,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  shiftTime: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  shiftSector: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  shiftStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
