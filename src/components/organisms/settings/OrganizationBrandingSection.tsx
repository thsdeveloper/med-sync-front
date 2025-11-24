'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2, Globe } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ColorPicker } from '@/components/molecules/ColorPicker';

const organizationBrandingSchema = z.object({
    legalName: z.string().min(1, 'Informe a razão social'),
    tradeName: z.string().min(1, 'Informe o nome fantasia'),
    cnpj: z.string().min(14, 'CNPJ inválido'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(8, 'Informe um telefone válido'),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    address: z.string().min(8, 'Informe o endereço completo'),
    timezone: z.string().min(1, 'Selecione um fuso horário'),
    primaryColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Cor inválida'),
});

type OrganizationBrandingFormData = z.infer<typeof organizationBrandingSchema>;

const TIMEZONE_OPTIONS = [
    { label: 'UTC-03:00 (Brasília)', value: 'America/Sao_Paulo' },
    { label: 'UTC-04:00 (Manaus)', value: 'America/Manaus' },
    { label: 'UTC-05:00 (Acre)', value: 'America/Rio_Branco' },
    { label: 'UTC-01:00 (Cabo Verde)', value: 'Atlantic/Cape_Verde' },
];

export function OrganizationBrandingSection() {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const form = useForm<OrganizationBrandingFormData>({
        resolver: zodResolver(organizationBrandingSchema),
        defaultValues: {
            legalName: 'Medsync LTDA',
            tradeName: 'Medsync Saúde Integrada',
            cnpj: '12.345.678/0001-99',
            email: 'contato@medsync.com.br',
            phone: '(11) 4002-8922',
            website: 'https://medsync.com.br',
            address: 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
            timezone: 'America/Sao_Paulo',
            primaryColor: '#2563eb',
        },
    });

    const tradeName = form.watch('tradeName');
    const primaryColor = form.watch('primaryColor');
    const email = form.watch('email');
    const website = form.watch('website');

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setLogoPreview(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: OrganizationBrandingFormData) => {
        console.info('Organization & Branding payload', data);
        await new Promise((resolve) => setTimeout(resolve, 800));
        toast.success('Identidade da organização atualizada.');
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <Building2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <CardTitle>Organização & Branding</CardTitle>
                    <CardDescription>
                        Configure dados institucionais, identidade visual e canais oficiais que
                        aparecerão nas comunicações.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="legalName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Razão social</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex.: Medsync Serviços Médicos LTDA" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tradeName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome fantasia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex.: Medsync Saúde" {...field} />
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
                                            <Input placeholder="00.000.000/0001-00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email oficial</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="contato@empresa.com.br" {...field} />
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
                                            <Input placeholder="(11) 99999-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://suaempresa.com.br" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço completo</FormLabel>
                                    <FormControl>
                                        <Textarea rows={3} placeholder="Rua, número, bairro, cidade e estado" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="timezone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fuso horário</FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={TIMEZONE_OPTIONS}
                                                    placeholder="Selecione o fuso"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="primaryColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cor primária</FormLabel>
                                            <FormControl>
                                                <ColorPicker value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="rounded-xl border bg-slate-50 p-4">
                                <p className="text-sm font-medium text-muted-foreground mb-3">Pré-visualização</p>
                                <div
                                    className="rounded-lg p-4 text-white shadow-inner"
                                    style={{ background: primaryColor || '#1d4ed8' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
                                            {logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="h-12 w-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                (tradeName ?? 'Medsync')
                                                    .split(' ')
                                                    .map((word) => word[0])
                                                    .slice(0, 2)
                                                    .join('')
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm uppercase tracking-wide text-white/60">Identidade</p>
                                            <p className="text-lg font-semibold">{tradeName || 'Sua marca'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 rounded-md bg-white/10 p-3 text-sm">
                                        <p className="font-medium">Email responderá com:</p>
                                        <p className="text-white/80">{email}</p>
                                        <div className="mt-2 flex items-center gap-2 text-white/70">
                                            <Globe className="h-4 w-4" />
                                            <span>{website}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border p-4">
                            <p className="text-sm font-medium mb-3">Logotipo</p>
                            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:border-blue-400">
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                <span className="text-sm text-muted-foreground">
                                    Arraste ou clique para enviar o logo (PNG, SVG, JPG)
                                </span>
                                {logoPreview && (
                                    <img src={logoPreview} alt="Logo preview" className="mt-2 h-16 object-contain" />
                                )}
                            </label>
                        </div>

                        <CardFooter className="px-0">
                            <Button type="submit" className="ml-auto" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar identidade'}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}


