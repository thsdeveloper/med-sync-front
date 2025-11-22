import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
    isValid?: boolean;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    hasError = false,
    isValid = false,
    icon,
    rightIcon,
    className = '',
    ...props
}) => {
    const baseStyles = 'block w-full py-3 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all';
    
    const stateStyles = hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : isValid
        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500';

    const paddingLeft = icon ? 'pl-10' : 'pl-3';
    const paddingRight = rightIcon ? 'pr-10' : 'pr-3';

    return (
        <div className="relative">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {icon}
                </div>
            )}
            <input
                className={`${baseStyles} ${stateStyles} ${paddingLeft} ${paddingRight} ${className}`}
                {...props}
            />
            {rightIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {rightIcon}
                </div>
            )}
        </div>
    );
};

