import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/molecules/auth/LoginForm";

type LoginCardProps = {
    redirectTo?: string;
};

export const LoginCard = ({ redirectTo }: LoginCardProps) => (
    <Card className="w-full max-w-md border border-slate-200 shadow-lg/30 backdrop-blur bg-white/90">
        <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
            <CardDescription>
                Acesse o painel para gerenciar escalas e colaboradores da sua empresa.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <LoginForm redirectTo={redirectTo} />
        </CardContent>
    </Card>
);

