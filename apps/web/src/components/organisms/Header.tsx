'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '../atoms/Logo';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { UserMenu } from '../molecules/navigation/UserMenu';

export const Header: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, loading, signOut } = useSupabaseAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <a href="#main-content" className="skip-to-content">
                Pular para o conteúdo principal
            </a>
            <header
                className={`fixed w-full top-4 left-0 right-0 z-50 transition-all duration-300 px-4 ${isScrolled ? 'top-2' : 'top-4'}`}
                role="banner"
            >
                <div className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 ${isScrolled ? 'shadow-lg shadow-teal-900/5' : ''}`}>
                    <div className="absolute inset-0 glass-effect rounded-2xl"></div>
                    <div className="relative px-6 py-3">
                        <nav className="flex justify-between items-center" aria-label="Navegação principal">
                            <Logo />

                            {/* Desktop Menu */}
                            <div className="hidden md:flex items-center gap-8">
                                <a href="#features" className="text-sm font-medium text-teal-700 hover:text-cyan-600 transition-colors duration-200">
                                    Funcionalidades
                                </a>
                                <a href="#ai-demo" className="text-sm font-medium text-teal-700 hover:text-cyan-600 transition-colors duration-200">
                                    IA de Plantão
                                </a>
                                <a href="#testimonials" className="text-sm font-medium text-teal-700 hover:text-cyan-600 transition-colors duration-200">
                                    Depoimentos
                                </a>
                                {!user && (
                                    <Link
                                        href="/empresas/cadastro"
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 shadow-md shadow-cyan-600/20 cursor-pointer"
                                    >
                                        Para Empresas
                                    </Link>
                                )}
                                {!loading && user ? (
                                    <UserMenu user={user} onSignOut={signOut} />
                                ) : (
                                    <Link
                                        href="/login"
                                        className="border border-teal-200 text-teal-800 px-5 py-2 rounded-full font-medium transition-colors duration-200 hover:bg-teal-50 cursor-pointer"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <div className="md:hidden flex items-center gap-3">
                                {!loading && user ? (
                                    <UserMenu user={user} onSignOut={signOut} />
                                ) : (
                                    <Link
                                        href="/login"
                                        className="text-sm font-semibold text-cyan-600"
                                    >
                                        Login
                                    </Link>
                                )}
                                <button
                                    className="text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1 cursor-pointer"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    aria-expanded={isMobileMenuOpen}
                                    aria-label="Menu de navegação"
                                >
                                    {isMobileMenuOpen ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                    )}
                                </button>
                            </div>
                        </nav>

                        {/* Mobile Menu */}
                        {isMobileMenuOpen && (
                            <div className="md:hidden mt-4 pb-4 border-t border-teal-100 pt-4 flex flex-col gap-3">
                                <a href="#features" className="text-sm font-medium text-teal-700 hover:text-cyan-600 py-2 transition-colors">Funcionalidades</a>
                                <a href="#ai-demo" className="text-sm font-medium text-teal-700 hover:text-cyan-600 py-2 transition-colors">IA de Plantão</a>
                                <a href="#testimonials" className="text-sm font-medium text-teal-700 hover:text-cyan-600 py-2 transition-colors">Depoimentos</a>
                                {!user && (
                                    <Link
                                        href="/empresas/cadastro"
                                        className="bg-cyan-600 text-white px-6 py-2.5 rounded-full font-medium text-center shadow-md cursor-pointer"
                                    >
                                        Para Empresas
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
};
