import React from 'react';

export const CTA: React.FC = () => {
    return (
        <section className="py-20 bg-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600"></div>
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>
            <div className="container mx-auto px-6 relative text-center text-white">
                <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">Modernize a gestão do seu hospital hoje</h2>
                <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Experimente o MedSync e veja como a Inteligência Artificial pode devolver horas preciosas para sua equipe médica.</p>
                <a href="#" className="inline-block bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all transform">
                    Solicitar Proposta
                </a>
                <p className="mt-6 text-sm text-blue-200">Para clínicas a partir de 10 médicos.</p>
            </div>
        </section>
    );
};
