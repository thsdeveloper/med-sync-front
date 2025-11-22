'use client';

import Link from "next/link";
import {
  CalendarCheck2,
  Command,
  FileText,
  LayoutDashboard,
  Settings,
  Users2,
  Building2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/atoms/Logo";
import { UserMenu } from "@/components/molecules/navigation/UserMenu";
import { useSupabaseAuth } from "@/providers/SupabaseAuthProvider";

const mainNavItems = [
  {
    title: "Visão Geral",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Escalas",
    url: "/dashboard/escalas",
    icon: CalendarCheck2,
  },
  {
    title: "Corpo Clínico",
    url: "/dashboard/equipe",
    icon: Users2,
  },
  {
    title: "Relatórios",
    url: "/dashboard/relatorios",
    icon: FileText,
  },
];

const configNavItems = [
  {
    title: "Organização",
    url: "/dashboard/organizacao",
    icon: Building2,
  },
  {
    title: "Configurações",
    url: "/dashboard/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { user, signOut } = useSupabaseAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-12 items-center gap-2 px-2 overflow-hidden transition-all group-data-[collapsible=icon]:w-0">
          <Logo />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white md:hidden group-data-[collapsible=icon]:flex">
          <Command className="size-6" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-1 group-data-[collapsible=icon]:hidden">
            {user && <UserMenu user={user} onSignOut={signOut} />}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

