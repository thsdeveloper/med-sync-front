import React from 'react';
import { Button } from '../atoms/Button';

export const MobileApp: React.FC = () => {
    return (
        <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Content */}
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
                            Disponível para iOS e Android
                        </div>
                        <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6">
                            Sua escala na palma da mão
                        </h2>
                        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                            O app mais bem avaliado pelos médicos. Check-in facial, trocas de plantão em tempo real e acesso financeiro completo.
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Check-in Facial e Geolocalização</h3>
                                    <p className="text-slate-400 text-sm">Segurança total no registro de ponto com tecnologia antifraude.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-teal-600/20 flex items-center justify-center flex-shrink-0 text-teal-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Trocas Simplificadas</h3>
                                    <p className="text-slate-400 text-sm">Solicite e aceite trocas de plantão com um clique, sem burocracia.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <a href="#" className="flex items-center gap-3 px-6 py-3 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-colors font-bold">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.525 9H13V5.311C13 2.87 14.591 2 16.321 2c1.73 0 2.217.91 2.217 2.656v3.235c0 .666.386 1.109.987 1.109h.194v-.004c2.251 0 3.326.68 3.326 2.695v9.337C23.045 23.016 21.05 24 18.068 24h-7.79C5.36 24 4.301 22.97 4.301 21.028V9h4.37v11.332h8.854V9zM10.151 9h-1.22v11.332H7.2V9h-.704l-.066-6.19c0-1.879.914-2.81 2.978-2.81h.808v6.19h-.065z" /></svg>
                                <span>App Store</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors font-bold">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.3,12.56L10,18.5V5.5L20.3,11.44C20.69,11.66 20.69,12.34 20.3,12.56M16.81,8.88L14.54,11.15L6.05,2.66L16.81,8.88Z" /></svg>
                                <span>Google Play</span>
                            </a>
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="lg:w-1/2 flex justify-center lg:justify-end">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-[2.5rem] blur-2xl opacity-40 transform translate-x-4 translate-y-4"></div>
                            {/* Simple Phone Outline for now, we can enhance later */}
                            <div className="relative border-gray-900 bg-gray-900 border-[12px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl">
                                <div className="h-[32px] w-[3px] bg-gray-900 absolute -left-[15px] top-[72px] rounded-l-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-900 absolute -left-[15px] top-[124px] rounded-l-lg"></div>
                                <div className="h-[64px] w-[3px] bg-gray-900 absolute -right-[15px] top-[142px] rounded-r-lg"></div>
                                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-50 relative">
                                    {/* App UI Placeholder */}
                                    <div className="absolute inset-0 flex flex-col">
                                        <div className="h-1/2 bg-blue-600 flex items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                            <div className="text-center text-white z-10 p-6">
                                                <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 backdrop-blur-md flex items-center justify-center text-4xl">📸</div>
                                                <h3 className="font-bold text-xl">Check-in Realizado</h3>
                                                <p className="opacity-80 text-sm">Hospital Santa Cruz</p>
                                                <p className="opacity-80 text-xs mt-1">19:02 • Geolocalização Confirmada</p>
                                            </div>
                                        </div>
                                        <div className="h-1/2 bg-slate-50 p-6">
                                            <div className="w-full h-24 bg-white rounded-xl shadow-sm border border-slate-100 mb-4 p-4 flex flex-col justify-between">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Ganhos do Mês</span>
                                                    <span className="text-green-500 text-xs font-bold">+12%</span>
                                                </div>
                                                <div className="text-2xl font-bold text-slate-900">R$ 14.250,00</div>
                                            </div>
                                            <div className="w-full h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center px-4 gap-3">
                                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                <span className="text-sm font-medium text-slate-600">Plantão UTI - Seg</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
