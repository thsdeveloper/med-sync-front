import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '@/components/ui';
import { ProfileAvatarUpload } from '@/components/molecules';
import { useAuth } from '@/providers/auth-provider';
import { formatCpf } from '@medsync/shared';

export default function ProfileScreen() {
  const { staff, signOut, refreshStaff, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Format CPF for display
  const formattedCpf = useMemo(() => {
    if (!staff?.cpf) return null;
    return formatCpf(staff.cpf);
  }, [staff?.cpf]);

  // Format registration number with conselho sigla
  const formattedRegistro = useMemo(() => {
    if (!staff?.registro_numero || !staff?.registro_uf) return null;
    const conselho = staff.profissao?.conselho?.sigla || 'REG';
    const categoria = staff.registro_categoria ? `/${staff.registro_categoria}` : '';
    return `${conselho} ${staff.registro_numero}${categoria} - ${staff.registro_uf}`;
  }, [staff?.registro_numero, staff?.registro_uf, staff?.registro_categoria, staff?.profissao?.conselho?.sigla]);

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

  // Handle loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle error state (no staff data)
  if (!staff) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Erro ao Carregar Perfil</Text>
          <Text style={styles.errorMessage}>
            Não foi possível carregar seus dados. Tente novamente.
          </Text>
          <Button
            title="Tentar Novamente"
            onPress={refreshStaff}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with Avatar Upload */}
        <View style={styles.profileHeader}>
          <ProfileAvatarUpload
            userId={staff.user_id || ''}
            userName={staff.name}
            currentAvatarUrl={staff.avatar_url}
            onUploadComplete={() => {
              // Refresh profile data to get updated avatar_url from database
              console.log('[ProfileScreen] Avatar upload complete, refreshing profile data');
              refreshStaff();
            }}
            size={160}
            color={staff.color || '#0066CC'}
            editable={true}
          />
          <Text style={styles.profileName}>{staff.name}</Text>
          <Text style={styles.profileRole}>{staff.profissao?.nome || 'Profissional de Saúde'}</Text>
          {staff.especialidade?.nome && (
            <Text style={styles.profileSpecialty}>
              {staff.especialidade.nome}
            </Text>
          )}
        </View>

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Suas Informacoes</Text>

          {/* Registro Profissional */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="ribbon" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Registro Profissional</Text>
              <Text style={styles.infoValue}>{formattedRegistro || 'Nao informado'}</Text>
            </View>
          </View>

          {/* Profissao */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="briefcase" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Profissao</Text>
              <Text style={styles.infoValue}>{staff?.profissao?.nome || 'Nao informado'}</Text>
            </View>
          </View>

          {/* Especialidade */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="medical" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Especialidade</Text>
              <Text style={styles.infoValue}>{staff?.especialidade?.nome || 'Nao informado'}</Text>
            </View>
          </View>

          {/* CPF */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="card" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>CPF</Text>
              <Text style={styles.infoValue}>{formattedCpf || 'Nao informado'}</Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{staff?.email || 'Nao informado'}</Text>
            </View>
          </View>

          {/* Telefone */}
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <View style={styles.infoIcon}>
              <Ionicons name="call" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{staff?.phone || 'Nao informado'}</Text>
            </View>
          </View>
        </Card>

        {/* Edit Profile Button */}
        <Button
          title="Editar Perfil"
          onPress={() => router.push('/profile-edit')}
          variant="outline"
          style={styles.editProfileButton}
        />

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    minWidth: 200,
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
  editProfileButton: {
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
  infoRowLast: {
    borderBottomWidth: 0,
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
