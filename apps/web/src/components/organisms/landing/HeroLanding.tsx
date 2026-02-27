import React from 'react';
import { LeadForm } from './LeadForm';

export const HeroLanding: React.FC = () => {
    return (
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="container mx-auto px-6 relative">
                <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
                    {/* Left — Copy */}
                    <div className="lg:w-7/12 text-center lg:text-left fade-in-section">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Sua escala ainda é feita em planilha?
                        </div>

                        <h1 className="font-heading text-4xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                            Elimine <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">furos de escala</span> e economize até{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">40 horas/mês</span> na gestão
                        </h1>

                        <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            O MedSync automatiza escalas médicas, controla pagamentos e elimina fraudes de ponto com check-in facial.
                            Usado por <strong>+500 instituições</strong> que gerenciam <strong>+30.000 profissionais</strong>.
                        </p>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-8">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Setup em 48h
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Sem fidelidade
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Suporte dedicado
                            </div>
                        </div>

                        {/* Social Proof Mini */}
                        <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">SC</div>
                                <div className="w-10 h-10 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">CL</div>
                                <div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">HC</div>
                                <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-slate-600 text-xs font-bold">+497</div>
                            </div>
                            <p>Instituições já utilizam o MedSync</p>
                        </div>
                    </div>

                    {/* Right — Form */}
                    <div className="lg:w-5/12 w-full fade-in-section delay-200">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
                            <div className="text-center mb-6">
                                <h2 className="font-heading text-xl font-bold text-slate-900 mb-1">
                                    Agende uma demonstração gratuita
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Veja como o MedSync funciona na prática
                                </p>
                            </div>
                            <LeadForm variant="hero" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
