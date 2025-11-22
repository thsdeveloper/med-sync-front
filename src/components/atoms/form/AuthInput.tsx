import { forwardRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthInputProps = ComponentProps<"input">;

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
    ({ className, ...props }, ref) => (
        <Input
            ref={ref}
            className={cn("h-11 bg-white/70 backdrop-blur", className)}
            {...props}
        />
    )
);

AuthInput.displayName = "AuthInput";

