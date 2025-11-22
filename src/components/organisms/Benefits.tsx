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
                        description="Reduza em 80% o tempo gasto montando escalas complexas. O algoritmo sugere a melhor distribuição baseada em regras e disponibilidade."
                        iconBgColor="bg-blue-50"
                        iconColor="text-blue-600"
                    />

                    <FeatureCard
                        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
                        title="Redução de Absenteísmo"
                        description="Minimize faltas e furos. O sistema gerencia trocas automaticamente e garante que todo plantão esteja coberto, reduzindo riscos jurídicos."
                        delay="delay-100"
                        iconBgColor="bg-teal-50"
                        iconColor="text-teal-400"
                    />

                    <FeatureCard
                        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        title="Retenção de Talentos"
                        description="Ofereça previsibilidade e facilidade para seus médicos. Uma equipe satisfeita com a organização produz mais e permanece mais tempo na instituição."
                        delay="delay-200"
                        iconBgColor="bg-indigo-50"
                        iconColor="text-indigo-600"
                    />
                </div>
            </div>
        </section>
    );
};
