'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select } from '@/components/atoms/Select';

import { medicalStaffSchema, MedicalStaffFormData, ROLES, MedicalStaff } from '@/schemas/medical-staff.schema';

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
            }
        }
    }, [isOpen, staffToEdit, form]);

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

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEditing ? 'Editar Profissional' : 'Novo Profissional'}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? 'Edite os dados do profissional abaixo.'
                            : 'Preencha os dados para cadastrar um novo membro da equipe.'}
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-6" />

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

                        <div className="grid grid-cols-2 gap-4">
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
                                    <FormItem>
                                        <FormLabel>Cor na Escala</FormLabel>
                                        <div className="flex gap-2 items-center">
                                            <FormControl>
                                                <Input type="color" className="w-12 h-10 p-1 cursor-pointer" {...field} />
                                            </FormControl>
                                            <span className="text-sm text-muted-foreground">{field.value}</span>
                                        </div>
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
            </SheetContent>
        </Sheet>
    );
}

