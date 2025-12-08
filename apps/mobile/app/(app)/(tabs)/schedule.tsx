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
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import type { Shift, ShiftStatus } from '@medsync/shared';

type FilterType = 'all' | 'pending' | 'accepted';

export default function ScheduleScreen() {
  const { staff } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          medical_staff (name, role, color)
        `)
        .eq('staff_id', staff.id)
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .order('start_time', { ascending: true });

      if (data) {
        setShifts(data);

        // Build marked dates for calendar
        const marked: Record<string, any> = {};
        data.forEach((shift) => {
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
      }
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [staff?.id, selectedDate]);

  useEffect(() => {
    loadShifts(selectedDate);
  }, [loadShifts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShifts(selectedDate);
    setRefreshing(false);
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(new Date(day.dateString));
  };

  const onMonthChange = (month: DateData) => {
    loadShifts(new Date(month.dateString));
  };

  const getFilteredShifts = () => {
    const dayShifts = shifts.filter((shift) =>
      isSameDay(parseISO(shift.start_time), selectedDate)
    );

    if (filter === 'all') return dayShifts;
    return dayShifts.filter((shift) => shift.status === filter);
  };

  const filteredShifts = getFilteredShifts();

  const formatShiftTime = (start: string, end: string) => {
    return `${format(parseISO(start), 'HH:mm')} - ${format(parseISO(end), 'HH:mm')}`;
  };

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

  const renderShiftItem = ({ item }: { item: Shift }) => (
    <TouchableOpacity onPress={() => router.push(`/(app)/shift/${item.id}`)}>
      <Card variant="outlined" style={styles.shiftCard}>
        <View style={styles.shiftHeader}>
          <View
            style={[
              styles.shiftIndicator,
              { backgroundColor: item.sectors?.color || '#0066CC' },
            ]}
          />
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftTime}>
              {formatShiftTime(item.start_time, item.end_time)}
            </Text>
            {item.sectors?.name && (
              <Text style={styles.shiftSector}>{item.sectors.name}</Text>
            )}
            {item.notes && (
              <Text style={styles.shiftNotes} numberOfLines={1}>
                {item.notes}
              </Text>
            )}
          </View>
          <View style={styles.shiftStatus}>
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
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              Nenhum plantão neste dia
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
  shiftTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  shiftSector: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  shiftNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  shiftStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
});
