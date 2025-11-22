import React from 'react';

interface FormSectionProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
    title,
    description,
    icon,
    children,
    className = ''
}) => {
    return (
        <div className={`space-y-5 ${className}`}>
            <div className="border-b border-slate-200 pb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    {icon && <span className="text-blue-600">{icon}</span>}
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-slate-500 mt-1">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
};

