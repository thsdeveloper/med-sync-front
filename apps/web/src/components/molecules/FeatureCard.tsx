import React from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay?: string; // Tailwind class like 'delay-100'
    iconBgColor?: string;
    iconColor?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    delay = '',
    iconBgColor = 'bg-blue-50',
    iconColor = 'text-blue-600'
}) => {
    return (
        <div className={`bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-300 group fade-in-section ${delay}`}>
            <div className={`w-14 h-14 ${iconBgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <div className={`w-7 h-7 ${iconColor}`}>
                    {icon}
                </div>
            </div>
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
    );
};
