'use client';

import React, { useState } from 'react';

const faqs = [
    {
        q: 'Quanto tempo leva para implementar o MedSync?',
        a: 'A implementação completa leva em média 48 horas. Nossa equipe cuida da migração de dados, treinamento da equipe e configuração inicial. Você não precisa parar a operação.',
    },
    {
        q: 'Preciso instalar algum software nos computadores?',
        a: 'Não. O MedSync é 100% web — funciona em qualquer navegador. Para os médicos, temos apps nativos para iOS e Android.',
    },
    {
        q: 'Integra com o sistema que já usamos (Tasy, MV, Protheus)?',
        a: 'Sim. Temos integração nativa com Tasy, SoulMV, Protheus e outros ERPs hospitalares. A sincronização de folha de pagamento é automática.',
    },
    {
        q: 'E se os médicos não quiserem usar?',
        a: 'O app foi desenhado com foco em simplicidade. A taxa de adoção é de 94% nas primeiras 2 semanas. Check-in facial leva 3 segundos e trocas são feitas com 1 clique.',
    },
    {
        q: 'Qual o tamanho mínimo de instituição?',
        a: 'Atendemos clínicas e hospitais a partir de 10 médicos. O sistema escala até grandes complexos hospitalares com milhares de profissionais.',
    },
    {
        q: 'Tem contrato de fidelidade?',
        a: 'Não. Nossos planos são mensais, sem multa de cancelamento. Acreditamos que você fica porque o produto entrega valor, não por contrato.',
    },
];

export const FAQ: React.FC = () => {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6 max-w-3xl">
                <div className="text-center mb-16 fade-in-section">
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Perguntas frequentes
                    </h2>
                    <p className="text-lg text-slate-600">
                        Tudo que você precisa saber antes de dar o próximo passo.
                    </p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="border border-slate-200 rounded-xl overflow-hidden fade-in-section"
                        >
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                            >
                                <span className="font-semibold text-slate-900">{faq.q}</span>
                                <svg
                                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {open === i && (
                                <div className="px-6 pb-5 text-slate-600 leading-relaxed animate-fade-in">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
