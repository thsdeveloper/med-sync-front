import { Button } from "@/components/atoms/Button";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type AuthButtonProps = ComponentProps<typeof Button>;

export const AuthButton = ({ className, ...props }: AuthButtonProps) => (
  <Button
    {...props}
    className={cn("font-semibold tracking-tight", className)}
  />
);

