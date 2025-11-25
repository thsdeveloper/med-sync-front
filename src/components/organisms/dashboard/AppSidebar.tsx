'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(url);
  };

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
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
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
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
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
      <SidebarRail />
    </Sidebar>
  );
}

