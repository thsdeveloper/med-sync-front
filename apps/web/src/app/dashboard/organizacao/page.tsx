'use client';

import { Building2 } from "lucide-react";

import { OrganizationSettingsForm } from "@/components/organisms/dashboard/OrganizationSettingsForm";
import { PageHeader } from "@/components/organisms/page";

export default function OrganizationPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="Dados da empresa"
        icon={<Building2 className="h-6 w-6" />}
        title="Organização"
        description="Visualize e atualize os dados da organização selecionada."
      />

      <OrganizationSettingsForm />
    </div>
  );
}
