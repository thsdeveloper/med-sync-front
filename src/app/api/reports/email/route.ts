import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { z } from 'zod';
import { ReportEmailTemplate } from '@/emails/ReportEmailTemplate';

const payloadSchema = z.object({
    to: z.string().email(),
    subject: z.string().min(3),
    message: z.string().min(5),
    pdfBase64: z.string().optional(),
    periodLabel: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const payload = payloadSchema.parse(json);

        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                { ok: false, message: 'Chave RESEND_API_KEY não configurada.' },
                { status: 500 },
            );
        }

        const html = render(
            ReportEmailTemplate({
                message: payload.message,
                periodLabel: payload.periodLabel,
            }),
        );

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'MedSync Reports <relatorios@medsync.app>',
                to: payload.to,
                subject: payload.subject,
                html,
                attachments: payload.pdfBase64
                    ? [
                          {
                              filename: 'relatorio-medsync.pdf',
                              content: payload.pdfBase64,
                              type: 'application/pdf',
                          },
                      ]
                    : undefined,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Erro envio e-mail', error);
            return NextResponse.json({ ok: false, message: 'Erro ao enviar relatório.' }, { status: 502 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ ok: false, message: 'Falha ao processar envio.' }, { status: 500 });
    }
}



