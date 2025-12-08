import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, CRMInput } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { crmLookupSchema, type CrmLookupData } from '@medsync/shared';

export default function CrmInputScreen() {
  const { lookupCrm } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CrmLookupData>({
    resolver: zodResolver(crmLookupSchema),
    defaultValues: {
      crm: '',
    },
  });

  const onSubmit = async (data: CrmLookupData) => {
    setIsLoading(true);
    try {
      const result = await lookupCrm(data.crm);

      if (result.found && result.hasAuth) {
        // CRM exists and has auth setup - go to login
        router.push({
          pathname: '/(auth)/login',
          params: { crm: data.crm },
        });
      } else if (result.found && !result.hasAuth) {
        // CRM exists but no auth - go to setup password
        router.push({
          pathname: '/(auth)/setup-password',
          params: {
            crm: data.crm,
            staffId: result.staff?.id,
            name: result.staff?.name,
            email: result.staff?.email || '',
          },
        });
      } else {
        // CRM not found - go to register
        router.push({
          pathname: '/(auth)/register',
          params: { crm: data.crm },
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar o CRM. Tente novamente.');
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
        <View style={styles.content}>
          {/* Logo and Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>MedSync</Text>
            </View>
            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={styles.subtitle}>
              Insira seu CRM para acessar suas escalas de plantão
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="crm"
              render={({ field: { onChange, onBlur, value } }) => (
                <CRMInput
                  label="CRM"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.crm?.message}
                  required
                />
              )}
            />

            <Button
              title="Continuar"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
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
