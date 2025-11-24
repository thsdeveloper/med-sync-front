'use client';

import { FormEvent, useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

interface ReportEmailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (payload: { to: string; subject: string; message: string }) => Promise<void>;
    isSubmitting?: boolean;
}

export function ReportEmailSheet({ open, onOpenChange, onSubmit, isSubmitting }: ReportEmailSheetProps) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('Relatório assistencial');
    const [message, setMessage] = useState(
        'Olá,\n\nSegue em anexo o relatório consolidado de assistências do período selecionado.\n\nAtenciosamente,\nEquipe MedSync',
    );

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onSubmit({ to, subject, message });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-primary/10 p-2 text-primary">
                            <Mail className="h-5 w-5" />
                        </span>
                        <div className="text-left">
                            <SheetTitle>Enviar relatório por e-mail</SheetTitle>
                            <SheetDescription>Compartilhe o PDF com gestores e parceiros.</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Destinatário</label>
                        <Input
                            type="email"
                            placeholder="ex: diretoria@hospital.com"
                            required
                            value={to}
                            onChange={(event) => setTo(event.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Assunto</label>
                        <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Mensagem</label>
                        <Textarea rows={6} value={message} onChange={(event) => setMessage(event.target.value)} />
                    </div>
                    <SheetFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando...' : 'Enviar relatório'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}



