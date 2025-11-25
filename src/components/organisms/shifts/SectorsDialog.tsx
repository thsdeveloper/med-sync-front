'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2 } from 'lucide-react';

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
import { Button } from '@/components/ui/button';

import { sectorSchema, SectorFormData, Sector } from '@/schemas/shifts.schema';
import { ColorPicker } from '@/components/molecules/ColorPicker';

interface SectorsDialogProps {
    organizationId: string;
    sectors: Sector[];
    onUpdate: () => void;
}

export function SectorsDialog({
    organizationId,
    sectors,
    onUpdate
}: SectorsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<SectorFormData>({
        resolver: zodResolver(sectorSchema),
        defaultValues: {
            name: '',
            color: '#64748b',
        },
    });

    const onSubmit = async (data: SectorFormData) => {
        try {
            const { error } = await supabase
                .from('sectors')
                .insert({
                    organization_id: organizationId,
                    name: data.name,
                    color: data.color,
                });

            if (error) throw error;

            toast.success('Setor criado com sucesso!');
            form.reset();
            onUpdate();
        } catch (error: any) {
            console.error('Error creating sector:', error);
            toast.error('Erro ao criar setor.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso removerá o setor e desvinculará os plantões.')) return;

        try {
            const { error } = await supabase
                .from('sectors')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Setor removido.');
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao remover setor.');
        }
    };

    return (
        <BaseSheet
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={<Button variant="outline">Gerenciar Setores</Button>}
            title="Setores / Departamentos"
            description="Adicione os locais onde os plantões ocorrem (ex: UTI, Triagem)."
            contentClassName="sm:max-w-[425px]"
        >
            <div className="space-y-6 py-4">
                {/* Listagem de Setores Existentes */}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {sectors.map((sector) => (
                        <div key={sector.id} className="flex items-center justify-between p-2 border rounded-md bg-slate-50">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sector.color }} />
                                <span className="font-medium text-sm">{sector.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(sector.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {sectors.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">Nenhum setor cadastrado.</p>
                    )}
                </div>

                <div className="border-t pt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Novo Setor (ex: UTI)" {...field} />
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
                                        <FormLabel>Cor do setor</FormLabel>
                                        <FormControl>
                                            <ColorPicker value={field.value} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Adicionar setor
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </BaseSheet>
    );
}

