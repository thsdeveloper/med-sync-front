'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, Search, UserPlus, Link as LinkIcon } from 'lucide-react';

import { BaseSheet } from '@/components/molecules/BaseSheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Separator } from '@/components/ui/separator';
import { Select } from '@/components/atoms/Select';
import { ColorPicker } from '@/components/molecules/ColorPicker';
import { EspecialidadeCombobox } from '@/components/molecules/EspecialidadeCombobox';
import { ProfissaoSelect } from '@/components/molecules/ProfissaoSelect';
import { RegistroProfissionalInput, type RegistroProfissionalValue } from '@/components/molecules/RegistroProfissionalInput';
import { CpfInput } from '@/components/molecules/CpfInput';
import { SupabaseFileUploader, type UploadedFileInfo } from '@/components/organisms/upload/SupabaseFileUploader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
    medicalStaffSchema,
    MedicalStaffFormData,
    MedicalStaff,
    MedicalStaffWithOrganization,
    generateAuthEmail,
    normalizeCpf,
} from '@medsync/shared';
import type { ProfissaoComConselho } from '@medsync/shared/schemas';

type StaffContractRecord = {
    id: string;
    contract_path: string;
    mime_type: string;
};

type ExistingStaffMatch = {
    id: string;
    name: string;
    email: string | null;
    cpf: string | null;
    crm: string | null;
    registro_numero: string | null;
    registro_uf: string | null;
    especialidade: {
        id: string;
        nome: string;
    } | null;
    profissao: {
        id: string;
        nome: string;
        conselho?: {
            sigla: string;
        };
    } | null;
};

interface MedicalStaffSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    organizationId: string;
    staffToEdit?: MedicalStaffWithOrganization | null;
}

export function MedicalStaffSheet({
    isOpen,
    onClose,
    onSuccess,
    organizationId,
    staffToEdit
}: MedicalStaffSheetProps) {
    const isEditing = !!staffToEdit;
    const [contractInfo, setContractInfo] = useState<StaffContractRecord | null>(null);
    const [isContractLoading, setIsContractLoading] = useState(false);
    const [isSearchingRegistro, setIsSearchingRegistro] = useState(false);
    const [isSearchingCpf, setIsSearchingCpf] = useState(false);
    const [existingStaffMatch, setExistingStaffMatch] = useState<ExistingStaffMatch | null>(null);
    const [isLinking, setIsLinking] = useState(false);
    const [selectedProfissao, setSelectedProfissao] = useState<ProfissaoComConselho | null>(null);

    const form = useForm<MedicalStaffFormData>({
        resolver: zodResolver(medicalStaffSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            cpf: '',
            crm: '',
            profissao_id: '',
            registro_numero: '',
            registro_uf: '' as any,
            registro_categoria: '',
            especialidade_id: '',
            color: '#3b82f6',
            active: true,
        },
    });

    const registroNumero = form.watch('registro_numero');
    const registroUf = form.watch('registro_uf');
    const cpfValue = form.watch('cpf');

    // Buscar profissional existente por registro profissional (numero + uf)
    const searchStaffByRegistro = useCallback(async (numero: string, uf: string) => {
        if (!numero || numero.length < 3 || !uf || isEditing) return;

        setIsSearchingRegistro(true);
        try {
            const { data, error } = await supabase
                .from('medical_staff')
                .select(`
                    id, name, email, cpf, crm, registro_numero, registro_uf,
                    especialidade:especialidade_id(id, nome),
                    profissao:profissao_id(id, nome, conselho:conselho_id(sigla))
                `)
                .eq('registro_numero', numero)
                .eq('registro_uf', uf)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Erro ao buscar registro:', error);
                setExistingStaffMatch(null);
                return;
            }

            if (data) {
                // Verificar se ja esta vinculado a esta organizacao
                const { data: existingLink } = await supabase
                    .from('staff_organizations')
                    .select('id')
                    .eq('staff_id', data.id)
                    .eq('organization_id', organizationId)
                    .maybeSingle();

                if (existingLink) {
                    // Ja vinculado, nao mostrar
                    setExistingStaffMatch(null);
                } else {
                    // Fix TypeScript type inference issue with nested relationships
                    // Supabase returns especialidade as object | null, but TS infers it as array
                    // Flatten nested relationships from Supabase
                    const rawProfissao = Array.isArray(data.profissao)
                        ? data.profissao[0]
                        : data.profissao;

                    // Also flatten nested conselho within profissao
                    const flattenedProfissao = rawProfissao ? {
                        id: rawProfissao.id,
                        nome: rawProfissao.nome,
                        conselho: Array.isArray(rawProfissao.conselho)
                            ? rawProfissao.conselho[0]
                            : rawProfissao.conselho,
                    } : null;

                    const matchData: ExistingStaffMatch = {
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        cpf: data.cpf,
                        crm: data.crm,
                        registro_numero: data.registro_numero,
                        registro_uf: data.registro_uf,
                        especialidade: Array.isArray(data.especialidade)
                            ? (data.especialidade[0] || null)
                            : (data.especialidade || null),
                        profissao: flattenedProfissao,
                    };
                    setExistingStaffMatch(matchData);
                }
            } else {
                setExistingStaffMatch(null);
            }
        } catch (error) {
            console.error('Erro ao buscar registro:', error);
            setExistingStaffMatch(null);
        } finally {
            setIsSearchingRegistro(false);
        }
    }, [isEditing, organizationId]);

    // Debounce da busca por registro profissional
    useEffect(() => {
        if (isEditing || !registroNumero || registroNumero.length < 3 || !registroUf) {
            setExistingStaffMatch(null);
            return;
        }

        const timeoutId = setTimeout(() => {
            searchStaffByRegistro(registroNumero, registroUf);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [registroNumero, registroUf, searchStaffByRegistro, isEditing]);

    // Buscar profissional existente por CPF
    const searchStaffByCpf = useCallback(async (cpf: string) => {
        const normalized = normalizeCpf(cpf);
        if (!normalized || normalized.length !== 11 || isEditing) return;

        setIsSearchingCpf(true);
        try {
            const { data, error } = await supabase
                .from('medical_staff')
                .select(`
                    id, name, email, cpf, crm, registro_numero, registro_uf,
                    especialidade:especialidade_id(id, nome),
                    profissao:profissao_id(id, nome, conselho:conselho_id(sigla))
                `)
                .eq('cpf', normalized)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Erro ao buscar CPF:', error);
                setExistingStaffMatch(null);
                return;
            }

            if (data) {
                // Verificar se ja esta vinculado a esta organizacao
                const { data: existingLink } = await supabase
                    .from('staff_organizations')
                    .select('id')
                    .eq('staff_id', data.id)
                    .eq('organization_id', organizationId)
                    .maybeSingle();

                if (existingLink) {
                    // Ja vinculado, nao mostrar
                    setExistingStaffMatch(null);
                } else {
                    // Flatten nested relationships from Supabase
                    const rawProfissao = Array.isArray(data.profissao)
                        ? data.profissao[0]
                        : data.profissao;

                    const flattenedProfissao = rawProfissao ? {
                        id: rawProfissao.id,
                        nome: rawProfissao.nome,
                        conselho: Array.isArray(rawProfissao.conselho)
                            ? rawProfissao.conselho[0]
                            : rawProfissao.conselho,
                    } : null;

                    const matchData: ExistingStaffMatch = {
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        cpf: data.cpf,
                        crm: data.crm,
                        registro_numero: data.registro_numero,
                        registro_uf: data.registro_uf,
                        especialidade: Array.isArray(data.especialidade)
                            ? (data.especialidade[0] || null)
                            : (data.especialidade || null),
                        profissao: flattenedProfissao,
                    };
                    setExistingStaffMatch(matchData);
                }
            } else {
                setExistingStaffMatch(null);
            }
        } catch (error) {
            console.error('Erro ao buscar CPF:', error);
            setExistingStaffMatch(null);
        } finally {
            setIsSearchingCpf(false);
        }
    }, [isEditing, organizationId]);

    // Debounce da busca por CPF
    useEffect(() => {
        const normalized = normalizeCpf(cpfValue || '');
        if (isEditing || !normalized || normalized.length !== 11) {
            return;
        }

        const timeoutId = setTimeout(() => {
            searchStaffByCpf(cpfValue || '');
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [cpfValue, searchStaffByCpf, isEditing]);

    useEffect(() => {
        if (isOpen) {
            setExistingStaffMatch(null);
            setSelectedProfissao(staffToEdit?.profissao ?? null);
            if (staffToEdit) {
                form.reset({
                    name: staffToEdit.name,
                    email: staffToEdit.email || '',
                    phone: staffToEdit.phone || '',
                    cpf: staffToEdit.cpf || '',
                    crm: staffToEdit.crm || '',
                    profissao_id: staffToEdit.profissao_id || '',
                    registro_numero: staffToEdit.registro_numero || '',
                    registro_uf: (staffToEdit.registro_uf || '') as any,
                    registro_categoria: staffToEdit.registro_categoria || '',
                    especialidade_id: staffToEdit.especialidade_id || '',
                    color: staffToEdit.color || '#3b82f6',
                    active: staffToEdit.staff_organization?.active ?? staffToEdit.active,
                });
                void fetchStaffContract(staffToEdit.id);
            } else {
                form.reset({
                    name: '',
                    email: '',
                    phone: '',
                    cpf: '',
                    crm: '',
                    profissao_id: '',
                    registro_numero: '',
                    registro_uf: '' as any,
                    registro_categoria: '',
                    especialidade_id: '',
                    color: '#3b82f6',
                    active: true,
                });
                setContractInfo(null);
                setSelectedProfissao(null);
            }
        }
    }, [isOpen, staffToEdit, form]);

    const fetchStaffContract = async (staffId: string) => {
        setIsContractLoading(true);
        const { data, error } = await supabase
            .from('staff_contracts')
            .select('id, contract_path, mime_type')
            .eq('staff_id', staffId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao carregar contrato:', error);
            toast.error('Não foi possível carregar o contrato atual.');
        }
        setContractInfo((data as StaffContractRecord) ?? null);
        setIsContractLoading(false);
    };

    // Vincular profissional existente à organização
    const handleLinkExistingStaff = async () => {
        if (!existingStaffMatch) return;

        setIsLinking(true);
        try {
            const { error } = await supabase
                .from('staff_organizations')
                .insert({
                    staff_id: existingStaffMatch.id,
                    organization_id: organizationId,
                    active: true,
                });

            if (error) throw error;

            toast.success(`${existingStaffMatch.name} vinculado à sua organização!`);
            setExistingStaffMatch(null);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao vincular profissional:', error);
            toast.error(error.message || 'Erro ao vincular profissional');
        } finally {
            setIsLinking(false);
        }
    };

    const onSubmit = async (data: MedicalStaffFormData) => {
        try {
            // Gerar auth_email baseado no registro profissional
            const authEmail = selectedProfissao?.conselho?.sigla
                ? generateAuthEmail(
                    selectedProfissao.conselho.sigla,
                    data.registro_numero,
                    data.registro_uf
                )
                : null;

            // Normalizar CPF para apenas dígitos
            const normalizedCpf = data.cpf ? normalizeCpf(data.cpf) : null;

            if (isEditing && staffToEdit) {
                // 1. Atualizar dados do profissional
                const { error: staffError } = await supabase
                    .from('medical_staff')
                    .update({
                        name: data.name,
                        email: data.email || null,
                        phone: data.phone || null,
                        cpf: normalizedCpf,
                        crm: data.crm || null,
                        profissao_id: data.profissao_id,
                        registro_numero: data.registro_numero,
                        registro_uf: data.registro_uf,
                        registro_categoria: data.registro_categoria || null,
                        auth_email: authEmail,
                        especialidade_id: data.especialidade_id,
                        color: data.color,
                        active: data.active,
                    })
                    .eq('id', staffToEdit.id);

                if (staffError) throw staffError;

                // 2. Atualizar status do vinculo se existir staff_organization
                if (staffToEdit.staff_organization) {
                    const { error: linkError } = await supabase
                        .from('staff_organizations')
                        .update({ active: data.active })
                        .eq('id', staffToEdit.staff_organization.id);

                    if (linkError) {
                        console.error('Erro ao atualizar vinculo:', linkError);
                    }
                }

                toast.success('Profissional atualizado com sucesso!');
            } else {
                // 1. Criar novo profissional (sem organization_id - modelo global)
                const { data: newStaff, error: staffError } = await supabase
                    .from('medical_staff')
                    .insert({
                        name: data.name,
                        email: data.email || null,
                        phone: data.phone || null,
                        cpf: normalizedCpf,
                        crm: data.crm || null,
                        profissao_id: data.profissao_id,
                        registro_numero: data.registro_numero,
                        registro_uf: data.registro_uf,
                        registro_categoria: data.registro_categoria || null,
                        auth_email: authEmail,
                        especialidade_id: data.especialidade_id,
                        color: data.color,
                        active: data.active,
                    })
                    .select('id')
                    .single();

                if (staffError) throw staffError;

                // 2. Criar vinculo com a organizacao
                const { error: linkError } = await supabase
                    .from('staff_organizations')
                    .insert({
                        staff_id: newStaff.id,
                        organization_id: organizationId,
                        active: data.active,
                    });

                if (linkError) throw linkError;

                toast.success('Profissional cadastrado e vinculado com sucesso!');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving medical staff:', error);

            // Tratar erro de registro duplicado
            if (error.message?.includes('medical_staff_registro_unique_idx') ||
                error.message?.includes('duplicate key')) {
                toast.error('Ja existe um profissional com este registro. Use a opcao de vincular.');
            } else {
                toast.error(error.message || 'Erro ao salvar profissional');
            }
        }
    };

    const handleContractUploaded = async ({ path, mimeType }: UploadedFileInfo) => {
        if (!staffToEdit) return;

        try {
            const { data, error } = await supabase
                .from('staff_contracts')
                .upsert(
                    {
                        staff_id: staffToEdit.id,
                        contract_path: path,
                        mime_type: mimeType,
                    },
                    { onConflict: 'staff_id' },
                )
                .select('id, contract_path, mime_type')
                .single();

            if (error) {
                throw error;
            }

            setContractInfo(data as StaffContractRecord);
            toast.success('Contrato atualizado com sucesso.');
        } catch (error: any) {
            console.error('Erro ao salvar contrato:', error);
            toast.error(error.message ?? 'Não foi possível salvar o contrato.');
        }
    };

    const contractSectionDescription = useMemo(() => {
        if (!isEditing) {
            return 'Salve o profissional para habilitar o envio do contrato.';
        }
        return 'Envie o contrato em PDF para manter o histórico do profissional.';
    }, [isEditing]);

    return (
        <BaseSheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            contentClassName="sm:max-w-[540px]"
            title={isEditing ? 'Editar Profissional' : 'Novo Profissional'}
            description={
                isEditing
                    ? 'Edite os dados do profissional abaixo.'
                    : 'Preencha os dados para cadastrar ou vincular um profissional à sua organização.'
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Alerta de profissional encontrado */}
                    {existingStaffMatch && !isEditing && (
                        <Alert className="border-blue-200 bg-blue-50">
                            <UserPlus className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Profissional encontrado!</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                <p className="mb-2">
                                    <strong>{existingStaffMatch.name}</strong>
                                    {existingStaffMatch.profissao?.nome && ` (${existingStaffMatch.profissao.nome})`}
                                    {existingStaffMatch.profissao?.conselho?.sigla && existingStaffMatch.registro_numero && existingStaffMatch.registro_uf && (
                                        <span className="text-xs ml-1">
                                            - {existingStaffMatch.profissao.conselho.sigla} {existingStaffMatch.registro_numero}/{existingStaffMatch.registro_uf}
                                        </span>
                                    )}
                                    {existingStaffMatch.especialidade?.nome && ` - ${existingStaffMatch.especialidade.nome}`}
                                </p>
                                <p className="text-sm mb-3">
                                    Este profissional ja esta cadastrado no sistema. Deseja vincula-lo a sua organizacao?
                                </p>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleLinkExistingStaff}
                                    disabled={isLinking}
                                    className="gap-2"
                                >
                                    {isLinking ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <LinkIcon className="h-4 w-4" />
                                    )}
                                    Vincular a minha organizacao
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* CPF Input - sempre visível para busca */}
                    <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    CPF
                                    {isSearchingCpf && (
                                        <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                    )}
                                </FormLabel>
                                <FormControl>
                                    <CpfInput
                                        value={field.value || ''}
                                        onChange={(value) => {
                                            field.onChange(value);
                                            // Limpar match quando CPF muda
                                            if (existingStaffMatch) {
                                                setExistingStaffMatch(null);
                                            }
                                        }}
                                        onBlur={field.onBlur}
                                        error={form.formState.errors.cpf?.message}
                                    />
                                </FormControl>
                                <FormMessage />
                                {!isEditing && !existingStaffMatch && (
                                    <p className="text-xs text-slate-500">
                                        Digite o CPF para verificar se o profissional ja existe.
                                    </p>
                                )}
                            </FormItem>
                        )}
                    />

                    {/* Campos do formulário - ocultos quando profissional encontrado */}
                    {!existingStaffMatch && (
                        <>
                    {/* Profissao Select */}
                    <FormField
                        control={form.control}
                        name="profissao_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Profissao</FormLabel>
                                <FormControl>
                                    <ProfissaoSelect
                                        value={field.value}
                                        onChange={(value, profissao) => {
                                            field.onChange(value);
                                            setSelectedProfissao(profissao ?? null);
                                            // Clear categoria when profissao changes
                                            form.setValue('registro_categoria', '');
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Registro Profissional Input (numero + UF + categoria) */}
                    <FormField
                        control={form.control}
                        name="registro_numero"
                        render={({ field: numeroField }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    Registro Profissional
                                    {isSearchingRegistro && (
                                        <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                    )}
                                </FormLabel>
                                <FormControl>
                                    <RegistroProfissionalInput
                                        value={{
                                            numero: numeroField.value,
                                            uf: form.watch('registro_uf') || '',
                                            categoria: form.watch('registro_categoria') || '',
                                        }}
                                        onChange={(value) => {
                                            form.setValue('registro_numero', value.numero);
                                            form.setValue('registro_uf', value.uf as any);
                                            form.setValue('registro_categoria', value.categoria || '');
                                        }}
                                        profissao={selectedProfissao}
                                        errors={{
                                            numero: form.formState.errors.registro_numero?.message,
                                            uf: form.formState.errors.registro_uf?.message,
                                            categoria: form.formState.errors.registro_categoria?.message,
                                        }}
                                    />
                                </FormControl>
                                {!isEditing && (
                                    <p className="text-xs text-slate-500">
                                        Digite o numero e UF do registro para verificar se o profissional ja existe.
                                    </p>
                                )}
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Dr. João Silva" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cor na Escala</FormLabel>
                                <FormControl>
                                    <ColorPicker value={field.value} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="especialidade_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Especialidade</FormLabel>
                                <FormControl>
                                    <EspecialidadeCombobox
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="joao@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="(11) 99999-9999" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Ativo nesta organização</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                        Profissionais inativos não aparecem nas escalas desta organização.
                                    </div>
                                </div>
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <Separator />

                    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                        <div className="space-y-1">
                            <p className="text-base font-semibold text-slate-900">
                                Contrato em PDF
                            </p>
                            <p className="text-sm text-slate-500">
                                {contractSectionDescription}
                            </p>
                        </div>

                        {isEditing ? (
                            isContractLoading ? (
                                <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Carregando contrato...
                                </div>
                            ) : (
                                <SupabaseFileUploader
                                    label="Selecione o contrato em PDF"
                                    description="Faça upload do contrato para manter o histórico deste profissional."
                                    helperText="Apenas arquivos PDF com até 5MB."
                                    value={contractInfo?.contract_path ?? null}
                                    mimeTypeHint={contractInfo?.mime_type ?? 'application/pdf'}
                                    previewVariant="document"
                                    accept={['application/pdf']}
                                    maxSizeMb={5}
                                    getFilePath={(file) => {
                                        if (!staffToEdit) {
                                            throw new Error('Profissional não encontrado.');
                                        }
                                        const uniqueId =
                                            typeof crypto !== 'undefined' && crypto.randomUUID
                                                ? crypto.randomUUID()
                                                : `${Date.now()}`;
                                        const extension =
                                            file.name.split('.').pop()?.toLowerCase() === 'pdf'
                                                ? 'pdf'
                                                : 'pdf';
                                        return `contracts/${staffToEdit.id}/${uniqueId}.${extension}`;
                                    }}
                                    onFileUploaded={handleContractUploaded}
                                />
                            )
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                Salve o profissional para habilitar o envio do contrato.
                            </div>
                        )}
                    </div>
                        </>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        {!existingStaffMatch && (
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isEditing ? 'Salvar Alterações' : 'Cadastrar Profissional'}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>
        </BaseSheet>
    );
}
