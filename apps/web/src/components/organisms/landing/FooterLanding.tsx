import React from 'react';
import { Logo } from '../../atoms/Logo';

export const FooterLanding: React.FC = () => {
    return (
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-white">
                        <Logo />
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm">
                        <a href="/politicas-de-privacidade" className="hover:text-teal-400 transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-teal-400 transition-colors">Termos de Uso</a>
                        <a href="#" className="hover:text-teal-400 transition-colors">Contato</a>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <p>&copy; {new Date().getFullYear()} MedSync — Um produto <a href="https://ello4.com.br" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">Ello4 Solutions</a></p>
                    <p className="text-slate-500">Simplificando a vida de quem salva vidas.</p>
                </div>
            </div>
        </footer>
    );
};
