'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/atoms/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  organizationSettingsSchema,
  type OrganizationSettingsFormData,
} from "@medsync/shared";
import { useToastMessage } from "@/hooks/useToastMessage";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { FileUploaderSheet } from "@/components/molecules/upload/FileUploaderSheet";
import { useSupabaseSignedUrl } from "@/hooks/useSupabaseSignedUrl";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Separator } from "@/components/ui/separator";

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "med-sync-bucket";
const SIGNED_URL_LIFETIME = 60 * 60 * 24;
const MAX_LOGO_SIZE_MB = 2;
const LOGO_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "application/pdf",
] as const;

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatPhone = (value?: string | null) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const sanitizePhone = (value?: string | null) => {
  const digits = value?.replace(/\D/g, "");
  return digits && digits.length > 0 ? digits : null;
};

const inferFileExtension = (file: File) => {
  const nameExt = file.name.split(".").pop();
  if (nameExt) return nameExt.toLowerCase();

  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/svg+xml") return "svg";
  if (file.type === "application/pdf") return "pdf";
  return "png";
};

export const OrganizationSettingsForm = () => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { notifyError, notifySuccess } = useToastMessage();
  const { activeOrganization, loading: orgLoading, refreshOrganizations } = useOrganization();

  const form = useForm<OrganizationSettingsFormData>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      phone: "",
      address: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [facilitiesCount, setFacilitiesCount] = useState<number | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const {
    url: logoPreviewUrl,
    isLoading: isResolvingLogo,
    refresh: refreshLogoSignedUrl,
  } = useSupabaseSignedUrl(STORAGE_BUCKET, logoPath, {
    expiresIn: SIGNED_URL_LIFETIME,
    autoRefresh: true,
  });

  const organizationName = form.watch("name");
  const organizationInitials = useMemo(() => {
    if (!organizationName) return "ORG";
    const initials = organizationName
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
    return initials.slice(0, 2) || "ORG";
  }, [organizationName]);

  const logoIsImage = useMemo(() => {
    if (!logoPath) return false;
    return /\.(png|jpe?g|gif|svg|webp)$/i.test(logoPath);
  }, [logoPath]);

  const avatarImageSrc = logoIsImage && logoPreviewUrl ? logoPreviewUrl : undefined;

  const canDelete = facilitiesCount === 0;

  // Carregar contagem de facilities
  const loadFacilitiesCount = useCallback(async () => {
    if (!activeOrganization) {
      setFacilitiesCount(null);
      return;
    }

    const { count, error } = await supabase
      .from("facilities")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", activeOrganization.id);

    if (error) {
      console.error("Erro ao contar facilities:", error);
      setFacilitiesCount(null);
      return;
    }

    setFacilitiesCount(count ?? 0);
  }, [activeOrganization, supabase]);

  // Sincronizar form quando a organização ativa mudar
  useEffect(() => {
    if (activeOrganization) {
      form.reset({
        name: activeOrganization.name ?? "",
        cnpj: formatCnpj(activeOrganization.cnpj ?? ""),
        phone: formatPhone(activeOrganization.phone),
        address: activeOrganization.address ?? "",
      });
      setLogoPath(activeOrganization.logo_url ?? null);
      loadFacilitiesCount();
    } else {
      form.reset({
        name: "",
        cnpj: "",
        phone: "",
        address: "",
      });
      setLogoPath(null);
      setFacilitiesCount(null);
    }
  }, [activeOrganization, form, loadFacilitiesCount]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!activeOrganization) return;
    setIsSubmitting(true);

    const payload = {
      name: values.name.trim(),
      address: values.address?.trim() ? values.address.trim() : null,
      phone: sanitizePhone(values.phone),
    };

    const { error } = await supabase
      .from("organizations")
      .update(payload)
      .eq("id", activeOrganization.id);

    if (error) {
      console.error("Erro ao atualizar organização", error);
      notifyError("Não foi possível salvar as alterações.", {
        description: "Verifique os dados e tente novamente.",
      });
      setIsSubmitting(false);
      return;
    }

    notifySuccess("Dados da organização atualizados!");
    setIsSubmitting(false);
    await refreshOrganizations();
  });

  const handleDelete = async () => {
    if (!activeOrganization || !canDelete) return;

    const confirmMessage = `Tem certeza que deseja excluir a organização "${activeOrganization.name}"? Esta ação não pode ser desfeita.`;
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);

    try {
      // 1. Deletar vínculos em user_organizations
      const { error: userOrgError } = await supabase
        .from("user_organizations")
        .delete()
        .eq("organization_id", activeOrganization.id);

      if (userOrgError) throw userOrgError;

      // 2. Deletar a organização
      const { error: orgError } = await supabase
        .from("organizations")
        .delete()
        .eq("id", activeOrganization.id);

      if (orgError) throw orgError;

      notifySuccess("Organização excluída com sucesso!");
      await refreshOrganizations();
    } catch (error: any) {
      console.error("Erro ao excluir organização:", error);
      notifyError("Não foi possível excluir a organização.", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePhoneMask = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleLogoPersist = useCallback(
    async ({ path }: { path: string }) => {
      if (!activeOrganization) {
        throw new Error("Organização não encontrada.");
      }

      const { error } = await supabase
        .from("organizations")
        .update({ logo_url: path })
        .eq("id", activeOrganization.id);

      if (error) {
        throw error;
      }

      setLogoPath(path);
      await refreshLogoSignedUrl(path);
      await refreshOrganizations();
    },
    [activeOrganization, refreshLogoSignedUrl, refreshOrganizations, supabase]
  );

  const renderEmptyState = () => (
    <Alert className="border-dashed border-slate-300 bg-slate-50">
      <AlertCircle className="text-slate-500" />
      <AlertTitle>Nenhuma organização selecionada</AlertTitle>
      <AlertDescription>
        Selecione uma organização no menu lateral ou cadastre uma nova.
      </AlertDescription>
      <div className="col-span-2 mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/empresas/cadastro">Cadastrar organização</Link>
        </Button>
      </div>
    </Alert>
  );

  const avatarTrigger = (
    <button
      type="button"
      className="group flex w-full items-center gap-4 rounded-xl border border-dashed border-slate-200 p-4 text-left transition hover:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
    >
      <Avatar className="size-16 border border-slate-200 bg-white shadow-sm">
        {avatarImageSrc ? (
          <AvatarImage src={avatarImageSrc} alt="Logo da organização" />
        ) : (
          <AvatarFallback className="text-base font-semibold text-slate-600">
            {organizationInitials}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700">
          Logo da empresa
        </span>
        <span className="text-xs text-slate-500">
          Clique para enviar PNG, JPG, SVG ou PDF (até {MAX_LOGO_SIZE_MB}MB)
        </span>
        {isResolvingLogo && (
          <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Loader2 className="size-3 animate-spin" />
            Atualizando preview...
          </span>
        )}
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-6">
          {orgLoading && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Carregando dados da organização...
            </div>
          )}

          {!orgLoading && !activeOrganization && renderEmptyState()}

          {!orgLoading && activeOrganization && (
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-6">
                <FileUploaderSheet
                  trigger={avatarTrigger}
                  title="Selecione seu novo logo"
                  description="Selecione uma imagem (PNG, JPG, SVG) ou PDF com até 2MB."
                  uploaderProps={{
                    bucket: STORAGE_BUCKET,
                    description:
                      "Selecione uma imagem (PNG, JPG, SVG) ou PDF com até 2MB.",
                    helperText:
                      "Aceitamos PNG, JPG, SVG ou PDF. Tamanho máximo de 2MB.",
                    value: logoPath,
                    fileName: organizationName || undefined,
                    previewVariant: "image",
                    accept: [...LOGO_ACCEPTED_TYPES],
                    maxSizeMb: MAX_LOGO_SIZE_MB,
                    getFilePath: (file) => {
                      if (!activeOrganization) {
                        throw new Error("Organização não encontrada.");
                      }
                      const extension = inferFileExtension(file);
                      return `organizations/${activeOrganization.id}/logo.${extension}`;
                    },
                    onFileUploaded: ({ path }) => handleLogoPersist({ path }),
                  }}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome fantasia</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex.: Hospital São Lucas" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ (não editável)</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly disabled className="bg-slate-50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone comercial</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(11) 99999-0000"
                            onChange={(event) =>
                              field.onChange(handlePhoneMask(event.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col gap-2 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">
                      Dicas rápidas
                    </span>
                    <p>
                      Mantenha um telefone válido para facilitar o contato da sua
                      equipe.
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço completo</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="Rua, número, bairro, cidade - UF"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-slate-500">
                    Todas as alterações são aplicadas imediatamente.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => refreshOrganizations()}
                      disabled={isSubmitting}
                    >
                      <RefreshCw className="mr-2 size-4" />
                      Recarregar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 size-4" />
                          Salvar alterações
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Zona de Perigo - Excluir Organização */}
      {!orgLoading && activeOrganization && (
        <Card className="border-red-200 shadow-sm">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <AlertTriangle className="size-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Zona de Perigo
                  </h3>
                  <p className="text-sm text-slate-500">
                    Excluir esta organização é uma ação permanente e não pode ser desfeita.
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">
                      Excluir organização
                    </p>
                    {facilitiesCount !== null && facilitiesCount > 0 ? (
                      <p className="text-xs text-amber-600">
                        Não é possível excluir. Existem {facilitiesCount} clínica(s)/hospital(is) cadastrado(s).
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Todos os dados serão removidos permanentemente.
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={!canDelete || isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 size-4" />
                        Excluir Organização
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
