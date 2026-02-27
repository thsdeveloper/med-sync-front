'use client';

import React, { useState } from 'react';

const WHATSAPP_NUMBER = '5561996617935';

interface LeadFormProps {
    variant?: 'hero' | 'cta';
    className?: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({ variant = 'hero', className = '' }) => {
    const [form, setForm] = useState({
        nome: '',
        cargo: '',
        instituicao: '',
        telefone: '',
        medicos: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const message = encodeURIComponent(
            `Olá! Quero conhecer o MedSync.\n\n` +
            `👤 *Nome:* ${form.nome}\n` +
            `💼 *Cargo:* ${form.cargo}\n` +
            `🏥 *Instituição:* ${form.instituicao}\n` +
            `📱 *Telefone:* ${form.telefone}\n` +
            `👥 *Nº de médicos:* ${form.medicos}`
        );

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const isHero = variant === 'hero';

    const inputBase = isHero
        ? 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400'
        : 'w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm focus:border-white focus:ring-2 focus:ring-white/20 outline-none transition-all placeholder:text-white/60';

    const selectBase = isHero
        ? 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all'
        : 'w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white text-sm focus:border-white focus:ring-2 focus:ring-white/20 outline-none transition-all [&>option]:text-slate-900';

    return (
        <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
            <input
                type="text"
                placeholder="Seu nome completo"
                required
                value={form.nome}
                onChange={update('nome')}
                className={inputBase}
            />
            <input
                type="text"
                placeholder="Cargo (ex: Diretor Clínico, Coordenador)"
                required
                value={form.cargo}
                onChange={update('cargo')}
                className={inputBase}
            />
            <input
                type="text"
                placeholder="Nome da instituição"
                required
                value={form.instituicao}
                onChange={update('instituicao')}
                className={inputBase}
            />
            <input
                type="tel"
                placeholder="Telefone com DDD"
                required
                value={form.telefone}
                onChange={update('telefone')}
                className={inputBase}
            />
            <select
                required
                value={form.medicos}
                onChange={update('medicos')}
                className={selectBase}
            >
                <option value="">Quantos médicos na instituição?</option>
                <option value="10-30">10 a 30 médicos</option>
                <option value="31-100">31 a 100 médicos</option>
                <option value="101-300">101 a 300 médicos</option>
                <option value="300+">Mais de 300 médicos</option>
            </select>
            <button
                type="submit"
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 ${
                    isHero
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                        : 'bg-white text-blue-600 shadow-xl hover:shadow-2xl'
                }`}
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.305 0-4.47-.64-6.32-1.748l-.453-.272-2.65.888.888-2.65-.272-.453A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Falar com Especialista no WhatsApp
            </button>
            <p className={`text-xs text-center ${isHero ? 'text-slate-400' : 'text-blue-200'}`}>
                Resposta em até 2 horas • Sem compromisso
            </p>
        </form>
    );
};
