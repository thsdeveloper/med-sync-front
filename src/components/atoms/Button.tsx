import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'white';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    children,
    ...props
}) => {
    const baseStyles = "font-bold rounded-full transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30",
        outline: "bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
        ghost: "bg-transparent text-slate-600 hover:text-blue-600 hover:bg-blue-50/50",
        white: "bg-white text-blue-600 shadow-xl hover:shadow-2xl"
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-2.5 text-base",
        lg: "px-8 py-4 text-lg"
    };

    const width = fullWidth ? "w-full" : "w-auto";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
