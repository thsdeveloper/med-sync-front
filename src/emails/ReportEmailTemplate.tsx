import { CSSProperties } from 'react';
import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';

interface ReportEmailTemplateProps {
    message: string;
    periodLabel?: string;
}

const containerStyle: CSSProperties = {
    margin: '0 auto',
    padding: '32px',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    borderRadius: '22px',
    border: '1px solid #e4e4e7',
};

const paragraphStyle: CSSProperties = {
    fontSize: '14px',
    lineHeight: '24px',
    color: '#0f172a',
};

export function ReportEmailTemplate({ message, periodLabel = 'Período selecionado' }: ReportEmailTemplateProps) {
    return (
        <Html>
            <Head />
            <Preview>Relatório assistencial - {periodLabel}</Preview>
            <Body style={{ backgroundColor: '#f4f4f5', padding: '24px' }}>
                <Container style={containerStyle}>
                    <Section style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <Text style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#020617' }}>
                            Relatório assistencial
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#475569', margin: '4px 0 0' }}>{periodLabel}</Text>
                    </Section>
                    <Hr style={{ borderColor: '#f4f4f5', margin: '28px 0' }} />
                    <Section>
                        {message.split('\n').map((line, index) => (
                            <Text key={`${line}-${index}`} style={paragraphStyle}>
                                {line || '\u00A0'}
                            </Text>
                        ))}
                    </Section>
                    <Section style={{ marginTop: '32px' }}>
                        <Text style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Esta mensagem foi enviada via MedSync Reports. Caso não reconheça este envio, contate o suporte.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}


