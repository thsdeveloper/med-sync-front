import React from 'react';

const TestimonialCard: React.FC<{
    name: string;
    role: string;
    image?: string;
    quote: string;
}> = ({ name, role, quote }) => (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
        <div className="text-blue-500 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.054 15.358 14.509 16.892 14.032C16.321 14.633 15.532 15 14.653 15C12.75 15 11.206 13.468 11.206 11.579C11.206 9.689 12.75 8.157 14.653 8.157C16.555 8.157 18.1 9.689 18.1 11.579C18.1 14.887 16.271 21 14.017 21ZM5 21L5 18C5 16.054 6.342 14.509 7.875 14.032C7.305 14.633 6.516 15 5.637 15C3.733 15 2.19 13.468 2.19 11.579C2.19 9.689 3.733 8.157 5.637 8.157C7.539 8.157 9.083 9.689 9.083 11.579C9.083 14.887 7.254 21 5 21Z" /></svg>
        </div>
        <p className="text-slate-700 italic mb-6">"{quote}"</p>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-500 text-sm">
                {name.charAt(0)}
            </div>
            <div>
                <h5 className="font-bold text-slate-900 text-sm">{name}</h5>
                <p className="text-xs text-slate-500 uppercase font-semibold">{role}</p>
            </div>
        </div>
    </div>
);

export const SocialProof: React.FC = () => {
    return (
        <section id="testimonials" className="py-16 border-t border-slate-200 bg-white">
            <div className="container mx-auto px-6 text-center">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Confiado por equipes inovadoras</p>
                <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 mb-20">
                    {/* Fake Logos using Text/SVG */}
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                        <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        Santa Cruz
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                        <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        CardioLife
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                        <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Hospital Central
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                        <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        MedFast
                    </div>
                </div>

                <div className="text-left mb-12">
                    <h3 className="text-2xl font-bold text-slate-900 text-center mb-10">O que os profissionais dizem</h3>
                    <div className="grid md:grid-cols-3 gap-6">
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
            </div>
        </section>
    );
};
