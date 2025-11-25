'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { OrganizationSettingsForm } from "@/components/organisms/dashboard/OrganizationSettingsForm";
import { PageHeader } from "@/components/organisms/page";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";

export default function OrganizationPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/dashboard/organizacao");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60">
        <p className="text-sm text-slate-500">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Dados da empresa"
        icon={<Building2 className="h-6 w-6" />}
        title="Organização"
        description="Visualize e atualize os dados básicos da empresa criada por você."
      />

      <OrganizationSettingsForm ownerId={user.id} />
    </div>
  );
}


