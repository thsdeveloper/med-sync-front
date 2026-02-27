import React from 'react';

const solutions = [
    {
        pain: 'Montagem manual de escalas',
        solution: 'Automação inteligente',
        description: 'O algoritmo monta a escala ideal em minutos, respeitando regras de carga horária, especialidades e preferências. Reduza 80% do tempo administrativo.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        color: 'text-blue-600',
        bg: 'bg-blue-50',
    },
    {
        pain: 'Furos e absenteísmo',
        solution: 'Check-in facial + Geolocalização',
        description: 'Biometria facial e GPS garantem presença real. Trocas são feitas pelo app com validação automática — zero furos.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        color: 'text-teal-600',
        bg: 'bg-teal-50',
    },
    {
        pain: 'Descontrole financeiro',
        solution: 'Controle financeiro em tempo real',
        description: 'Pagamentos calculados automaticamente. Relatórios prontos para Tasy, MV e Protheus. Previsão de gastos por setor.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        color: 'text-green-600',
        bg: 'bg-green-50',
    },
];

export const SolutionSection: React.FC = () => {
    return (
        <section className="py-20 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 fade-in-section">
                    <span className="text-blue-600 font-bold tracking-wider uppercase text-sm block mb-2">
                        A solução
                    </span>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Como o MedSync resolve cada problema
                    </h2>
                </div>

                <div className="space-y-8 max-w-4xl mx-auto">
                    {solutions.map((s, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start gap-6 fade-in-section hover:shadow-md transition-shadow"
                        >
                            <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center flex-shrink-0 ${s.color}`}>
                                {s.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-semibold text-red-400 line-through">{s.pain}</span>
                                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                    <span className={`text-xs font-semibold ${s.color}`}>{s.solution}</span>
                                </div>
                                <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">{s.solution}</h3>
                                <p className="text-slate-600 leading-relaxed">{s.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
