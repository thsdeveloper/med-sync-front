import React, { useState, useCallback } from 'react';
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
import { Button, RegistroProfissionalInput, type RegistroProfissionalValue } from '@/components/ui';
import { ProfissaoPicker } from '@/components/molecules';
import { useAuth } from '@/providers/auth-provider';
import { useProfissoes, type ProfissaoComConselho } from '@medsync/shared';
import { registroLookupSchema, type RegistroLookupData, CONSELHOS } from '@medsync/shared';

// Form type for this screen (includes profissao_id for UI convenience)
interface LookupFormData {
  profissao_id: string;
  registro: RegistroProfissionalValue;
}

export default function RegistroLookupScreen() {
  const { lookupRegistro } = useAuth();
  const { data: profissoes } = useProfissoes();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfissao, setSelectedProfissao] = useState<ProfissaoComConselho | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LookupFormData>({
    defaultValues: {
      profissao_id: '',
      registro: {
        numero: '',
        uf: '',
        categoria: undefined,
      },
    },
  });

  const registroValue = watch('registro');
  const profissaoId = watch('profissao_id');

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

  const onSubmit = async (data: LookupFormData) => {
    // Validate required fields
    if (!data.registro.numero || !data.registro.uf) {
      Alert.alert('Atenção', 'Preencha o número e UF do registro');
      return;
    }

    if (!selectedProfissao?.conselho?.sigla) {
      Alert.alert('Atenção', 'Selecione sua profissão');
      return;
    }

    // Check categoria if required
    if (selectedProfissao.conselho.requer_categoria && !data.registro.categoria) {
      Alert.alert('Atenção', 'Selecione a categoria do registro');
      return;
    }

    setIsLoading(true);
    try {
      const result = await lookupRegistro(data.registro.numero, data.registro.uf);
      const conselhoSigla = selectedProfissao.conselho.sigla;

      if (result.found && result.hasAuth) {
        // Registro exists and has auth setup - go to login
        router.push({
          pathname: '/(auth)/login',
          params: {
            conselhoSigla,
            numero: data.registro.numero,
            uf: data.registro.uf,
          },
        });
      } else if (result.found && !result.hasAuth) {
        // Registro exists but no auth - go to setup password
        router.push({
          pathname: '/(auth)/setup-password',
          params: {
            conselhoSigla,
            numero: data.registro.numero,
            uf: data.registro.uf,
            staffId: result.staff?.id,
            name: result.staff?.name,
            email: result.staff?.email || '',
          },
        });
      } else {
        // Registro not found - go to register
        router.push({
          pathname: '/(auth)/register',
          params: {
            profissao_id: data.profissao_id,
            conselhoSigla,
            numero: data.registro.numero,
            uf: data.registro.uf,
            categoria: data.registro.categoria || '',
          },
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar o registro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const conselhoSigla = selectedProfissao?.conselho?.sigla || 'Registro';

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
              Insira seu registro profissional para acessar suas escalas de plantão
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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

            <Button
              title="Continuar"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={!profissaoId || !registroValue.numero || !registroValue.uf}
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
