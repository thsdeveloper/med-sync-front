import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    icon?: React.ReactNode;
}

export const Textarea: React.FC<TextareaProps> = ({
    icon,
    className = '',
    ...props
}) => {
    const baseStyles = 'block w-full py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none';
    const paddingLeft = icon ? 'pl-10' : 'pl-3';
    const paddingRight = 'pr-3';

    return (
        <div className="relative">
            {icon && (
                <div className="absolute top-3 left-3">
                    {icon}
                </div>
            )}
            <textarea
                className={`${baseStyles} ${paddingLeft} ${paddingRight} ${className}`}
                {...props}
            />
        </div>
    );
};

