import React from 'react';

export const CTA: React.FC = () => {
    return (
        <section className="py-24 bg-gradient-to-br from-cyan-600 to-teal-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="container mx-auto px-6 relative text-center text-white">
                <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                    Modernize a gestão do seu hospital hoje
                </h2>
                <p className="text-cyan-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                    Experimente o MedSync e veja como a Inteligência Artificial pode devolver horas preciosas para sua equipe médica.
                </p>
                <a
                    href="#"
                    className="inline-block bg-white text-cyan-700 px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 transform cursor-pointer"
                >
                    Solicitar Proposta
                </a>
                <p className="mt-6 text-sm text-cyan-200">Para clínicas a partir de 10 médicos.</p>
            </div>
        </section>
    );
};
