import React from 'react';

const metrics = [
    {
        value: '80%',
        label: 'Redução no tempo de montagem de escalas',
        icon: '⏱️',
    },
    {
        value: '95%',
        label: 'Redução em furos de escala',
        icon: '✅',
    },
    {
        value: '40h',
        label: 'Economizadas por mês pela coordenação',
        icon: '📊',
    },
    {
        value: 'R$ 0',
        label: 'Erros de pagamento com automação financeira',
        icon: '💰',
    },
];

export const ROISection: React.FC = () => {
    return (
        <section className="py-20 bg-gradient-to-br from-slate-900 to-blue-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-400 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16 fade-in-section">
                    <span className="text-teal-400 font-bold tracking-wider uppercase text-sm block mb-2">
                        Resultados reais
                    </span>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                        O retorno que você pode esperar
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-slate-300">
                        Números baseados na média dos nossos clientes nos primeiros 90 dias.
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {metrics.map((m, i) => (
                        <div
                            key={i}
                            className="text-center fade-in-section"
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            <div className="text-4xl mb-3">{m.icon}</div>
                            <div className="font-heading text-4xl lg:text-5xl font-bold text-white mb-2">
                                {m.value}
                            </div>
                            <p className="text-sm text-slate-300">{m.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center fade-in-section">
                    <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-5">
                        <span className="text-3xl">🏥</span>
                        <div className="text-left">
                            <p className="font-bold text-lg">Hospital com 100 médicos</p>
                            <p className="text-slate-300 text-sm">Economia estimada: <strong className="text-teal-400">R$ 25.000/mês</strong> em custos operacionais</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
