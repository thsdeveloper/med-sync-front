import React from 'react';

export const LogoBar: React.FC = () => {
    return (
        <section className="py-12 bg-white border-y border-teal-100" aria-label="Instituições parceiras">
            <div className="container mx-auto px-6 text-center">
                <p className="text-sm font-semibold text-teal-500 uppercase tracking-widest mb-8">
                    Confiado por equipes inovadoras
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <div className="flex items-center gap-2 text-xl font-bold text-teal-800">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        Santa Cruz
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-teal-800">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        CardioLife
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-teal-800">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Hospital Central
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-teal-800">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        MedFast
                    </div>
                </div>
            </div>
        </section>
    );
};
