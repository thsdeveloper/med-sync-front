import React from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay?: string;
    iconBgColor?: string;
    iconColor?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    delay = '',
    iconBgColor = 'bg-cyan-50',
    iconColor = 'text-cyan-600'
}) => {
    return (
        <div className={`bg-white p-8 rounded-2xl border border-teal-100 hover:shadow-lg hover:border-cyan-200 transition-all duration-300 group fade-in-section ${delay}`}>
            <div className={`w-14 h-14 ${iconBgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <div className={`w-7 h-7 ${iconColor}`}>
                    {icon}
                </div>
            </div>
            <h3 className="font-heading text-xl font-bold text-teal-900 mb-3">{title}</h3>
            <p className="text-teal-700 leading-relaxed">{description}</p>
        </div>
    );
};
