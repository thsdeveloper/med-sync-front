import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, RegistroProfissionalInput } from '@/components/ui';
import type { RegistroProfissionalValue } from '@/components/ui';
import { EspecialidadePicker, ProfissaoPicker } from '@/components/molecules';
import { updateStaffProfile } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { ProfissaoComConselho } from '@medsync/shared';
import { VALID_UFS, formatCpf } from '@medsync/shared';

// Form validation schema
const profileEditSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome e obrigatorio')
    .min(3, 'Nome deve ter no minimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .email('Email invalido')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .optional()
    .or(z.literal('')),
  profissao_id: z
    .string()
    .uuid('Selecione uma profissao valida')
    .min(1, 'Profissao e obrigatoria'),
  especialidade_id: z
    .string()
    .uuid('Selecione uma especialidade valida')
    .min(1, 'Especialidade e obrigatoria'),
  registro: z.object({
    numero: z
      .string()
      .min(1, 'Numero do registro e obrigatorio')
      .regex(/^\d+$/, 'Numero do registro deve conter apenas digitos'),
    uf: z.enum(VALID_UFS, { message: 'Selecione uma UF valida' }),
    categoria: z.string().optional(),
  }),
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;

export default function ProfileEditScreen() {
  const { staff, refreshStaff, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProfissao, setSelectedProfissao] = useState<ProfissaoComConselho | null>(
    staff?.profissao || null
  );

  // Format CPF for display (read-only)
  const formattedCpf = useMemo(() => {
    if (!staff?.cpf) return 'Nao informado';
    return formatCpf(staff.cpf);
  }, [staff?.cpf]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: staff?.name || '',
      email: staff?.email || '',
      phone: staff?.phone || '',
      profissao_id: staff?.profissao_id || '',
      especialidade_id: staff?.especialidade_id || '',
      registro: {
        numero: staff?.registro_numero || '',
        uf: (staff?.registro_uf as typeof VALID_UFS[number]) || 'SP',
        categoria: staff?.registro_categoria || undefined,
      },
    },
  });

  const onSubmit = async (data: ProfileEditFormData) => {
    if (isSubmitting || !staff) return;

    setIsSubmitting(true);
    try {
      const { error } = await updateStaffProfile(staff.id, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        profissao_id: data.profissao_id,
        especialidade_id: data.especialidade_id,
        registro_numero: data.registro.numero,
        registro_uf: data.registro.uf,
        registro_categoria: data.registro.categoria || null,
      });

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert(
          'Erro',
          'Nao foi possivel atualizar o perfil. Tente novamente.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            refreshStaff();
            router.back();
          },
        },
      ]);
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfissaoChange = (value: string, profissao?: ProfissaoComConselho) => {
    setValue('profissao_id', value, { shouldValidate: true });
    setSelectedProfissao(profissao || null);
  };

  // Loading state
  if (isAuthLoading || !staff) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nome"
                placeholder="Seu nome completo"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon="person"
                autoCapitalize="words"
              />
            )}
          />

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="seu@email.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />

          {/* Phone */}
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                leftIcon="call"
                keyboardType="phone-pad"
              />
            )}
          />

          {/* Profissao Picker */}
          <Controller
            control={control}
            name="profissao_id"
            render={({ field: { value, onBlur } }) => (
              <ProfissaoPicker
                label="Profissao"
                value={value}
                onValueChange={handleProfissaoChange}
                onBlur={onBlur}
                error={errors.profissao_id?.message}
              />
            )}
          />

          {/* Especialidade Picker */}
          <Controller
            control={control}
            name="especialidade_id"
            render={({ field: { onChange, onBlur, value } }) => (
              <EspecialidadePicker
                label="Especialidade"
                value={value}
                onValueChange={onChange}
                onBlur={onBlur}
                error={errors.especialidade_id?.message}
              />
            )}
          />

          {/* Registro Profissional */}
          <Controller
            control={control}
            name="registro"
            render={({ field: { onChange, onBlur, value } }) => (
              <RegistroProfissionalInput
                label=""
                value={value as RegistroProfissionalValue}
                onChange={onChange}
                onBlur={onBlur}
                profissao={selectedProfissao}
                errors={{
                  numero: errors.registro?.numero?.message,
                  uf: errors.registro?.uf?.message,
                  categoria: errors.registro?.categoria?.message,
                }}
              />
            )}
          />

          {/* CPF (Read-only) */}
          <Input
            label="CPF"
            value={formattedCpf}
            editable={false}
            leftIcon="card"
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alteracoes</Text>
            )}
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
