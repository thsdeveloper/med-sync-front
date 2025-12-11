import React from 'react';
import { Button } from '../atoms/Button';
import { PhoneMockup } from '../molecules/PhoneMockup';

export const Hero: React.FC = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="container mx-auto px-6 relative">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Text Content */}
                    <div className="lg:w-1/2 text-center lg:text-left fade-in-section">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Novo: Smart Handover AI
                        </div>
                        <h1 className="font-heading text-4xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                            Líder em Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">Escalas Médicas</span> Inteligentes.
                        </h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            Junte-se a instituições que modernizaram a gestão de mais de 30.000 profissionais. Elimine furos, reduza custos e automatize o pagamento de plantões.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-xl shadow-blue-500/20 px-8 py-4 text-lg">
                                Começar Teste Grátis
                            </Button>
                            <a href="#ai-demo" className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:border-blue-600/50 text-slate-700 hover:text-blue-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-5.626-2.32l-2.824 2.824a1 1 0 01-1.414-1.414l2.824-2.824A8.013 8.013 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path></svg>
                                Falar com Consultor
                            </a>
                        </div>
                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold">H</div>
                                <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-bold">C</div>
                                <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-xs font-bold">S</div>
                            </div>
                            <p>Junte-se a +500 instituições de saúde</p>
                        </div>
                    </div>

                    {/* Hero Image / Phone Mockup */}
                    <div className="lg:w-1/2 relative fade-in-section delay-200">
                        {/* Decorative Elements */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-teal-400 rounded-full opacity-20 blur-3xl animate-pulse-slow"></div>
                        <PhoneMockup />
                    </div>
                </div>
            </div>
        </section>
    );
};
