'use client';

import React, { useState } from 'react';

const platforms = [
    {
        id: 'web',
        label: 'Portal Web',
        badge: 'Desktop',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        accentColor: 'cyan',
        title: 'Portal Administrativo',
        description:
            'Interface desktop robusta para diretores e coordenadores. Visualize escalas complexas, gere relatórios financeiros e gerencie múltiplos setores em uma única tela.',
        cta: 'Ver demonstração',
        chips: ['Relatórios em PDF', 'Multi-hospital', 'Dashboard ao vivo'],
        mockup: (
            <div className="bg-teal-950 rounded-2xl border border-teal-700/40 shadow-2xl overflow-hidden">
                {/* Barra de título */}
                <div className="flex items-center gap-2 px-4 py-3 bg-teal-900/80 border-b border-teal-700/40">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-3 flex-1 h-5 rounded bg-teal-800/70 text-[10px] text-teal-400 flex items-center px-2">
                        app.medsync.com.br/dashboard
                    </span>
                </div>
                {/* Sidebar + conteúdo */}
                <div className="flex" style={{ minHeight: 220 }}>
                    <div className="w-10 bg-teal-900/60 border-r border-teal-700/30 flex flex-col items-center gap-3 py-4">
                        {[
                            <path key="a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
                            <path key="b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                            <path key="c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
                        ].map((d, i) => (
                            <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-cyan-500/20 text-cyan-400' : 'text-teal-600 hover:text-teal-400'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {d}
                                </svg>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Plantões Hoje', value: '48', color: 'text-cyan-400' },
                                { label: 'Em Andamento', value: '12', color: 'text-green-400' },
                                { label: 'Pendentes', value: '3', color: 'text-yellow-400' },
                            ].map((s) => (
                                <div key={s.label} className="bg-teal-900/50 rounded-lg p-2 border border-teal-700/30">
                                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                                    <div className="text-[9px] text-teal-500">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-teal-900/40 rounded-lg p-3 border border-teal-700/20 space-y-2">
                            {[
                                { name: 'Dr. Silva', spec: 'Cardiologia', status: 'Em plantão', dot: 'bg-green-400' },
                                { name: 'Dra. Oliveira', spec: 'UTI', status: 'Aguardando', dot: 'bg-yellow-400' },
                                { name: 'Dr. Santos', spec: 'Pronto Atend.', status: 'Concluído', dot: 'bg-teal-400' },
                            ].map((d) => (
                                <div key={d.name} className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-teal-700 border border-teal-600 flex items-center justify-center text-[8px] text-cyan-300 font-bold">
                                            {d.name.split(' ')[1][0]}
                                        </div>
                                        <span className="text-teal-200">{d.name}</span>
                                        <span className="text-teal-500">{d.spec}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${d.dot}`} />
                                        <span className="text-teal-400">{d.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 'mobile',
        label: 'App Mobile',
        badge: 'iOS & Android',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
        accentColor: 'teal',
        title: 'App Nativo',
        description:
            'Experiência fluida para o corpo clínico. Trocas de plantão, notificações push em tempo real e check-in por geolocalização, tudo na palma da mão.',
        cta: 'Explorar os apps',
        chips: ['Notificações push', 'Check-in facial', 'Trocas de plantão'],
        mockup: (
            <div className="flex justify-center items-center py-2">
                <div className="w-44 bg-teal-950 rounded-[2rem] border-4 border-teal-700/60 shadow-2xl overflow-hidden relative" style={{ minHeight: 300 }}>
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-teal-950 rounded-b-xl z-10" />
                    <div className="px-3 pt-7 pb-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[9px] text-teal-400">Bom dia,</div>
                                <div className="text-xs font-bold text-white">Dr. Rodrigo</div>
                            </div>
                            <div className="relative">
                                <div className="w-7 h-7 rounded-full bg-teal-700 border border-teal-500 flex items-center justify-center text-[8px] text-cyan-300 font-bold">R</div>
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-teal-950 flex items-center justify-center text-[6px] text-white font-bold">2</span>
                            </div>
                        </div>
                        {/* Next shift card */}
                        <div className="bg-gradient-to-br from-cyan-600 to-teal-600 rounded-xl p-3 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-white/5 rounded-full -translate-y-4 translate-x-4" />
                            <div className="text-[8px] text-cyan-100 mb-0.5">Próximo plantão</div>
                            <div className="text-xs font-bold text-white">Hospital Santa Cruz</div>
                            <div className="text-[9px] text-cyan-200 mt-1">Hoje · 19h — 07h</div>
                            <div className="mt-2 inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                                <span className="text-[8px] text-white">Em 4h 20min</span>
                            </div>
                        </div>
                        {/* Quick actions */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { label: 'Check-in', color: 'bg-cyan-500/20 text-cyan-400' },
                                { label: 'Troca', color: 'bg-teal-500/20 text-teal-400' },
                                { label: 'Escala', color: 'bg-green-500/20 text-green-400' },
                            ].map((a) => (
                                <div key={a.label} className={`${a.color} rounded-lg p-1.5 text-center text-[8px] font-medium`}>
                                    {a.label}
                                </div>
                            ))}
                        </div>
                        {/* Notification */}
                        <div className="bg-teal-900/60 border border-teal-700/40 rounded-xl p-2 flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-[8px]">🔔</span>
                            </div>
                            <div>
                                <div className="text-[8px] font-semibold text-teal-100">Solicitação de troca</div>
                                <div className="text-[7px] text-teal-400">Dra. Lima · há 5 min</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: 'api',
        label: 'API & SDK',
        badge: 'REST / Webhooks',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
        accentColor: 'green',
        title: 'API & Integrações',
        description:
            'Conecte o MedSync ao seu ecossistema. Integração nativa com Tasy, MV, Protheus e outros ERPs para sincronização automática de folha de pagamento.',
        cta: 'Ver documentação',
        chips: ['Tasy & MV & Protheus', 'Webhooks', 'OAuth 2.0'],
        mockup: (
            <div className="bg-teal-950 rounded-2xl border border-teal-700/40 shadow-2xl overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between px-4 py-2 bg-teal-900/70 border-b border-teal-700/40">
                    <span className="text-teal-400 text-[10px]">medsync-api.ts</span>
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                </div>
                <div className="p-4 space-y-0.5 text-[11px] leading-relaxed" style={{ minHeight: 260 }}>
                    <p><span className="text-teal-500">// Autenticação OAuth 2.0</span></p>
                    <p><span className="text-purple-400">const</span> <span className="text-cyan-300">client</span> = <span className="text-purple-400">new</span> <span className="text-yellow-300">MedSyncSDK</span>({'({\n'}</p>
                    <p className="pl-4"><span className="text-cyan-400">apiKey</span>: <span className="text-green-400">process.env.MEDSYNC_KEY</span>,</p>
                    <p className="pl-4"><span className="text-cyan-400">hospital</span>: <span className="text-green-400">&apos;santa-cruz&apos;</span>,</p>
                    <p>{'});'}</p>
                    <p className="mt-2"><span className="text-teal-500">// Buscar plantão ativo</span></p>
                    <p><span className="text-purple-400">const</span> <span className="text-cyan-300">shift</span> = <span className="text-purple-400">await</span> client</p>
                    <p className="pl-4">.<span className="text-yellow-300">shifts</span>.<span className="text-yellow-300">getActive</span>({'({'}</p>
                    <p className="pl-6"><span className="text-cyan-400">doctorId</span>: <span className="text-green-400">&apos;dr-123&apos;</span>,</p>
                    <p className="pl-6"><span className="text-cyan-400">date</span>: <span className="text-purple-400">new</span> <span className="text-yellow-300">Date</span>(),</p>
                    <p className="pl-4">{'});'}</p>
                    <p className="mt-2"><span className="text-teal-500">// Webhook: evento em tempo real</span></p>
                    <p>client.<span className="text-yellow-300">on</span>(<span className="text-green-400">&apos;shift.updated&apos;</span>, <span className="text-purple-400">(e)</span> =&gt; {'{'}</p>
                    <p className="pl-4">console.<span className="text-yellow-300">log</span>(<span className="text-green-400">&apos;✅&apos;</span>, e.<span className="text-cyan-300">doctor</span>, e.<span className="text-cyan-300">status</span>);</p>
                    <p>{'}'});</p>
                </div>
                <div className="px-4 py-2 bg-teal-900/40 border-t border-teal-700/30 flex items-center gap-3 text-[10px]">
                    {['Tasy', 'MV', 'Protheus', 'SAP'].map((erp) => (
                        <span key={erp} className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            {erp}
                        </span>
                    ))}
                </div>
            </div>
        ),
    },
];

const stats = [
    { value: '3', label: 'Plataformas', suffix: '' },
    { value: '99.9', label: 'Uptime', suffix: '%' },
    { value: '<50', label: 'Latência', suffix: 'ms' },
    { value: '24/7', label: 'Suporte', suffix: '' },
];

export const PlatformFeatures: React.FC = () => {
    const [active, setActive] = useState(0);
    const platform = platforms[active];

    const accentMap: Record<string, { tab: string; chip: string; cta: string; dot: string }> = {
        cyan: {
            tab: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
            chip: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            cta: 'text-cyan-400 hover:text-cyan-300',
            dot: 'bg-cyan-400',
        },
        teal: {
            tab: 'bg-teal-500/15 text-teal-300 border-teal-500/40',
            chip: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
            cta: 'text-teal-400 hover:text-teal-300',
            dot: 'bg-teal-400',
        },
        green: {
            tab: 'bg-green-500/15 text-green-300 border-green-500/40',
            chip: 'bg-green-500/10 text-green-400 border-green-500/20',
            cta: 'text-green-400 hover:text-green-300',
            dot: 'bg-green-400',
        },
    };

    const accent = accentMap[platform.accentColor];

    return (
        <section className="relative py-28 overflow-hidden bg-gradient-to-b from-teal-950 via-teal-900 to-teal-950">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-400/5 rounded-full blur-3xl" />
                {/* Grid sutil */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, #67e8f9 1px, transparent 1px), linear-gradient(to bottom, #67e8f9 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            <div className="relative container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16 max-w-2xl mx-auto fade-in-section">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Flexibilidade Total
                    </span>
                    <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                        Qualquer plataforma,{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
                            qualquer dispositivo
                        </span>
                    </h2>
                    <p className="text-teal-300/80 text-lg">Tudo sincronizado em tempo real.</p>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14 max-w-3xl mx-auto fade-in-section">
                    {stats.map((s) => (
                        <div key={s.label} className="text-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold text-white">
                                {s.value}
                                <span className="text-cyan-400 text-lg">{s.suffix}</span>
                            </div>
                            <div className="text-xs text-teal-400 mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Platform Tabs */}
                <div className="flex justify-center mb-12 fade-in-section">
                    <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-teal-900/60 border border-teal-700/40 backdrop-blur-sm">
                        {platforms.map((p, i) => (
                            <button
                                key={p.id}
                                onClick={() => setActive(i)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${
                                    active === i
                                        ? accentMap[p.accentColor].tab
                                        : 'text-teal-400 border-transparent hover:text-teal-200'
                                }`}
                            >
                                {p.icon}
                                <span className="hidden sm:inline">{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center fade-in-section delay-100">
                    {/* Mockup */}
                    <div className="relative">
                        <div className={`absolute -inset-4 rounded-3xl blur-2xl opacity-20 bg-gradient-to-br from-${platform.accentColor}-400 to-teal-400`} />
                        <div className="relative">{platform.mockup}</div>
                    </div>

                    {/* Info */}
                    <div className="space-y-7">
                        {/* Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${accent.chip}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                            {platform.badge}
                        </span>

                        {/* Title */}
                        <div>
                            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                                {platform.title}
                            </h3>
                            <p className="text-teal-300/80 text-base leading-relaxed">{platform.description}</p>
                        </div>

                        {/* Feature chips */}
                        <div className="flex flex-wrap gap-2">
                            {platform.chips.map((chip) => (
                                <span key={chip} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${accent.chip}`}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {chip}
                                </span>
                            ))}
                        </div>

                        {/* CTA */}
                        <a
                            href="#"
                            className={`inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 group ${accent.cta}`}
                        >
                            {platform.cta}
                            <svg
                                className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </a>

                        {/* Platform dots */}
                        <div className="flex items-center gap-2 pt-2">
                            {platforms.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActive(i)}
                                    className={`rounded-full transition-all duration-300 ${
                                        active === i ? 'w-6 h-2 bg-cyan-400' : 'w-2 h-2 bg-teal-700 hover:bg-teal-500'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
