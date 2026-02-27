import React from 'react';

const testimonials = [
    {
        name: 'Dr. Arthur Giorgi',
        role: 'Diretor Clínico',
        institution: 'Hospital Santa Cruz',
        quote: 'Mais autonomia aos médicos no gerenciamento dos seus plantões e versatilidade aos coordenadores. O controle financeiro é preciso e eliminamos completamente os erros de pagamento.',
        metric: 'Eliminou 100% dos erros de pagamento',
    },
    {
        name: 'Dra. Juliana Mendes',
        role: 'Coordenadora UTI',
        institution: 'CardioLife',
        quote: 'Está muito prático, faz muito tempo que não preciso manejar a escala manualmente. A equipe resolve as trocas e eu só aprovo. Ganhei minhas tardes de volta.',
        metric: 'Economiza 35h/mês em gestão de escalas',
    },
    {
        name: 'Dr. Ricardo Silva',
        role: 'Anestesista',
        institution: 'Hospital Central',
        quote: 'O aplicativo é excelente. Consigo ver meus ganhos em tempo real e fazer o check-in facial em segundos. Recomendo muito para qualquer colega.',
        metric: 'Check-in em menos de 3 segundos',
    },
];

export const TestimonialsLanding: React.FC = () => {
    return (
        <section id="depoimentos" className="py-20 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 fade-in-section">
                    <span className="text-blue-600 font-bold tracking-wider uppercase text-sm block mb-2">
                        Prova social
                    </span>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Quem usa, recomenda
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm fade-in-section flex flex-col"
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            {/* Metric badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-semibold mb-4 self-start">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                {t.metric}
                            </div>

                            {/* Quote */}
                            <div className="text-blue-500 mb-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.054 15.358 14.509 16.892 14.032C16.321 14.633 15.532 15 14.653 15C12.75 15 11.206 13.468 11.206 11.579C11.206 9.689 12.75 8.157 14.653 8.157C16.555 8.157 18.1 9.689 18.1 11.579C18.1 14.887 16.271 21 14.017 21ZM5 21L5 18C5 16.054 6.342 14.509 7.875 14.032C7.305 14.633 6.516 15 5.637 15C3.733 15 2.19 13.468 2.19 11.579C2.19 9.689 3.733 8.157 5.637 8.157C7.539 8.157 9.083 9.689 9.083 11.579C9.083 14.887 7.254 21 5 21Z" /></svg>
                            </div>
                            <p className="text-slate-700 italic mb-6 flex-1 leading-relaxed">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center font-bold text-white text-sm">
                                    {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-900 text-sm">{t.name}</h5>
                                    <p className="text-xs text-slate-500">{t.role} • {t.institution}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Logo bar */}
                <div className="mt-16 text-center fade-in-section">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
                        +500 instituições confiam no MedSync
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale">
                        {['Santa Cruz', 'CardioLife', 'Hospital Central', 'MedFast', 'Saúde Total'].map((name, i) => (
                            <div key={i} className="flex items-center gap-2 text-lg font-bold text-slate-700">
                                <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs">{name[0]}</span>
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
