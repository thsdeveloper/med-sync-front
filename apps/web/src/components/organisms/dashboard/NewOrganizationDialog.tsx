'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/atoms/Button';
import { useOrganization } from '@/providers/OrganizationProvider';

const newOrganizationSchema = z.object({
    name: z
        .string()
        .min(1, 'Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome muito longo'),
    cnpj: z
        .string()
        .min(1, 'CNPJ é obrigatório')
        .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
    address: z
        .string()
        .max(500, 'Endereço muito longo')
        .optional()
        .or(z.literal('')),
    phone: z
        .string()
        .max(20, 'Telefone muito longo')
        .optional()
        .or(z.literal('')),
});

type NewOrganizationFormData = z.infer<typeof newOrganizationSchema>;

interface NewOrganizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6)
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export function NewOrganizationDialog({ open, onOpenChange }: NewOrganizationDialogProps) {
    const { createOrganization } = useOrganization();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<NewOrganizationFormData>({
        resolver: zodResolver(newOrganizationSchema),
        defaultValues: {
            name: '',
            cnpj: '',
            address: '',
            phone: '',
        },
    });

    const onSubmit = async (data: NewOrganizationFormData) => {
        setIsSubmitting(true);
        try {
            await createOrganization({
                name: data.name.trim(),
                cnpj: data.cnpj.replace(/\D/g, ''),
                address: data.address?.trim() || undefined,
                phone: data.phone?.replace(/\D/g, '') || undefined,
            });
            toast.success('Organização criada com sucesso!', {
                description: 'A nova organização foi selecionada automaticamente.',
            });
            form.reset();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Erro ao criar organização:', error);
            toast.error('Erro ao criar organização', {
                description: error.message || 'Tente novamente mais tarde.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            contentClassName="sm:max-w-[500px]"
            title={
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                        <Building2 className="size-5" />
                    </div>
                    <span>Nova Organização</span>
                </div>
            }
            description="Cadastre uma nova empresa para gerenciar escalas e equipes."
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da empresa</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Ex.: Hospital São Lucas"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CNPJ</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="00.000.000/0001-00"
                                        {...field}
                                        onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                                    />
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
                                <FormLabel>Telefone (opcional)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="(11) 99999-9999"
                                        {...field}
                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Endereço (opcional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Rua, número, bairro, cidade - UF"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Organização
                        </Button>
                    </div>
                </form>
            </Form>
        </BaseSheet>
    );
}
