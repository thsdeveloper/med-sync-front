import React from 'react';

export const PhoneMockup: React.FC = () => {
    return (
        <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl animate-float">
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white relative">
                {/* App Header */}
                <div className="bg-blue-600 p-6 pb-12 rounded-b-[2rem]">
                    <div className="flex justify-between items-center text-white mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        <span className="font-heading font-bold">MedSync</span>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        </div>
                    </div>
                    <div className="text-white">
                        <p className="text-sm opacity-80">Olá, Dr. Thiago</p>
                        <h3 className="text-xl font-bold">Seu próximo plantão</h3>
                        <div className="mt-2 flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-lg w-fit">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            Hoje, 19:00 - 07:00
                        </div>
                    </div>
                </div>

                {/* App Content */}
                <div className="px-4 -mt-6 relative z-10">
                    {/* Card 1 */}
                    <div className="bg-white p-4 rounded-xl shadow-lg mb-4 border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800">Passagem de Plantão</h4>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">Pendente</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">UTI Geral - Leito 04</p>
                        <div className="flex -space-x-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-slate-200 border border-white"></div>
                            <div className="w-6 h-6 rounded-full bg-slate-300 border border-white"></div>
                        </div>
                        <button className="w-full py-2 bg-slate-900 text-white text-xs rounded-lg font-medium">Iniciar Relatório IA</button>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 opacity-60">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800">Troca Solicitada</h4>
                            <span className="text-xs text-slate-500">10 min atrás</span>
                        </div>
                        <p className="text-xs text-slate-500">Dra. Ana solicitou troca para 24/11</p>
                    </div>
                </div>

                {/* Floating Action Button */}
                <div className="absolute bottom-6 right-6 w-12 h-12 bg-teal-400 rounded-full shadow-lg flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
            </div>
        </div>
    );
};
