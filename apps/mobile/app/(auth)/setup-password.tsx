import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card, Avatar } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { staffSetupPasswordSchema, type StaffSetupPasswordData } from '@medsync/shared';

export default function SetupPasswordScreen() {
  const { crm, staffId, name, email } = useLocalSearchParams<{
    crm: string;
    staffId: string;
    name: string;
    email: string;
  }>();
  const { setupPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffSetupPasswordData>({
    resolver: zodResolver(staffSetupPasswordSchema),
    defaultValues: {
      crm: crm || '',
      email: email || '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: StaffSetupPasswordData) => {
    if (!staffId) {
      Alert.alert('Erro', 'ID do profissional não encontrado');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await setupPassword({
        staffId,
        crm: data.crm,
        email: data.email,
        password: data.password,
      });

      if (error) {
        Alert.alert('Erro', error.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível configurar sua senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Configurar Acesso</Text>
            <Text style={styles.subtitle}>
              Encontramos seu cadastro! Configure uma senha para acessar o sistema.
            </Text>
          </View>

          {/* Staff Info Card */}
          {name && (
            <Card variant="outlined" style={styles.infoCard}>
              <View style={styles.infoCardContent}>
                <Avatar name={name} size="lg" />
                <View style={styles.infoCardText}>
                  <Text style={styles.infoCardName}>{name}</Text>
                  <Text style={styles.infoCardCrm}>CRM: {crm}</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email para contato"
                  placeholder="Digite seu email"
                  leftIcon="mail"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Senha"
                  placeholder="Crie uma senha"
                  leftIcon="lock-closed"
                  rightIcon={showPassword ? 'eye-off' : 'eye'}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar senha"
                  placeholder="Digite a senha novamente"
                  leftIcon="lock-closed"
                  rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
              )}
            />

            <Button
              title="Configurar acesso"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    padding: 16,
    alignSelf: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardText: {
    marginLeft: 16,
    flex: 1,
  },
  infoCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoCardCrm: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
});
