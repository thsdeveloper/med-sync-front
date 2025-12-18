import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, RegistroProfissionalInput } from '@/components/ui';
import type { RegistroProfissionalValue } from '@/components/ui';
import { EspecialidadePicker, ProfissaoPicker } from '@/components/molecules';
import { updateStaffProfile } from '@/lib/supabase';
import type { MedicalStaff, ProfissaoComConselho } from '@medsync/shared';
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

interface ProfileEditSheetProps {
  visible: boolean;
  onClose: () => void;
  staff: MedicalStaff;
  onSaveSuccess: () => void;
}

export function ProfileEditSheet({
  visible,
  onClose,
  staff,
  onSaveSuccess,
}: ProfileEditSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProfissao, setSelectedProfissao] = useState<ProfissaoComConselho | null>(
    staff.profissao || null
  );

  // Format CPF for display (read-only)
  const formattedCpf = useMemo(() => {
    if (!staff.cpf) return 'Nao informado';
    return formatCpf(staff.cpf);
  }, [staff.cpf]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      profissao_id: staff.profissao_id || '',
      especialidade_id: staff.especialidade_id || '',
      registro: {
        numero: staff.registro_numero || '',
        uf: (staff.registro_uf as typeof VALID_UFS[number]) || 'SP',
        categoria: staff.registro_categoria || undefined,
      },
    },
  });

  // Reset form when modal opens with fresh staff data
  useEffect(() => {
    if (visible) {
      reset({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        profissao_id: staff.profissao_id || '',
        especialidade_id: staff.especialidade_id || '',
        registro: {
          numero: staff.registro_numero || '',
          uf: (staff.registro_uf as typeof VALID_UFS[number]) || 'SP',
          categoria: staff.registro_categoria || undefined,
        },
      });
      setSelectedProfissao(staff.profissao || null);
    }
  }, [visible, staff, reset]);

  const onSubmit = async (data: ProfileEditFormData) => {
    if (isSubmitting) return;

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
            onSaveSuccess();
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Editar Perfil</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Form */}
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
                  <Text style={styles.saveButtonText}>Salvando...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>Salvar Alteracoes</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    flexGrow: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
