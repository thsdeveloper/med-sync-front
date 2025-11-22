'use client';

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AuthInput } from "@/components/atoms/form/AuthInput";
import { AuthButton } from "@/components/atoms/form/AuthButton";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";
import { useToastMessage } from "@/hooks/useToastMessage";

const loginSchema = z.object({
    email: z
        .string({ required_error: "Informe seu e-mail." })
        .email("E-mail inválido."),
    password: z
        .string({ required_error: "Informe sua senha." })
        .min(6, "A senha deve ter ao menos 6 caracteres."),
});

type LoginSchema = z.infer<typeof loginSchema>;

type LoginFormProps = {
    redirectTo?: string;
    onSuccess?: () => void;
};

export const LoginForm = ({ redirectTo = "/", onSuccess }: LoginFormProps) => {
    const router = useRouter();
    const { signInWithPassword } = useSupabaseAuth();
    const { notifyError, notifySuccess } = useToastMessage();
    const form = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });
    const [isPending, startTransition] = useTransition();

    const onSubmit = async (values: LoginSchema) => {
        try {
            await signInWithPassword(values);
            notifySuccess("Login realizado com sucesso!", {
                description: "Redirecionando para sua área segura.",
            });
            startTransition(() => {
                router.push(redirectTo);
                router.refresh();
                onSuccess?.();
            });
        } catch (error) {
            console.error("Erro no login", error);
            notifyError("Erro ao entrar", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível realizar o login. Tente novamente.",
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail</FormLabel>
                                <FormControl>
                                    <AuthInput
                                        {...field}
                                        type="email"
                                        placeholder="nome@empresa.com"
                                        autoComplete="email"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                    <AuthInput
                                        {...field}
                                        type="password"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <AuthButton
                    type="submit"
                    disabled={form.formState.isSubmitting || isPending}
                    className="w-full h-11"
                >
                    {form.formState.isSubmitting || isPending ? "Entrando..." : "Entrar"}
                </AuthButton>
            </form>
        </Form>
    );
};

