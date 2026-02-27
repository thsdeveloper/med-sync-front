'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '../../atoms/Logo';

const WHATSAPP_NUMBER = '5561996617935';

export const HeaderLanding: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Quero saber mais sobre o MedSync.')}`;

    return (
        <header
            className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md py-2' : 'py-4'}`}
        >
            <div className="absolute inset-0 glass-effect shadow-sm"></div>
            <div className="container mx-auto px-6 relative">
                <nav className="flex justify-between items-center">
                    <Logo />

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#problema" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">O Problema</a>
                        <a href="#solucao" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Solução</a>
                        <a href="#resultados" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Resultados</a>
                        <a href="#depoimentos" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Depoimentos</a>
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-green-500/30 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            </svg>
                            Falar com Consultor
                        </a>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
                        >
                            WhatsApp
                        </a>
                    </div>
                </nav>
            </div>
        </header>
    );
};
