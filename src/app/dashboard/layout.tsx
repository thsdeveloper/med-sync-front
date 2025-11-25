'use client';

import { useSelectedLayoutSegment } from "next/navigation";

import { AppSidebar } from "@/components/organisms/dashboard/AppSidebar";
import { UserMenu } from "@/components/molecules/navigation/UserMenu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";

const SEGMENT_TITLES: Record<string, string> = {
  escalas: "Escalas",
  equipe: "Corpo Clínico",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
  organizacao: "Organização",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useSupabaseAuth();
  const segment = useSelectedLayoutSegment();
  const currentBreadcrumb = segment
    ? SEGMENT_TITLES[segment] ?? "Visão Geral"
    : "Visão Geral";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentBreadcrumb}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {!loading && user ? (
            <UserMenu user={user} onSignOut={signOut} />
          ) : (
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-full bg-slate-100" />
              <div className="hidden h-10 flex-col justify-center space-y-1 sm:flex">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

