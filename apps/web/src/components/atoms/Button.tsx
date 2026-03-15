import React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white' | 'destructive' | 'link' | 'cta';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
    asChild?: boolean;
    children: React.ReactNode;
}

const baseStyles =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold rounded-full transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-300';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/25',
    secondary: 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100',
    outline: 'bg-transparent border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50',
    ghost: 'bg-transparent text-teal-700 hover:text-cyan-600 hover:bg-cyan-50/50',
    white: 'bg-white text-cyan-600 shadow-xl hover:shadow-2xl',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30',
    link: 'bg-transparent text-cyan-600 underline-offset-4 hover:underline px-0 py-0 font-medium',
    cta: 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
    icon: 'size-10 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            className = '',
            asChild = false,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : 'button';

        return (
            <Comp
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant] ?? variants.primary,
                    sizes[size] ?? sizes.md,
                    fullWidth ? 'w-full' : 'w-auto',
                    className,
                )}
                {...props}
            >
                {children}
            </Comp>
        );
    },
);

Button.displayName = 'Button';

export {};
