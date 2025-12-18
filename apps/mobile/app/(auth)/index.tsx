import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, CpfInput } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { cpfLookupSchema, type CpfLookupData } from '@medsync/shared';

export default function CpfLookupScreen() {
  const { lookupCpf } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CpfLookupData>({
    resolver: zodResolver(cpfLookupSchema),
    defaultValues: {
      cpf: '',
    },
  });

  const cpfValue = watch('cpf');

  const onSubmit = async (data: CpfLookupData) => {
    setIsLoading(true);
    try {
      const result = await lookupCpf(data.cpf);

      if (result.found && result.hasAuth) {
        // CPF exists and has auth setup - go to login
        router.push({
          pathname: '/(auth)/login',
          params: {
            cpf: data.cpf,
          },
        });
      } else if (result.found && !result.hasAuth) {
        // CPF exists but no auth - go to setup password
        router.push({
          pathname: '/(auth)/setup-password',
          params: {
            cpf: data.cpf,
            staffId: result.staff?.id,
            name: result.staff?.name,
            email: result.staff?.email || '',
          },
        });
      } else {
        // CPF not found - go to register
        router.push({
          pathname: '/(auth)/register',
          params: {
            cpf: data.cpf,
          },
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar o CPF. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if CPF has 11 digits (normalized)
  const cpfNormalized = cpfValue?.replace(/\D/g, '') || '';
  const isValidLength = cpfNormalized.length === 11;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo and Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>MedSync</Text>
            </View>
            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={styles.subtitle}>
              Insira seu CPF para acessar suas escalas de plantão
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* CPF Input */}
            <Controller
              control={control}
              name="cpf"
              render={({ field: { onChange, onBlur, value } }) => (
                <CpfInput
                  label="CPF"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors.cpf?.message}
                  required
                />
              )}
            />

            <Button
              title="Continuar"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!isValidLength}
              style={styles.button}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Acesso exclusivo para profissionais de saúde
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
