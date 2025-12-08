import React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white' | 'destructive' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
    asChild?: boolean;
    children: React.ReactNode;
}

const baseStyles =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold rounded-full transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-200';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30',
    secondary: 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'bg-transparent text-slate-600 hover:text-blue-600 hover:bg-blue-50/50',
    white: 'bg-white text-blue-600 shadow-xl hover:shadow-2xl',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30',
    link: 'bg-transparent text-blue-600 underline-offset-4 hover:underline px-0 py-0 font-medium',
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
