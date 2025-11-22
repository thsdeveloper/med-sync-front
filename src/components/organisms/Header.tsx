'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '../atoms/Logo';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { UserMenu } from '../molecules/navigation/UserMenu';

export const Header: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, loading, signOut } = useSupabaseAuth();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md py-2' : 'py-4'}`}
            id="navbar"
        >
            <div className="absolute inset-0 glass-effect shadow-sm"></div>
            <div className="container mx-auto px-6 relative">
                <nav className="flex justify-between items-center">
                    <Logo />

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Funcionalidades</a>
                        <a href="#ai-demo" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">IA de Plantão</a>
                        <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Depoimentos</a>
                        <Link href="/empresas/cadastro" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30">
                            Para Empresas
                        </Link>
                        {!loading && user ? (
                            <UserMenu user={user} onSignOut={signOut} />
                        ) : (
                            <Link
                                href="/login"
                                className="border border-slate-200 text-slate-700 px-5 py-2 rounded-full font-medium transition hover:bg-slate-100"
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
                                className="text-sm font-semibold text-blue-600"
                            >
                                Login
                            </Link>
                        )}
                        <button className="text-slate-600 focus:outline-none">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
};
