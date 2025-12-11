import React from 'react';

export const PlatformFeatures: React.FC = () => {
    return (
        <section className="py-24 bg-white border-t border-slate-100">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">
                        Flexibilidade Total
                    </h2>
                    <h3 className="font-heading text-3xl lg:text-5xl font-bold text-slate-900 mb-6">
                        Qualquer plataforma, qualquer dispositivo; <br className="hidden lg:block" />
                        tudo em tempo real.
                    </h3>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Visual / Media Column */}
                    <div className="lg:w-1/2 relative">
                        {/* Abstract Background */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-3xl transform rotate-3 scale-105 opacity-60"></div>

                        <div className="relative bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 p-6 min-h-[400px] flex flex-col justify-between">
                            {/* Window Actions */}
                            <div className="flex gap-2 mb-6">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 h-full">
                                {/* Video/Call Placeholder */}
                                <div className="col-span-2 bg-slate-800 rounded-xl p-4 flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-slate-600">
                                            <span className="text-2xl">👨‍⚕️</span>
                                        </div>
                                        <div className="text-white font-medium">Dr. Silva</div>
                                        <div className="text-xs text-slate-400">Em plantão</div>
                                    </div>
                                </div>

                                {/* Code Snippet */}
                                <div className="col-span-2 bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-2 text-slate-600 text-[10px]">main.tsx</div>
                                    <p><span className="text-purple-400">const</span> <span className="text-blue-400">schedule</span> = <span className="text-purple-400">await</span> api.<span className="text-yellow-400">getShift</span>({'({'})</p>
                                    <p className="pl-4"><span className="text-blue-300">doctorId</span>: <span className="text-green-400">'123-456'</span>,</p>
                                    <p className="pl-4"><span className="text-blue-300">hospital</span>: <span className="text-green-400">'Santa Cruz'</span>,</p>
                                    <p className="pl-4"><span className="text-blue-300">status</span>: <span className="text-green-400">'active'</span></p>
                                    <p>{'}'});</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Column */}
                    <div className="lg:w-1/2 space-y-12">
                        {/* Feature 1 */}
                        <div className="flex gap-5">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">Portal Administrativo</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    Interface desktop robusta para diretores e coordenadores.
                                    Visualize escalas complexas, gere relatórios financeiros e gerencie múltiplos setores em uma única tela.
                                </p>
                                <a href="#" className="inline-flex items-center text-blue-600 font-semibold mt-2 hover:translate-x-1 transition-transform">
                                    Ver demonstração
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </a>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex gap-5">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">App Nativo (iOS & Android)</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    Experiência fluida para o corpo clínico. Trocas de plantão, notificações push em tempo real
                                    e check-in por geolocalização, tudo na palma da mão.
                                </p>
                                <a href="#" className="inline-flex items-center text-blue-600 font-semibold mt-2 hover:translate-x-1 transition-transform">
                                    Explorar os apps
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </a>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex gap-5">
                            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-teal-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">API & Integrações</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    Conecte o MedSync ao seu ecossistema. Integração nativa com Tasy, MV, Protheus e outros ERPs
                                    para sincronização automática de folha de pagamento.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
