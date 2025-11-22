'use client';

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type UserMenuProps = {
  user: User;
  onSignOut: () => Promise<void>;
};

const getInitials = (displayName: string) => {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
};

export const UserMenu = ({ user, onSignOut }: UserMenuProps) => {
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Usuário";

  const initials = getInitials(displayName || "U");

  const handleSignOut = async () => {
    await onSignOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1 shadow-sm transition hover:shadow-md"
          aria-label="Menu do usuário"
        >
          <Avatar className="size-10 border border-slate-200 bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold">
            <AvatarFallback className="bg-transparent text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">
              {displayName}
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              {displayName}
            </span>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/" className="w-full">
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/empresas/cadastro" className="w-full">
              Minha Empresa
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/configuracoes" className="w-full">
              Configurações
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <button
            onClick={handleSignOut}
            className="w-full rounded-md bg-red-50 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Sair
          </button>
        </div>
        <Separator />
        <p className="px-3 py-2 text-xs text-slate-400">
          Último acesso seguro ao Supabase.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

