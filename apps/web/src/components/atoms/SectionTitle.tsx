import React from 'react';

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    tag?: string;
    centered?: boolean;
    light?: boolean;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
    title,
    subtitle,
    tag,
    centered = true,
    light = false
}) => {
    return (
        <div className={`mb-16 ${centered ? 'text-center' : 'text-left'} fade-in-section`}>
            {tag && (
                <span className={`text-sm font-bold tracking-widest uppercase block mb-3 ${light ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {tag}
                </span>
            )}
            <h2 className={`font-heading text-3xl md:text-4xl font-bold mb-4 ${light ? 'text-white' : 'text-teal-900'}`}>
                {title}
            </h2>
            {subtitle && (
                <p className={`max-w-2xl mx-auto text-lg leading-relaxed ${light ? 'text-teal-200' : 'text-teal-700'}`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};
