import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FeatureCard } from '../molecules/FeatureCard';

export const Benefits: React.FC = () => {
    return (
        <section id="features" className="py-20 bg-slate-50">
            <div className="container mx-auto px-6">
                <SectionTitle
                    title="Eficiência operacional para sua gestão"
                    subtitle="Uma plataforma completa para modernizar a gestão médica do seu hospital ou clínica."
                />

                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>}
                        title="Automação de Escalas"
                        description="Reduza em 80% o tempo gasto montando escalas. O algoritmo sugere a melhor distribuição baseada em regras."
                        iconBgColor="bg-blue-50"
                        iconColor="text-blue-600"
                    />

                    <FeatureCard
                        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        title="Controle Financeiro"
                        description="Gestão completa de pagamentos, extração de relatórios para Tasy/SoulMV e previsão de gastos em tempo real."
                        delay="delay-100"
                        iconBgColor="bg-green-50"
                        iconColor="text-green-600"
                    />

                    <FeatureCard
                        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        title="Check-in Facial"
                        description="Elimine fraudes e garanta a presença do profissional. Validação por geolocalização e biometria facial."
                        delay="delay-200"
                        iconBgColor="bg-purple-50"
                        iconColor="text-purple-600"
                    />

                    <FeatureCard
                        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
                        title="Gestão de Trocas"
                        description="Os próprios médicos gerenciam suas trocas. O sistema valida regras e atualiza a escala automaticamente."
                        delay="delay-300"
                        iconBgColor="bg-teal-50"
                        iconColor="text-teal-400"
                    />

                    <FeatureCard
                        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
                        title="Portal do Diretor"
                        description="Dashboards executivos com indicadores de absenteísmo, custos por setor e NPS da equipe médica."
                        delay="delay-400"
                        iconBgColor="bg-indigo-50"
                        iconColor="text-indigo-600"
                    />

                    <FeatureCard
                        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>}
                        title="Chat Integrado"
                        description="Centralize a comunicação. Elimine grupos de WhatsApp e tenha histórico auditável de todas as tratativas."
                        delay="delay-500"
                        iconBgColor="bg-orange-50"
                        iconColor="text-orange-600"
                    />
                </div>
            </div>
        </section>
    );
};
