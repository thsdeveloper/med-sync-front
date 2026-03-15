import React from 'react';

const TestimonialCard: React.FC<{
    name: string;
    role: string;
    quote: string;
}> = ({ name, role, quote }) => (
    <div className="bg-white p-8 rounded-2xl border border-teal-100 hover:shadow-lg transition-shadow duration-300 relative">
        <div className="text-cyan-400 mb-4" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.054 15.358 14.509 16.892 14.032C16.321 14.633 15.532 15 14.653 15C12.75 15 11.206 13.468 11.206 11.579C11.206 9.689 12.75 8.157 14.653 8.157C16.555 8.157 18.1 9.689 18.1 11.579C18.1 14.887 16.271 21 14.017 21ZM5 21L5 18C5 16.054 6.342 14.509 7.875 14.032C7.305 14.633 6.516 15 5.637 15C3.733 15 2.19 13.468 2.19 11.579C2.19 9.689 3.733 8.157 5.637 8.157C7.539 8.157 9.083 9.689 9.083 11.579C9.083 14.887 7.254 21 5 21Z" /></svg>
        </div>
        <blockquote>
            <p className="text-teal-800 mb-6 leading-relaxed">&ldquo;{quote}&rdquo;</p>
        </blockquote>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center font-bold text-cyan-700 text-sm" aria-hidden="true">
                {name.charAt(0)}
            </div>
            <div>
                <h5 className="font-bold text-teal-900 text-sm">{name}</h5>
                <p className="text-xs text-teal-600 uppercase font-semibold">{role}</p>
            </div>
        </div>
    </div>
);

export const SocialProof: React.FC = () => {
    return (
        <section id="testimonials" className="py-24 bg-white border-t border-teal-100">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 fade-in-section">
                    <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-3">Depoimentos</p>
                    <h3 className="font-heading text-3xl lg:text-4xl font-bold text-teal-900 mb-4">O que os profissionais dizem</h3>
                    <p className="text-teal-700 text-lg max-w-2xl mx-auto">Médicos e gestores que transformaram suas rotinas com o MedSync.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 fade-in-section delay-100">
                    <TestimonialCard
                        name="Dr. Arthur Giorgi"
                        role="Diretor Clínico"
                        quote="Mais autonomia aos médicos no gerenciamento dos seus plantões e versatilidade aos coordenadores. O controle financeiro é preciso."
                    />
                    <TestimonialCard
                        name="Dra. Juliana Mendes"
                        role="Coordenadora UTI"
                        quote="Está muito prático, faz muito tempo que não preciso manejar a escala manualmente. A equipe resolve as trocas e eu só aprovo."
                    />
                    <TestimonialCard
                        name="Dr. Ricardo Silva"
                        role="Anestesista"
                        quote="O aplicativo é excelente. Consigo ver meus ganhos em tempo real e fazer o check-in facial em segundos. Recomendo muito."
                    />
                </div>
            </div>
        </section>
    );
};
