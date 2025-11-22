import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: React.ReactNode;
    required?: boolean;
    optional?: boolean;
}

export const Label: React.FC<LabelProps> = ({
    children,
    required = false,
    optional = false,
    className = '',
    ...props
}) => {
    return (
        <label
            className={`block text-sm font-medium text-slate-700 mb-2 ${className}`}
            {...props}
        >
            {children}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );
};

