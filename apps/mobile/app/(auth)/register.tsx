import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, RegistroProfissionalInput, type RegistroProfissionalValue } from '@/components/ui';
import { ProfissaoPicker, EspecialidadePicker } from '@/components/molecules';
import { useAuth } from '@/providers/auth-provider';
import {
  staffRegisterWithCpfSchema,
  type StaffRegisterWithCpfData,
  useProfissoes,
  formatCpf,
  type ProfissaoComConselho,
} from '@medsync/shared';

// Extended form type including registro as object
interface RegisterFormData extends Omit<StaffRegisterWithCpfData, 'registro_numero' | 'registro_uf' | 'registro_categoria'> {
  registro: RegistroProfissionalValue;
}

export default function RegisterScreen() {
  const { cpf } = useLocalSearchParams<{ cpf: string }>();
  const { signUpWithCpf } = useAuth();
  const { data: profissoes } = useProfissoes();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedProfissao, setSelectedProfissao] = useState<ProfissaoComConselho | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      cpf: cpf || '',
      name: '',
      email: '',
      phone: '',
      profissao_id: '',
      registro: {
        numero: '',
        uf: '',
        categoria: undefined,
      },
      especialidade_id: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registroValue = watch('registro');

  const handleProfissaoChange = useCallback((id: string) => {
    setValue('profissao_id', id);
    // Find the selected profissao to get conselho info
    const profissao = profissoes?.find(p => p.id === id);
    setSelectedProfissao(profissao || null);
    // Reset categoria when profissao changes
    setValue('registro', {
      ...registroValue,
      categoria: undefined,
    });
  }, [profissoes, setValue, registroValue]);

  const onSubmit = async (data: RegisterFormData) => {
    // Validate required fields
    if (!data.profissao_id) {
      Alert.alert('Atenção', 'Selecione sua profissão');
      return;
    }

    if (!data.registro.numero || !data.registro.uf) {
      Alert.alert('Atenção', 'Preencha o número e UF do registro profissional');
      return;
    }

    // Check categoria if required
    if (selectedProfissao?.conselho?.requer_categoria && !data.registro.categoria) {
      Alert.alert('Atenção', 'Selecione a categoria do registro');
      return;
    }

    if (data.password !== data.confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUpWithCpf({
        cpf: data.cpf,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        profissao_id: data.profissao_id,
        registro_numero: data.registro.numero,
        registro_uf: data.registro.uf,
        registro_categoria: data.registro.categoria || undefined,
        especialidade_id: data.especialidade_id,
        password: data.password,
      });

      if (error) {
        Alert.alert('Erro', error.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar sua conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format CPF display
  const cpfDisplay = formatCpf(cpf || '');
  const conselhoSigla = selectedProfissao?.conselho?.sigla || 'Registro';

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
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Preencha seus dados para criar seu acesso
            </Text>
          </View>

          {/* CPF Info Card */}
          <View style={styles.cpfCard}>
            <View style={styles.cpfCardHeader}>
              <Ionicons name="card-outline" size={20} color="#0066CC" />
              <Text style={styles.cpfLabel}>CPF</Text>
            </View>
            <Text style={styles.cpfText}>{cpfDisplay}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nome completo"
                  placeholder="Digite seu nome"
                  leftIcon="person"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
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
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Telefone (opcional)"
                  placeholder="(00) 00000-0000"
                  leftIcon="call"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                />
              )}
            />

            {/* Professional Registration Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Registro Profissional</Text>
            </View>

            {/* Profissão Picker */}
            <Controller
              control={control}
              name="profissao_id"
              render={({ field: { value } }) => (
                <ProfissaoPicker
                  label="Profissão"
                  placeholder="Selecione sua profissão"
                  value={value}
                  onValueChange={handleProfissaoChange}
                  error={errors.profissao_id?.message}
                />
              )}
            />

            {/* Registro Profissional Input */}
            <Controller
              control={control}
              name="registro"
              render={({ field: { onChange, onBlur, value } }) => (
                <RegistroProfissionalInput
                  label={`Número do ${conselhoSigla}`}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  profissao={selectedProfissao}
                  required
                  errors={{
                    numero: errors.registro?.numero?.message,
                    uf: errors.registro?.uf?.message,
                    categoria: errors.registro?.categoria?.message,
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="especialidade_id"
              render={({ field: { onChange, onBlur, value } }) => (
                <EspecialidadePicker
                  label="Especialidade"
                  placeholder="Selecione sua especialidade"
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  error={errors.especialidade_id?.message}
                />
              )}
            />

            {/* Password Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Senha de Acesso</Text>
            </View>

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
              title="Criar conta"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.button}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Ao criar uma conta, você concorda com nossos{' '}
              <Text style={styles.footerLink}>Termos de Uso</Text>
            </Text>
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
  cpfCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  cpfCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cpfLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cpfText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  form: {
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    color: '#0066CC',
    fontWeight: '500',
  },
});
