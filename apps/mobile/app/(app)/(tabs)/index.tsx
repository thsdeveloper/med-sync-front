import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar } from '@/components/ui';
import { ShiftCard } from '@/components/organisms';
import { useAuth } from '@/providers/auth-provider';
import { useRealtime } from '@/providers/realtime-provider';
import { useRealtimeShifts, useRealtimeSwapRequests } from '@/hooks';
import { supabase } from '@/lib/supabase';
import type { ShiftWithRelations } from '@/lib/realtime-types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const { staff, signOut } = useAuth();
  const { isConnected } = useRealtime();

  // Initial fetched data state
  const [fetchedShifts, setFetchedShifts] = useState<ShiftWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Realtime hooks - will auto-update when changes occur
  const { shifts: upcomingShifts, pendingCount: pendingAccepts } = useRealtimeShifts(fetchedShifts);
  const { pendingIncomingCount: pendingRequests } = useRealtimeSwapRequests([], staff?.id);

  // Set status bar to light when screen is focused
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
    }, [])
  );

  const loadData = useCallback(async () => {
    if (!staff?.id) return;

    try {
      // Load upcoming shifts with organization and facility data
      const { data: shifts } = await supabase
        .from('shifts')
        .select(`
          *,
          sectors (name, color),
          organizations (name),
          fixed_schedules (
            facility_id,
            shift_type,
            facilities (name, type)
          ),
          shift_attendance (*)
        `)
        .eq('staff_id', staff.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      setFetchedShifts((shifts || []) as ShiftWithRelations[]);
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

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'sunny';
    if (hour >= 12 && hour < 18) return 'partly-sunny';
    return 'moon';
  };

  const getFirstName = () => {
    if (!staff?.name) return 'Doutor(a)';
    const firstName = staff.name.split(' ')[0];
    return `Dr(a). ${firstName}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Elegant Header with Gradient */}
      <LinearGradient
        colors={['#0047B3', '#0066CC', '#0077E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            {/* Left side - Greeting */}
            <View style={styles.headerLeft}>
              <View style={styles.greetingRow}>
                <Ionicons
                  name={getGreetingIcon() as any}
                  size={20}
                  color="#FFD93D"
                  style={styles.greetingIcon}
                />
                <Text style={styles.greetingText}>{getGreeting()},</Text>
              </View>
              <Text style={styles.userName}>{getFirstName()}</Text>
              <Text style={styles.roleText}>{staff?.role || 'Profissional de Saúde'}</Text>
            </View>

            {/* Right side - Avatar & Notifications */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/(app)/(tabs)/requests')}
              >
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                {(pendingAccepts > 0 || pendingRequests > 0) && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {pendingAccepts + pendingRequests}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => router.push('/(app)/profile')}
              >
                <View style={styles.avatarBorder}>
                  <Avatar
                    name={staff?.name || '?'}
                    color={staff?.color || '#FFFFFF'}
                    size="md"
                    imageUrl={staff?.avatar_url || null}
                  />
                </View>
                <View style={styles.onlineIndicator} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Curved bottom edge */}
        <View style={styles.headerCurve}>
          <View style={styles.headerCurveInner} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066CC" />
        }
        showsVerticalScrollIndicator={false}
      >

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
            upcomingShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                variant="full"
                showDate={true}
                showDuration={true}
              />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Elegant Header Styles
  headerGradient: {
    paddingBottom: 0,
  },
  headerSafeArea: {
    paddingTop: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingIcon: {
    marginRight: 6,
  },
  greetingText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  roleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerCurve: {
    height: 24,
    backgroundColor: '#0077E6',
  },
  headerCurveInner: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  alertCard: {
    backgroundColor: '#FFFBEB',
    marginBottom: 16,
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
    marginBottom: 20,
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
