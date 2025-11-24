import React from 'react';

import { Input as UIInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentProps<typeof UIInput> {
    hasError?: boolean;
    isValid?: boolean;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            hasError = false,
            isValid = false,
            icon,
            rightIcon,
            className,
            disabled,
            ...props
        },
        ref
    ) => {
        const stateStyles = hasError
            ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40'
            : isValid
                ? 'border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-400/40'
                : undefined;

        return (
            <div className={cn('relative', disabled && 'opacity-80')}>
                {icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        {icon}
                    </div>
                )}
                <UIInput
                    ref={ref}
                    aria-invalid={hasError || undefined}
                    data-valid={isValid ? 'true' : undefined}
                    disabled={disabled}
                    className={cn(
                        'h-11',
                        icon && 'pl-10',
                        rightIcon && 'pr-10',
                        stateStyles,
                        className
                    )}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {rightIcon}
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';