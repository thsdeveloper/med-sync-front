'use client';

import React, { useState } from 'react';
import { SectionTitle } from '../atoms/SectionTitle';

export const AIDemo: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiOutput, setAiOutput] = useState<string | null>(null);

    const runDemo = () => {
        setIsGenerating(true);
        setAiOutput(null);

        setTimeout(() => {
            const finalText = `
        <p class="mb-2"><strong>SITUATION (Situação):</strong> Paciente João Silva, 45 anos, admitido com dor torácica intensa e supradesnivelamento do segmento ST no ECG.</p>
        <p class="mb-2"><strong>BACKGROUND (Histórico):</strong> Sem histórico prévio relatado nas notas rápidas. Sinais vitais atuais estáveis: PA 130/80 mmHg.</p>
        <p class="mb-2"><strong>ASSESSMENT (Avaliação):</strong> Quadro compatível com Síndrome Coronariana Aguda (IAMCSST). Estabilizado após administração de antiagregantes (AAS + Clopidogrel) e analgesia. Dor remiu.</p>
        <p class="mb-2"><strong>RECOMMENDATION (Recomendação):</strong> Manter monitorização contínua. <strong>Prioridade:</strong> Cateterismo cardíaco (CATE) agendado para amanhã cedo. Vigiar recorrência de dor.</p>
      `;

            setAiOutput(finalText);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <section id="ai-demo" className="py-20 bg-slate-900 text-white overflow-hidden">
            <div className="container mx-auto px-6">
                <SectionTitle
                    title="Empodere seu corpo clínico"
                    subtitle="O MedSync oferece aos seus médicos a tecnologia Gemini para passar plantões em segundos. Menos burocracia, mais tempo para o paciente."
                    light={true}
                />

                <div className="flex flex-col lg:flex-row gap-8 items-stretch max-w-5xl mx-auto">
                    {/* Input Side */}
                    <div className="flex-1 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl fade-in-section">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">notas_rapidas.txt</span>
                        </div>
                        <textarea
                            id="raw-input"
                            className="w-full h-64 bg-slate-900/50 text-slate-300 p-4 rounded-lg border border-slate-700 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none font-mono text-sm resize-none"
                            readOnly
                            defaultValue={`Paciente João Silva, 45 anos.
Chegou com dor no peito forte.
ECG deu supra de ST.
Trocamos medicação pra AAS e Clopidogrel.
Agora tá estável, sem dor.
Precisa ver o cateterismo amanhã cedo.
Sinais vitais ok, PA 130/80.`}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={runDemo}
                                disabled={isGenerating}
                                className={`flex items-center gap-2 bg-teal-400 hover:bg-teal-500 text-slate-900 px-6 py-2 rounded-lg font-bold transition-colors ${isGenerating ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        {aiOutput ? 'Gerar Novamente' : 'Gerar Relatório'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center text-slate-600 fade-in-section delay-100">
                        <svg className="w-8 h-8 lg:w-12 lg:h-12 transform rotate-90 lg:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </div>

                    {/* Output Side */}
                    <div className="flex-1 bg-white text-slate-800 rounded-2xl p-6 border border-slate-200 shadow-2xl relative overflow-hidden fade-in-section delay-200">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-teal-400"></div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-bold text-blue-600 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                Relatório Oficial (SBAR)
                            </span>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Gerado por IA</span>
                        </div>
                        <div className="prose prose-sm max-w-none h-64 overflow-y-auto pr-2 font-sans text-sm leading-relaxed">
                            {aiOutput ? (
                                <div
                                    className="animate-pulse-once"
                                    dangerouslySetInnerHTML={{ __html: aiOutput }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 italic">
                                    {isGenerating ? 'Analisando dados...' : 'Aguardando geração...'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
