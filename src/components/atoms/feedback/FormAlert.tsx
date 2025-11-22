import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ReactNode } from "react";

type FormAlertProps = {
  title: string;
  description?: ReactNode;
  variant?: "default" | "destructive";
};

export const FormAlert = ({
  title,
  description,
  variant = "default",
}: FormAlertProps) => (
  <Alert
    variant={variant}
    className="bg-white/80 shadow-sm border border-slate-200"
  >
    <AlertTitle>{title}</AlertTitle>
    {description ? <AlertDescription>{description}</AlertDescription> : null}
  </Alert>
);

