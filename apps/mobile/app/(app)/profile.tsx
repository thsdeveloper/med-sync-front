import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, Button } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { staff, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            await signOut();
            setIsLoggingOut(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            name={staff?.name || '?'}
            color={staff?.color || '#0066CC'}
            size="xl"
          />
          <Text style={styles.profileName}>{staff?.name || 'Médico(a)'}</Text>
          <Text style={styles.profileRole}>{staff?.role || 'Profissional de Saúde'}</Text>
          {staff?.specialty && (
            <Text style={styles.profileSpecialty}>{staff.specialty}</Text>
          )}
        </View>

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="medical" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>CRM</Text>
              <Text style={styles.infoValue}>{staff?.crm || 'Não informado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{staff?.email || 'Não informado'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="call" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{staff?.phone || 'Não informado'}</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card variant="outlined" style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={22} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Notificações</Text>
              <Text style={styles.settingSubtext}>Em breve</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="shield-outline" size={22} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Privacidade</Text>
              <Text style={styles.settingSubtext}>Em breve</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle-outline" size={22} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Ajuda</Text>
              <Text style={styles.settingSubtext}>Suporte e FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Button
          title="Sair da Conta"
          onPress={handleLogout}
          variant="outline"
          loading={isLoggingOut}
          style={styles.logoutButton}
        />

        {/* App Version */}
        <Text style={styles.versionText}>MedSync Mobile v1.0.0</Text>
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  profileRole: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  profileSpecialty: {
    fontSize: 14,
    color: '#0066CC',
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  settingsCard: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#1F2937',
  },
  settingSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutButton: {
    borderColor: '#EF4444',
    marginBottom: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
