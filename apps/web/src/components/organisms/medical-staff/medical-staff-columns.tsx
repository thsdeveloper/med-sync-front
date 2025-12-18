/**
 * Medical Staff Table Column Definitions
 *
 * TanStack Table column definitions for the Medical Staff (Equipe) data table.
 * Defines columns for medical staff name, profissao, especialidade, contact info, status, and actions.
 *
 * Features:
 * - Sortable columns for name, profissao, and especialidade
 * - Multi-select filters for profissao, especialidade, and status
 * - Custom cell renderers for contact info, status badges, and action buttons
 * - Edit and Unlink actions via dropdown menu
 * - Multi-organization indicator badge
 * - Responsive design with proper formatting
 */

"use client";

import React from "react";
import {
  MoreHorizontal,
  Edit,
  Unlink,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { MedicalStaffWithOrganization } from "@medsync/shared";
import type { DataTableColumn } from "@/components/data-table/types";
import { ColumnHeader } from "@/components/data-table/molecules/ColumnHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Props for the actions column
 */
interface MedicalStaffActionsProps {
  staff: MedicalStaffWithOrganization;
  onEdit: (staff: MedicalStaffWithOrganization) => void;
  onUnlink: (staffId: string, staffOrgId: string, organizationCount: number) => void;
}

/**
 * Actions cell component - Edit and Unlink buttons
 */
function MedicalStaffActions({
  staff,
  onEdit,
  onUnlink,
}: MedicalStaffActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(staff)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => {
            if (staff.staff_organization) {
              onUnlink(
                staff.id,
                staff.staff_organization.id,
                staff.organization_count ?? 1
              );
            }
          }}
        >
          <Unlink className="mr-2 h-4 w-4" />
          {(staff.organization_count ?? 1) > 1 ? "Desvincular" : "Remover"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Get initials from name for avatar
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Get active status from staff organization or global staff record
 */
function isActiveInOrg(staff: MedicalStaffWithOrganization): boolean {
  return staff.staff_organization?.active ?? staff.active;
}

/**
 * Creates column definitions for the Medical Staff table
 *
 * @param onEdit - Callback function when edit action is triggered
 * @param onUnlink - Callback function when unlink action is triggered
 * @returns Array of column definitions for TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getMedicalStaffColumns({
 *   onEdit: (staff) => console.log("Edit", staff),
 *   onUnlink: (staffId, staffOrgId, count) => console.log("Unlink", staffId),
 * });
 *
 * <DataTable data={staff} columns={columns} />
 * ```
 */
export function getMedicalStaffColumns({
  onEdit,
  onUnlink,
}: {
  onEdit: (staff: MedicalStaffWithOrganization) => void;
  onUnlink: (staffId: string, staffOrgId: string, organizationCount: number) => void;
}): DataTableColumn<MedicalStaffWithOrganization>[] {
  return [
    // Name column - sortable, with avatar and profissao badge
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Profissional" />,
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarFallback
                    style={{
                      backgroundColor: staff.color + "20",
                      color: staff.color,
                    }}
                  >
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Multi-organization indicator */}
                {(staff.organization_count ?? 1) > 1 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full border-2 border-white">
                        <Building2 className="w-3 h-3 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Vinculado a {staff.organization_count} organizações</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div>
                <div className="font-medium text-slate-900">{staff.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: staff.color }}
                  ></span>
                  {staff.profissao?.nome || 'Profissional'}
                  {staff.crm && ` • ${staff.crm}`}
                </div>
              </div>
            </div>
          </TooltipProvider>
        );
      },
      enableSorting: true,
    },

    // Especialidade column - sortable, filterable
    {
      accessorKey: "especialidade.nome",
      id: "especialidade",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Especialidade" />
      ),
      cell: ({ row }) => {
        const especialidade = row.original.especialidade?.nome;
        return (
          <div className="text-slate-600">{especialidade || "-"}</div>
        );
      },
      enableSorting: true,
      // Custom sorting function for nested especialidade.nome
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.especialidade?.nome || "";
        const b = rowB.original.especialidade?.nome || "";
        return a.localeCompare(b);
      },
      // Custom filter function for especialidade multi-select
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const especialidade = row.original.especialidade?.nome?.toLowerCase() || "";
        return filterValue.some((val: string) =>
          especialidade.includes(val.toLowerCase())
        );
      },
    },

    // Contact column - displays email and phone
    {
      accessorKey: "email",
      id: "contact",
      header: "Contato",
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <div className="flex flex-col gap-1 text-slate-600">
            {staff.email && (
              <div className="flex items-center gap-1.5 text-sm">
                <Mail className="w-3 h-3" />
                {staff.email}
              </div>
            )}
            {staff.phone && (
              <div className="flex items-center gap-1.5 text-sm">
                <Phone className="w-3 h-3" />
                {staff.phone}
              </div>
            )}
            {!staff.email && !staff.phone && (
              <span className="text-slate-400">-</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },

    // Status column - active/inactive badge centered, filterable
    {
      accessorKey: "active",
      id: "status",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Status" align="center" />
      ),
      cell: ({ row }) => {
        const staff = row.original;
        const active = isActiveInOrg(staff);
        return (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {active ? "Ativo" : "Inativo"}
            </span>
          </div>
        );
      },
      enableSorting: true,
      // Custom filter function for status filtering
      filterFn: (row, columnId, filterValue) => {
        // filterValue will be ["active"] or ["inactive"] or empty
        if (!filterValue || filterValue.length === 0) return true;
        const active = isActiveInOrg(row.original);
        return filterValue.some((val: string) =>
          val === "active" ? active : !active
        );
      },
    },

    // Actions column - edit and unlink buttons
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <MedicalStaffActions
            staff={row.original}
            onEdit={onEdit}
            onUnlink={onUnlink}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
