import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, Avatar } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import type { ShiftSwapRequestWithDetails, SwapStatus } from '@medsync/shared';

type TabType = 'received' | 'sent';

export default function RequestsScreen() {
  const { staff } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [requests, setRequests] = useState<ShiftSwapRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!staff?.id) return;

    setIsLoading(true);
    try {
      let query = supabase
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
        .order('created_at', { ascending: false });

      if (activeTab === 'received') {
        query = query.eq('target_staff_id', staff.id);
      } else {
        query = query.eq('requester_id', staff.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading requests:', error);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [staff?.id, activeTab]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
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
    return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  const renderRequestItem = ({ item }: { item: ShiftSwapRequestWithDetails }) => {
    const otherPerson = activeTab === 'received' ? item.requester : item.target_staff;
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity onPress={() => router.push(`/(app)/swap/${item.id}`)}>
        <Card variant="outlined" style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <Avatar
              name={otherPerson?.name || '?'}
              color={otherPerson?.color || '#6B7280'}
              size="md"
            />
            <View style={styles.requestInfo}>
              <Text style={styles.requestName}>
                {otherPerson?.name || 'Não definido'}
              </Text>
              <Text style={styles.requestSpecialty}>
                {otherPerson?.specialty || 'Médico(a)'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(item.status)}20` },
              ]}
            >
              <Text
                style={[styles.statusText, { color: getStatusColor(item.status) }]}
              >
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.requestDetails}>
            <View style={styles.shiftPreview}>
              <Text style={styles.shiftLabel}>
                {activeTab === 'received' ? 'Quer trocar:' : 'Sua escala:'}
              </Text>
              <View style={styles.shiftRow}>
                <View
                  style={[
                    styles.shiftDot,
                    { backgroundColor: item.original_shift?.sectors?.color || '#0066CC' },
                  ]}
                />
                <Text style={styles.shiftText}>
                  {item.original_shift
                    ? formatShiftDateTime(item.original_shift.start_time)
                    : 'Escala não definida'}
                </Text>
              </View>
            </View>

            {item.target_shift && (
              <View style={styles.shiftPreview}>
                <Text style={styles.shiftLabel}>Por:</Text>
                <View style={styles.shiftRow}>
                  <View
                    style={[
                      styles.shiftDot,
                      { backgroundColor: item.target_shift?.sectors?.color || '#10B981' },
                    ]}
                  />
                  <Text style={styles.shiftText}>
                    {formatShiftDateTime(item.target_shift.start_time)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {item.requester_notes && (
            <Text style={styles.requestNotes} numberOfLines={2}>
              "{item.requester_notes}"
            </Text>
          )}

          {isPending && activeTab === 'received' && (
            <View style={styles.actionHint}>
              <Ionicons name="hand-left-outline" size={16} color="#0066CC" />
              <Text style={styles.actionHintText}>Toque para responder</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
            Recebidas
          </Text>
          {activeTab !== 'received' && pendingCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
            Enviadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {activeTab === 'received'
                ? 'Nenhuma solicitação recebida'
                : 'Nenhuma solicitação enviada'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'received'
                ? 'Quando alguém quiser trocar uma escala com você, aparecerá aqui'
                : 'Solicite uma troca a partir dos detalhes de uma escala'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#0066CC',
  },
  tabBadge: {
    marginLeft: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  requestSpecialty: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  shiftPreview: {
    marginBottom: 8,
  },
  shiftLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  shiftText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  requestNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionHintText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
