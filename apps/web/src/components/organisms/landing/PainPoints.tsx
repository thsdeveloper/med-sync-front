import React from 'react';

const pains = [
    {
        icon: '📋',
        title: 'Montagem manual de escalas',
        description: 'Coordenadores gastam +40h/mês montando escalas em planilhas. Cada alteração vira uma cascata de ligações e mensagens.',
        stat: '40h/mês',
        statLabel: 'desperdiçadas em média',
        color: 'bg-red-50 border-red-100',
    },
    {
        icon: '🚫',
        title: 'Furos de escala e absenteísmo',
        description: 'Médicos que não comparecem, trocas não comunicadas e plantões descobertos comprometem o atendimento e geram custos extras.',
        stat: 'R$ 15mil',
        statLabel: 'custo médio por furo/mês',
        color: 'bg-orange-50 border-orange-100',
    },
    {
        icon: '💸',
        title: 'Descontrole financeiro',
        description: 'Pagamentos incorretos, horas extras não rastreadas e zero visibilidade sobre custos por setor. Dinheiro escorrendo pelo ralo.',
        stat: '23%',
        statLabel: 'de erros em folha de plantão',
        color: 'bg-yellow-50 border-yellow-100',
    },
];

export const PainPoints: React.FC = () => {
    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 fade-in-section">
                    <span className="text-red-500 font-bold tracking-wider uppercase text-sm block mb-2">
                        O problema
                    </span>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Sua gestão hospitalar sofre com isso?
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-slate-600">
                        Se você se identifica com pelo menos um desses cenários, o MedSync foi feito pra você.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {pains.map((pain, i) => (
                        <div
                            key={i}
                            className={`${pain.color} border rounded-2xl p-8 fade-in-section transition-transform hover:-translate-y-1`}
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            <div className="text-4xl mb-4">{pain.icon}</div>
                            <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">
                                {pain.title}
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                {pain.description}
                            </p>
                            <div className="border-t border-slate-200 pt-4">
                                <span className="text-2xl font-bold text-slate-900">{pain.stat}</span>
                                <span className="text-sm text-slate-500 block">{pain.statLabel}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
