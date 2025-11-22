import React from 'react';

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    centered?: boolean;
    light?: boolean;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
    title,
    subtitle,
    centered = true,
    light = false
}) => {
    return (
        <div className={`mb-16 ${centered ? 'text-center' : 'text-left'} fade-in-section`}>
            {light && <span className="text-teal-400 font-bold tracking-wider uppercase text-sm block mb-2">Tecnologia Gemini</span>}
            <h2 className={`font-heading text-3xl md:text-4xl font-bold mb-4 ${light ? 'text-white' : 'text-slate-900'}`}>
                {title}
            </h2>
            {subtitle && (
                <p className={`max-w-2xl mx-auto text-lg ${light ? 'text-slate-400' : 'text-slate-600'}`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};
