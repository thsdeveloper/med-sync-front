'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

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
import { SupabaseFileUploader, type UploadedFileInfo } from '@/components/organisms/upload/SupabaseFileUploader';

import { medicalStaffSchema, MedicalStaffFormData, ROLES, MedicalStaff } from '@/schemas/medical-staff.schema';

type StaffContractRecord = {
    id: string;
    contract_path: string;
    mime_type: string;
};

interface MedicalStaffSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    organizationId: string;
    staffToEdit?: MedicalStaff | null;
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

    const form = useForm<MedicalStaffFormData>({
        resolver: zodResolver(medicalStaffSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            crm: '',
            specialty: '',
            role: 'Médico',
            color: '#3b82f6',
            active: true,
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (staffToEdit) {
                form.reset({
                    name: staffToEdit.name,
                    email: staffToEdit.email || '',
                    phone: staffToEdit.phone || '',
                    crm: staffToEdit.crm || '',
                    specialty: staffToEdit.specialty || '',
                    role: staffToEdit.role as any,
                    color: staffToEdit.color || '#3b82f6',
                    active: staffToEdit.active,
                });
                void fetchStaffContract(staffToEdit.id);
            } else {
                form.reset({
                    name: '',
                    email: '',
                    phone: '',
                    crm: '',
                    specialty: '',
                    role: 'Médico',
                    color: '#3b82f6',
                    active: true,
                });
                setContractInfo(null);
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

    const onSubmit = async (data: MedicalStaffFormData) => {
        try {
            if (isEditing && staffToEdit) {
                const { error } = await supabase
                    .from('medical_staff')
                    .update({
                        name: data.name,
                        email: data.email || null,
                        phone: data.phone || null,
                        crm: data.crm || null,
                        specialty: data.specialty || null,
                        role: data.role,
                        color: data.color,
                        active: data.active,
                    })
                    .eq('id', staffToEdit.id);

                if (error) throw error;
                toast.success('Profissional atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('medical_staff')
                    .insert({
                        organization_id: organizationId,
                        name: data.name,
                        email: data.email || null,
                        phone: data.phone || null,
                        crm: data.crm || null,
                        specialty: data.specialty || null,
                        role: data.role,
                        color: data.color,
                        active: data.active,
                    });

                if (error) throw error;
                toast.success('Profissional cadastrado com sucesso!');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving medical staff:', error);
            toast.error(error.message || 'Erro ao salvar profissional');
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
                    : 'Preencha os dados para cadastrar um novo membro da equipe.'
            }
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Função</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Selecione a função"
                                        options={ROLES.map((role) => ({
                                            value: role,
                                            label: role,
                                        }))}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Cor na Escala</FormLabel>
                                    <FormControl>
                                        <ColorPicker value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="crm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Registro (CRM/COREN)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="12345/SP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="specialty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Especialidade</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Cardiologia" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

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

                    <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Ativo</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                        Profissionais inativos não aparecem nas escalas.
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

                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar Profissional'}
                        </Button>
                    </div>
                </form>
            </Form>
        </BaseSheet>
    );
}

