# DataTable Component System

Reusable data table component architecture following **Atomic Design** principles with **TanStack Table v8** integration.

## Architecture Overview

This DataTable system is built using the Atomic Design methodology, organizing components into three levels:

### 🔹 Atoms (Basic Building Blocks)
Located in `atoms/`:
- **TableCell** - Table data cell with text alignment support
- **TableHeader** - Table header cell with accessibility features
- **TableRow** - Table row with hover states and click handlers

### 🔸 Molecules (Composite Components)
Located in `molecules/`:
- **ColumnHeader** - Sortable column header with sort indicators (↑↓)
- **TablePagination** - Pagination controls with page size selector
- **TableToolbar** - Search input and filter controls

### 🔶 Organisms (Complete UI Sections)
Located in `organisms/`:
- **DataTable** - Main table component integrating all atoms and molecules

## Features

✅ **Sorting** - Click column headers to sort ascending/descending
✅ **Filtering** - Global search with column-specific filtering
✅ **Pagination** - Page navigation with configurable page sizes
✅ **Loading States** - Built-in loading spinner
✅ **Empty States** - Customizable empty state messages
✅ **Row Selection** - Support for selectable rows
✅ **Clickable Rows** - Optional row click handlers
✅ **Type Safety** - Full TypeScript support with generics
✅ **Responsive** - Mobile-friendly design
✅ **Accessible** - ARIA labels and keyboard navigation

## Installation

The DataTable system requires these dependencies (already installed):

```bash
pnpm add @tanstack/react-table
npx shadcn@latest add table
```

## Basic Usage

### 1. Define Your Data Type

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}
```

### 2. Define Columns

```tsx
import { DataTableColumn, ColumnHeader } from "@/components/data-table";

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
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString("pt-BR");
    },
  },
];
```

### 3. Use the DataTable

```tsx
import { DataTable } from "@/components/data-table";

export function UsersTable() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch users from API
    fetchUsers().then(setUsers).finally(() => setIsLoading(false));
  }, []);

  return (
    <DataTable
      data={users}
      columns={columns}
      isLoading={isLoading}
      searchColumn="name"
      searchPlaceholder="Buscar por nome..."
      emptyMessage="Nenhum usuário encontrado."
      onRowClick={(user) => console.log("Clicked user:", user)}
    />
  );
}
```

## Advanced Usage

### Custom Column Cell Rendering

```tsx
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.original.status;
    return (
      <Badge variant={status === "active" ? "success" : "secondary"}>
        {status}
      </Badge>
    );
  },
}
```

### Actions Column

```tsx
{
  id: "actions",
  header: "Ações",
  cell: ({ row }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleEdit(row.original)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(row.original)}>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

### Custom Toolbar Actions

```tsx
<DataTable
  data={users}
  columns={columns}
  searchColumn="name"
>
  {/* Pass custom actions as children to TableToolbar */}
  <Button variant="outline" onClick={handleExport}>
    <Download className="mr-2 h-4 w-4" />
    Exportar
  </Button>
  <Button onClick={handleAddNew}>
    <Plus className="mr-2 h-4 w-4" />
    Adicionar
  </Button>
</DataTable>
```

### Disable Features

```tsx
<DataTable
  data={users}
  columns={columns}
  enablePagination={false}  // Disable pagination
  enableSorting={false}     // Disable sorting
  enableFiltering={false}   // Disable filtering
  showToolbar={false}       // Hide toolbar
/>
```

### Custom Page Sizes

```tsx
<DataTable
  data={users}
  columns={columns}
  pageSize={25}                          // Initial page size
  pageSizeOptions={[5, 10, 25, 50, 100]} // Available page sizes
/>
```

## Component Props

### DataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TData[]` | **required** | Array of data to display |
| `columns` | `DataTableColumn<TData>[]` | **required** | Column definitions |
| `enablePagination` | `boolean` | `true` | Enable pagination |
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `enableFiltering` | `boolean` | `true` | Enable filtering |
| `pageSize` | `number` | `10` | Initial page size |
| `pageSizeOptions` | `number[]` | `[10, 20, 30, 40, 50]` | Page size options |
| `showToolbar` | `boolean` | `true` | Show toolbar |
| `searchPlaceholder` | `string` | `"Buscar..."` | Search input placeholder |
| `searchColumn` | `string` | `undefined` | Column ID for search |
| `isLoading` | `boolean` | `false` | Loading state |
| `emptyMessage` | `string` | `"Nenhum resultado encontrado."` | Empty state message |
| `className` | `string` | `undefined` | Custom class name |
| `onRowClick` | `(row: TData) => void` | `undefined` | Row click handler |

### ColumnHeader Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `column` | `Column<TData, TValue>` | **required** | TanStack Table column |
| `title` | `string` | **required** | Column title |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Text alignment |
| `className` | `string` | `undefined` | Custom class name |

### TablePagination Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `table` | `Table<any>` | **required** | TanStack Table instance |
| `pageSizeOptions` | `number[]` | `[10, 20, 30, 40, 50]` | Page size options |
| `className` | `string` | `undefined` | Custom class name |

### TableToolbar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `table` | `Table<any>` | **required** | TanStack Table instance |
| `searchPlaceholder` | `string` | `"Buscar..."` | Search placeholder |
| `searchColumn` | `string` | `undefined` | Column ID for search |
| `className` | `string` | `undefined` | Custom class name |
| `children` | `React.ReactNode` | `undefined` | Custom actions |

## File Structure

```
src/components/data-table/
├── atoms/
│   ├── TableCell.tsx       # Table data cell component
│   ├── TableHeader.tsx     # Table header cell component
│   └── TableRow.tsx        # Table row component
├── molecules/
│   ├── ColumnHeader.tsx    # Sortable column header with indicators
│   ├── TablePagination.tsx # Pagination controls
│   └── TableToolbar.tsx    # Search and filter toolbar
├── organisms/
│   └── DataTable.tsx       # Main table component
├── types/
│   └── index.ts            # TypeScript type definitions
├── index.ts                # Export all components and types
└── README.md               # This documentation file
```

## TypeScript Types

### DataTableColumn

Extends TanStack Table's `ColumnDef` with additional properties:

```tsx
type DataTableColumn<TData, TValue> = ColumnDef<TData, TValue> & {
  className?: string;
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
  enableHiding?: boolean;
};
```

### DataTableProps

Generic props for the DataTable component:

```tsx
interface DataTableProps<TData> {
  data: TData[];
  columns: DataTableColumn<TData>[];
  // ... see Component Props table above
}
```

## Best Practices

### 1. Memoize Column Definitions

```tsx
const columns = React.useMemo<DataTableColumn<User>[]>(
  () => [
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Nome" />,
    },
    // ... more columns
  ],
  []
);
```

### 2. Use Proper TypeScript Generics

```tsx
// ✅ Good - Fully typed
const columns: DataTableColumn<User>[] = [...];

// ❌ Bad - No type safety
const columns = [...];
```

### 3. Handle Loading and Error States

```tsx
if (isLoading) {
  return <DataTable data={[]} columns={columns} isLoading={true} />;
}

if (error) {
  return <div>Error: {error.message}</div>;
}

return <DataTable data={users} columns={columns} />;
```

### 4. Use Column IDs for Filtering

```tsx
// Set accessorKey for filtering
{
  accessorKey: "name", // This allows searchColumn="name" to work
  header: "Nome",
}
```

## Examples

See the `examples/` directory (to be created) for complete usage examples:

- `examples/basic-table.tsx` - Simple table with minimal configuration
- `examples/sortable-table.tsx` - Table with sortable columns
- `examples/filtered-table.tsx` - Table with search and filters
- `examples/actions-table.tsx` - Table with action buttons
- `examples/custom-cells.tsx` - Table with custom cell rendering

## Integration with TanStack Table

This DataTable system is built on **TanStack Table v8**, providing:

- **Column definitions** via `ColumnDef`
- **Row models** for core, sorted, filtered, and paginated data
- **State management** for sorting, filtering, and pagination
- **Type safety** with TypeScript generics

For advanced TanStack Table features, refer to the [official documentation](https://tanstack.com/table/v8/docs/introduction).

## Troubleshooting

### Search not working

Ensure you've set the `searchColumn` prop to a valid `accessorKey`:

```tsx
<DataTable
  data={users}
  columns={columns}
  searchColumn="name" // Must match a column's accessorKey
/>
```

### Sorting not working

Make sure you've used `ColumnHeader` component in your column definition:

```tsx
{
  accessorKey: "name",
  header: ({ column }) => <ColumnHeader column={column} title="Nome" />,
  enableSorting: true, // Optional, defaults to true
}
```

### Type errors with column definitions

Ensure you're using the correct generic type:

```tsx
const columns: DataTableColumn<User>[] = [...];
//                            ^^^^^ Your data type
```

## Future Enhancements

Potential features for future development:

- [ ] Column visibility toggle
- [ ] Row selection with checkboxes
- [ ] Export to CSV/Excel
- [ ] Column resizing
- [ ] Column reordering
- [ ] Expandable rows
- [ ] Virtualization for large datasets
- [ ] Server-side pagination/sorting/filtering
- [ ] Multi-column sorting
- [ ] Advanced filters (date range, multi-select, etc.)

## Contributing

When adding new features to the DataTable system:

1. Follow the Atomic Design methodology
2. Maintain full TypeScript type safety
3. Add comprehensive JSDoc comments
4. Update this README with new features
5. Create example usage in the examples directory

## License

Part of the MedSync project.
