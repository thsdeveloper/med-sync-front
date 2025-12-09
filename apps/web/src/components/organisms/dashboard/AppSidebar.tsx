'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarCheck2,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Settings,
  Users2,
  Building2,
  Check,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useOrganization, type Organization } from "@/providers/OrganizationProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBadge } from "@/components/atoms";
import { NewOrganizationDialog } from "./NewOrganizationDialog";
import { useSupabaseSignedUrl } from "@/hooks/useSupabaseSignedUrl";

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "med-sync-bucket";

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
    title: "Trocas",
    url: "/dashboard/trocas",
    icon: ArrowLeftRight,
  },
  {
    title: "Corpo Clínico",
    url: "/dashboard/equipe",
    icon: Users2,
  },
  {
    title: "Mensagens",
    url: "/dashboard/chat",
    icon: MessageCircle,
  },
  {
    title: "Relatórios",
    url: "/dashboard/relatorios",
    icon: FileText,
  },
];

const organizationSubItems = [
  {
    title: "Dados da Organização",
    url: "/dashboard/organizacao",
  },
  {
    title: "Clínicas e Hospitais",
    url: "/dashboard/organizacao/clinicas",
  },
];

// Componente para Avatar da Organização com suporte a logo
function OrganizationAvatar({ 
  organization, 
  size = "md" 
}: { 
  organization: Organization | null; 
  size?: "sm" | "md" 
}) {
  const logoPath = organization?.logo_url ?? null;
  
  const { url: logoUrl, isLoading } = useSupabaseSignedUrl(
    STORAGE_BUCKET,
    logoPath,
    { expiresIn: 60 * 60 * 24, autoRefresh: true }
  );

  const isImageLogo = useMemo(() => {
    if (!logoPath) return false;
    return /\.(png|jpe?g|gif|svg|webp)$/i.test(logoPath);
  }, [logoPath]);

  const initials = useMemo(() => {
    if (!organization?.name) return "ORG";
    return organization.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [organization?.name]);

  const sizeClasses = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";
  const imageSize = size === "sm" ? 24 : 32;

  if (!organization) {
    return (
      <div className={`flex aspect-square ${sizeClasses} items-center justify-center rounded-lg bg-slate-200 text-slate-500`}>
        <Building2 className={size === "sm" ? "size-3" : "size-4"} />
      </div>
    );
  }

  // Se tem logo e é uma imagem válida
  if (isImageLogo && logoUrl && !isLoading) {
    return (
      <div className={`relative flex aspect-square ${sizeClasses} items-center justify-center rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm`}>
        <Image
          src={logoUrl}
          alt={organization.name}
          width={imageSize}
          height={imageSize}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    );
  }

  // Fallback para iniciais com gradiente
  return (
    <div className={`flex aspect-square ${sizeClasses} items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold shadow-sm`}>
      {isLoading ? (
        <div className="animate-pulse bg-white/30 rounded w-3/4 h-1/2" />
      ) : (
        initials
      )}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isNewOrgDialogOpen, setIsNewOrgDialogOpen] = useState(false);
  const {
    organizations,
    activeOrganization,
    activeRole,
    loading,
    setActiveOrganization,
  } = useOrganization();
  const { pendingSwapsCount } = useNotifications();

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (url === "/dashboard/organizacao") {
      return pathname === "/dashboard/organizacao";
    }
    return pathname.startsWith(url);
  };

  const isOrganizationActive = pathname.startsWith("/dashboard/organizacao");

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Admin';
      default:
        return 'Membro';
    }
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          {/* Seletor de Organização */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    {loading ? (
                      <>
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </>
                    ) : activeOrganization ? (
                      <>
                        <OrganizationAvatar organization={activeOrganization} size="md" />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {activeOrganization.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {getRoleBadge(activeRole || 'member')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <OrganizationAvatar organization={null} size="md" />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold text-muted-foreground">
                            Sem organização
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            Crie uma para começar
                          </span>
                        </div>
                      </>
                    )}
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Suas Organizações
                  </DropdownMenuLabel>
                  {organizations.length === 0 && !loading && (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      Nenhuma organização encontrada
                    </div>
                  )}
                  {organizations.map((userOrg) => (
                    <DropdownMenuItem
                      key={userOrg.organization_id}
                      onClick={() => setActiveOrganization(userOrg.organization_id)}
                      className="gap-2 p-2 cursor-pointer"
                    >
                      <OrganizationAvatar organization={userOrg.organization} size="sm" />
                      <span className="flex-1 truncate">{userOrg.organization.name}</span>
                      {activeOrganization?.id === userOrg.organization_id && (
                        <Check className="size-4 text-blue-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsNewOrgDialogOpen(true)}
                    className="gap-2 p-2 cursor-pointer"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <span className="text-muted-foreground">Nova organização</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
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
                        <span className="flex-1">{item.title}</span>
                        {item.url === "/dashboard/trocas" && pendingSwapsCount > 0 && (
                          <NotificationBadge
                            count={pendingSwapsCount}
                            variant="warning"
                            size="sm"
                          />
                        )}
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
                {/* Organização com submenu */}
                <Collapsible
                  asChild
                  defaultOpen={isOrganizationActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Organização" isActive={isOrganizationActive}>
                        <Building2 />
                        <span>Organização</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {organizationSubItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                {/* Configurações */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Configurações" isActive={isActive("/dashboard/configuracoes")}>
                    <Link href="/dashboard/configuracoes">
                      <Settings />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {/* Dialog para nova organização */}
      <NewOrganizationDialog
        open={isNewOrgDialogOpen}
        onOpenChange={setIsNewOrgDialogOpen}
      />
    </>
  );
}
