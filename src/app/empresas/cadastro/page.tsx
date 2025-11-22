'use client';

import { useEffect } from 'react';
import { CompanyRegistrationForm } from '@/components/organisms/CompanyRegistrationForm';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';

export default function CompanyRegistrationPage() {
    useEffect(() => {
        // Intersection Observer for Fade In
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in-section').forEach(section => {
            observer.observe(section);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
            <Header />

            {/* Background Blobs - Similar ao Hero */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 right-1/2 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            </div>

            <div className="flex-1 flex flex-col justify-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 pt-32">
                <div className="max-w-2xl mx-auto w-full fade-in-section">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Cadastro de Empresa
                        </div>
                        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
                            Comece sua jornada com o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">MedSync</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-xl mx-auto">
                            Cadastre sua clínica ou hospital e transforme a gestão de escalas médicas com Inteligência Artificial.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 sm:p-8 lg:p-10">
                        <CompanyRegistrationForm />
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 mb-4">Junte-se a mais de 500 instituições de saúde</p>
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">H</div>
                                <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">C</div>
                                <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">S</div>
                            </div>
                            <span className="text-xs ml-2">+500 instituições</span>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
