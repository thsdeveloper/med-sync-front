import { forwardRef, type ComponentProps } from 'react';

import { Input } from '@/components/atoms/Input';
import { cn } from '@/lib/utils';

type AuthInputProps = ComponentProps<typeof Input>;

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
    ({ className, ...props }, ref) => (
        <Input
            ref={ref}
            className={cn('bg-white/70 backdrop-blur', className)}
            {...props}
        />
    )
);

AuthInput.displayName = 'AuthInput';

