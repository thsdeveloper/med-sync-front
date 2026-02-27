import React from 'react';
import { LeadForm } from './LeadForm';

export const CTAFinal: React.FC = () => {
    return (
        <section className="py-20 bg-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>

            <div className="container mx-auto px-6 relative">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    {/* Copy */}
                    <div className="lg:w-1/2 text-center lg:text-left text-white">
                        <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                            Pronto para eliminar o caos das escalas?
                        </h2>
                        <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                            Agende uma demonstração gratuita e descubra quanto tempo e dinheiro sua instituição pode economizar com o MedSync.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-blue-200">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Demo personalizada
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Sem compromisso
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Setup em 48h
                            </span>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="lg:w-1/2 w-full max-w-md mx-auto lg:mx-0">
                        <LeadForm variant="cta" />
                    </div>
                </div>
            </div>
        </section>
    );
};
