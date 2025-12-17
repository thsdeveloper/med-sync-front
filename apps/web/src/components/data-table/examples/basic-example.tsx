/**
 * Basic DataTable Example
 *
 * This example demonstrates a simple DataTable implementation with:
 * - Basic column definitions
 * - Sortable columns
 * - Global search
 * - Pagination
 */

"use client";

import React from "react";
import { DataTable, ColumnHeader, type DataTableColumn } from "@/components/data-table";

// Define data type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
}

// Sample data
const sampleUsers: User[] = [
  { id: "1", name: "João Silva", email: "joao@example.com", role: "Admin", status: "active" },
  { id: "2", name: "Maria Santos", email: "maria@example.com", role: "User", status: "active" },
  { id: "3", name: "Pedro Costa", email: "pedro@example.com", role: "User", status: "inactive" },
  { id: "4", name: "Ana Paula", email: "ana@example.com", role: "Manager", status: "active" },
  { id: "5", name: "Carlos Souza", email: "carlos@example.com", role: "User", status: "active" },
];

// Define columns
const columns: DataTableColumn<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Nome" />,
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: ({ column }) => <ColumnHeader column={column} title="Função" />,
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {status === "active" ? "Ativo" : "Inativo"}
        </span>
      );
    },
  },
];

/**
 * BasicDataTableExample component
 */
export function BasicDataTableExample() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-4 text-2xl font-bold">DataTable Example</h1>
      <DataTable
        data={sampleUsers}
        columns={columns}
        searchColumn="name"
        searchPlaceholder="Buscar por nome..."
        pageSize={5}
        onRowClick={(user) => {
          console.log("Clicked user:", user);
        }}
      />
    </div>
  );
}
