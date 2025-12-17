/**
 * Clinicas Table Column Definitions
 *
 * TanStack Table column definitions for the Clinicas (Facilities) data table.
 * Defines columns for facility name, type, contact info, status, and actions.
 *
 * Features:
 * - Sortable columns for name and created_at
 * - Custom cell renderers for facility type badges, status badges, and action buttons
 * - Edit and Delete actions via dropdown menu
 * - Responsive design with proper formatting
 */

"use client";

import React from "react";
import { MoreHorizontal, Edit, Trash2, Phone, Building2, Hospital } from "lucide-react";
import { Facility, FACILITY_TYPE_LABELS } from "@medsync/shared";
import type { DataTableColumn } from "@/components/data-table/types";
import { ColumnHeader } from "@/components/data-table/molecules/ColumnHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Props for the actions column
 */
interface ClinicasActionsProps {
  facility: Facility;
  onEdit: (facility: Facility) => void;
  onDelete: (id: string) => void;
}

/**
 * Actions cell component - Edit and Delete buttons
 */
function ClinicasActions({ facility, onEdit, onDelete }: ClinicasActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(facility)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => onDelete(facility.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Facility icon component - Shows clinic or hospital icon
 */
function FacilityIcon({ type }: { type: "clinic" | "hospital" }) {
  const Icon = type === "hospital" ? Hospital : Building2;
  return <Icon className="h-5 w-5" />;
}

/**
 * Creates column definitions for the Clinicas table
 *
 * @param onEdit - Callback function when edit action is triggered
 * @param onDelete - Callback function when delete action is triggered
 * @returns Array of column definitions for TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getClinicasColumns({
 *   onEdit: (facility) => console.log("Edit", facility),
 *   onDelete: (id) => console.log("Delete", id),
 * });
 *
 * <DataTable data={facilities} columns={columns} />
 * ```
 */
export function getClinicasColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (facility: Facility) => void;
  onDelete: (id: string) => void;
}): DataTableColumn<Facility>[] {
  return [
    // Name column - sortable, with facility icon and type badge
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Unidade" />,
      cell: ({ row }) => {
        const facility = row.original;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${
                facility.type === "hospital"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <FacilityIcon type={facility.type} />
            </div>
            <div>
              <div className="font-medium text-slate-900">{facility.name}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    facility.type === "hospital"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {FACILITY_TYPE_LABELS[facility.type]}
                </span>
                {facility.cnpj && <span className="ml-1">• {facility.cnpj}</span>}
              </div>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },

    // Phone column - displays phone number with icon or dash
    {
      accessorKey: "phone",
      header: "Contato",
      cell: ({ row }) => {
        const phone = row.original.phone;
        return phone ? (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Phone className="w-3 h-3" />
            {phone}
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        );
      },
      enableSorting: false,
    },

    // Status column - active/inactive badge centered
    {
      accessorKey: "active",
      header: ({ column }) => <ColumnHeader column={column} title="Status" align="center" />,
      cell: ({ row }) => {
        const active = row.original.active;
        return (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {active ? "Ativa" : "Inativa"}
            </span>
          </div>
        );
      },
      enableSorting: true,
      // Custom filter function for status filtering
      filterFn: (row, columnId, filterValue) => {
        // filterValue will be "active" or "inactive" or empty
        if (!filterValue) return true;
        const isActive = row.original.active;
        return filterValue === "active" ? isActive : !isActive;
      },
    },

    // Created date column - sortable, shows relative time
    {
      accessorKey: "created_at",
      header: ({ column }) => <ColumnHeader column={column} title="Cadastrada em" />,
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        const relativeTime = formatDistanceToNow(date, {
          addSuffix: true,
          locale: ptBR,
        });
        return (
          <div className="text-slate-600">
            <div className="text-sm">{relativeTime}</div>
            <div className="text-xs text-slate-400">
              {date.toLocaleDateString("pt-BR")}
            </div>
          </div>
        );
      },
      enableSorting: true,
    },

    // Actions column - edit and delete buttons
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <ClinicasActions facility={row.original} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
