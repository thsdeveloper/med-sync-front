'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { OrganizationSettingsForm } from "@/components/organisms/dashboard/OrganizationSettingsForm";
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Organização</h1>
        <p className="text-sm text-slate-500">
          Visualize e atualize os dados básicos da empresa criada por você.
        </p>
      </div>

      <OrganizationSettingsForm ownerId={user.id} />
    </div>
  );
}


