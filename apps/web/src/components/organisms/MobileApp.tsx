import React from 'react';

export const MobileApp: React.FC = () => {
    return (
        <section className="py-24 bg-gradient-to-b from-teal-900 to-teal-950 text-white overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Content */}
                    <div className="lg:w-1/2 fade-in-section">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-6">
                            Disponível para iOS e Android
                        </div>
                        <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-6">
                            Sua escala na palma da mão
                        </h2>
                        <p className="text-lg text-teal-200 mb-8 leading-relaxed">
                            O app mais bem avaliado pelos médicos. Check-in facial, trocas de plantão em tempo real e acesso financeiro completo.
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Check-in Facial e Geolocalização</h3>
                                    <p className="text-teal-300 text-sm">Segurança total no registro de ponto com tecnologia antifraude.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-teal-600/20 flex items-center justify-center flex-shrink-0 text-teal-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Trocas Simplificadas</h3>
                                    <p className="text-teal-300 text-sm">Solicite e aceite trocas de plantão com um clique, sem burocracia.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <a href="#" className="flex items-center gap-3 px-6 py-3 bg-white text-teal-900 rounded-xl hover:bg-teal-50 transition-colors duration-200 font-bold cursor-pointer">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.99 2.97 12.5 4.7 9.42C5.57 7.87 7.13 6.88 8.82 6.86C10.1 6.84 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" /></svg>
                                <span>App Store</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors duration-200 font-bold cursor-pointer">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.3,12.56L10,18.5V5.5L20.3,11.44C20.69,11.66 20.69,12.34 20.3,12.56M16.81,8.88L14.54,11.15L6.05,2.66L16.81,8.88Z" /></svg>
                                <span>Google Play</span>
                            </a>
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="lg:w-1/2 flex justify-center lg:justify-end fade-in-section delay-200">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-teal-400 rounded-[2.5rem] blur-2xl opacity-30 transform translate-x-4 translate-y-4"></div>
                            <div className="relative border-teal-950 bg-teal-950 border-[12px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl">
                                <div className="h-[32px] w-[3px] bg-teal-950 absolute -left-[15px] top-[72px] rounded-l-lg"></div>
                                <div className="h-[46px] w-[3px] bg-teal-950 absolute -left-[15px] top-[124px] rounded-l-lg"></div>
                                <div className="h-[64px] w-[3px] bg-teal-950 absolute -right-[15px] top-[142px] rounded-r-lg"></div>
                                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-teal-50 relative">
                                    <div className="absolute inset-0 flex flex-col">
                                        <div className="h-1/2 bg-cyan-600 flex items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                            <div className="text-center text-white z-10 p-6">
                                                <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 backdrop-blur-md flex items-center justify-center">
                                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="font-bold text-xl">Check-in Realizado</h3>
                                                <p className="opacity-80 text-sm">Hospital Santa Cruz</p>
                                                <p className="opacity-80 text-xs mt-1">19:02 - Geolocalização Confirmada</p>
                                            </div>
                                        </div>
                                        <div className="h-1/2 bg-teal-50 p-6">
                                            <div className="w-full h-24 bg-white rounded-xl shadow-sm border border-teal-100 mb-4 p-4 flex flex-col justify-between">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-teal-600 uppercase">Ganhos do Mês</span>
                                                    <span className="text-green-500 text-xs font-bold">+12%</span>
                                                </div>
                                                <div className="text-2xl font-bold text-teal-900">R$ 14.250,00</div>
                                            </div>
                                            <div className="w-full h-12 bg-white rounded-xl shadow-sm border border-teal-100 flex items-center px-4 gap-3">
                                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                <span className="text-sm font-medium text-teal-700">Plantão UTI - Seg</span>
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
