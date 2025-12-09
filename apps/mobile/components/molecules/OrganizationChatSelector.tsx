import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import type { OrganizationForChat } from '@medsync/shared';

interface OrganizationChatSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (organization: OrganizationForChat) => void;
}

export function OrganizationChatSelector({
  visible,
  onClose,
  onSelect,
}: OrganizationChatSelectorProps) {
  const { staff } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationForChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible && staff?.id) {
      loadOrganizations();
    }
  }, [visible, staff?.id]);

  const loadOrganizations = async () => {
    if (!staff?.id) return;

    setIsLoading(true);
    try {
      // Get organizations where the staff is linked
      const { data, error } = await supabase
        .from('staff_organizations')
        .select(`
          organization:organizations (
            id,
            name,
            logo_url
          )
        `)
        .eq('staff_id', staff.id)
        .eq('active', true);

      if (error) {
        console.error('Error loading organizations:', error);
        return;
      }

      if (data) {
        const orgs = data
          .map((item: any) => item.organization)
          .filter((org: any) => org !== null) as OrganizationForChat[];
        setOrganizations(orgs);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (org: OrganizationForChat) => {
    onSelect(org);
    onClose();
  };

  const renderOrganization = ({ item }: { item: OrganizationForChat }) => (
    <TouchableOpacity
      style={styles.organizationItem}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <Avatar
        name={item.name}
        color="#0066CC"
        size="lg"
      />
      <View style={styles.organizationInfo}>
        <Text style={styles.organizationName}>{item.name}</Text>
        <Text style={styles.organizationSubtext}>Conversar com administradores</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Falar com Instituição</Text>
            <Text style={styles.subtitle}>
              Selecione a organização para iniciar uma conversa
            </Text>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066CC" />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : organizations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhuma organização encontrada</Text>
              <Text style={styles.emptySubtext}>
                Você não está vinculado a nenhuma organização
              </Text>
            </View>
          ) : (
            <FlatList
              data={organizations}
              renderItem={renderOrganization}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34, // Safe area
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
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
  },
  listContent: {
    paddingVertical: 8,
  },
  organizationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  organizationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  organizationSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 76,
  },
  closeButton: {
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});
