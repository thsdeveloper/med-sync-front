# TanStack Table Utilities Documentation

Complete guide for using TanStack Table v8 in the MedSync web application.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Quick Start](#quick-start)
- [useDataTable Hook](#usedatatable-hook)
- [Table Utilities](#table-utilities)
- [Default Configuration](#default-configuration)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)
- [Migration Guide](#migration-guide)

---

## Overview

This documentation covers the TanStack Table integration in MedSync, including:

- **useDataTable Hook**: Custom hook encapsulating common table logic with TypeScript generics
- **Table Utilities**: Helper functions for column definitions, sorting, filtering, and pagination
- **Default Configuration**: Reusable table options and settings
- **Type Safety**: Full TypeScript support with generic types

### Key Features

✅ **Type-Safe**: Full TypeScript support with generics
✅ **Flexible**: Supports both client-side and server-side data management
✅ **Reusable**: Shared configuration and utilities across all tables
✅ **Accessible**: Built-in ARIA labels and keyboard navigation
✅ **Customizable**: Override defaults on a per-table basis
✅ **Performance**: Optimized with React memoization and debouncing

---

## Installation

TanStack Table is already installed in the project:

```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.21.3"
  }
}
```

No additional installation required.

---

## Core Concepts

### 1. Table Instance

The table instance is created using `useReactTable()` (or our wrapper `useDataTable()`):

```tsx
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});
```

### 2. Column Definitions

Columns define how data is displayed and accessed:

```tsx
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: info => info.getValue(),
  },
];
```

### 3. State Management

Tables manage several pieces of state:

- **Pagination**: Current page index and page size
- **Sorting**: Active sort column and direction
- **Filtering**: Column filters and global search
- **Row Selection**: Selected row IDs
- **Column Visibility**: Hidden/visible columns

### 4. Client-Side vs Server-Side

**Client-side**: All data loaded in memory, table handles sorting/filtering/pagination

**Server-side**: Data fetched from API, table sends parameters to server

---

## Quick Start

### Basic Client-Side Table

```tsx
'use client';

import { useDataTable } from '@/hooks';
import { createColumnHelper } from '@/lib/table-utils';

interface User {
  id: string;
  name: string;
  email: string;
}

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
  }),
  columnHelper.accessor('email', {
    header: 'Email',
  }),
];

export function UsersTable() {
  const users: User[] = [
    { id: '1', name: 'João Silva', email: 'joao@example.com' },
    { id: '2', name: 'Maria Santos', email: 'maria@example.com' },
  ];

  const { table } = useDataTable({
    data: users,
    columns,
  });

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Basic Server-Side Table

```tsx
'use client';

import { useDataTable } from '@/hooks';
import { useQuery } from '@tanstack/react-query';
import { getServerSideTableParams } from '@/lib/table-utils';

export function ServerUsersTable() {
  const { table, pagination, sorting, columnFilters, globalFilter } = useDataTable({
    data: users?.data || [],
    columns,
    manualMode: true,
    totalRows: users?.total || 0,
    onPaginationChange: (newPagination) => {
      // Refetch will happen automatically via React Query
    },
  });

  // Fetch data from API
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', pagination, sorting, columnFilters, globalFilter],
    queryFn: async () => {
      const params = getServerSideTableParams(sorting, columnFilters, pagination, globalFilter);
      const response = await fetch(`/api/users?${new URLSearchParams(params)}`);
      return response.json();
    },
  });

  // ... render table
}
```

---

## useDataTable Hook

The `useDataTable` hook is a custom wrapper around `useReactTable` that provides:

- Unified state management
- Built-in pagination, sorting, and filtering
- Type-safe configuration
- Automatic server-side parameter handling
- Reset functions for all state

### Hook Signature

```tsx
function useDataTable<TData>(
  options: UseDataTableOptions<TData>
): UseDataTableResult<TData>
```

### Options

```tsx
interface UseDataTableOptions<TData> {
  // Required
  data: TData[];
  columns: ColumnDef<TData>[];

  // Server-side options
  manualMode?: boolean;
  totalRows?: number;
  pageCount?: number;

  // Initial state
  initialPageSize?: number;
  initialPageIndex?: number;
  initialSorting?: SortingState;
  initialColumnFilters?: ColumnFiltersState;
  initialGlobalFilter?: string;
  initialColumnVisibility?: VisibilityState;

  // Feature flags
  enablePagination?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGlobalFilter?: boolean;
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  enableColumnVisibility?: boolean;

  // Callbacks (for server-side tables)
  onPaginationChange?: (pagination: PaginationState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onGlobalFilterChange?: (filter: string) => void;
  onRowSelectionChange?: (selection: RowSelectionState) => void;

  // Loading/error states
  isLoading?: boolean;
  error?: Error | null;

  // Custom row ID
  getRowId?: (row: TData, index: number) => string;
}
```

### Return Value

```tsx
interface UseDataTableResult<TData> {
  // Table instance
  table: Table<TData>;

  // State
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;

  // State setters
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;

  // Loading/error
  isLoading: boolean;
  error: Error | null;

  // Computed values
  totalRows: number;
  pageCount: number;

  // Reset functions
  resetTableState: () => void;
  resetPagination: () => void;
  resetSorting: () => void;
  resetFilters: () => void;
  resetRowSelection: () => void;
}
```

---

## Table Utilities

### Column Helper

Creates type-safe column definitions:

```tsx
import { createColumnHelper } from '@/lib/table-utils';

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => info.getValue(),
  }),
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <ActionsMenu user={row.original} />,
  }),
];
```

### State Utilities

```tsx
import {
  getDefaultTableState,
  getDefaultPaginationState,
  getPaginationRange,
  getTotalPages,
} from '@/lib/table-utils';

// Get default table state
const initialState = getDefaultTableState({ pageSize: 25 });

// Get pagination info
const range = getPaginationRange(0, 10, 50);
console.log(`Showing ${range.start}-${range.end} of ${range.total}`);
// Output: "Showing 1-10 of 50"
```

### Server-Side Helpers

```tsx
import {
  handleServerSideSort,
  handleServerSideFilter,
  handleServerSidePagination,
  getServerSideTableParams,
} from '@/lib/table-utils';

// Individual handlers
const sortParams = handleServerSideSort(sorting);
// { sortBy: 'name', sortOrder: 'asc' }

const filterParams = handleServerSideFilter(columnFilters, globalFilter);
// { specialty: 'Cardiologia', search: 'João' }

const paginationParams = handleServerSidePagination(pagination);
// { page: 2, limit: 25 }

// Combined parameters
const allParams = getServerSideTableParams(
  sorting,
  columnFilters,
  pagination,
  globalFilter
);
// { page: 2, limit: 25, sortBy: 'name', sortOrder: 'asc', specialty: 'Cardiologia', search: 'João' }
```

### Debounce for Filtering

```tsx
import { debounce } from '@/lib/table-utils';

const debouncedFilter = debounce((value: string) => {
  table.setGlobalFilter(value);
}, 500);

<input onChange={(e) => debouncedFilter(e.target.value)} />
```

---

## Default Configuration

### Page Size Options

```tsx
import { DEFAULT_PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/config/table-config';

// [10, 25, 50, 100]
console.log(DEFAULT_PAGE_SIZE_OPTIONS);

// 10
console.log(DEFAULT_PAGE_SIZE);
```

### CSS Class Names

```tsx
import { TABLE_CLASS_NAMES } from '@/config/table-config';

<table className={TABLE_CLASS_NAMES.table}>
  <thead className={TABLE_CLASS_NAMES.header}>
    {/* ... */}
  </thead>
</table>
```

### ARIA Labels

```tsx
import { TABLE_ARIA_LABELS } from '@/config/table-config';

<table aria-label={TABLE_ARIA_LABELS.table}>
  <button aria-label={TABLE_ARIA_LABELS.nextPage}>Next</button>
</table>
```

### Empty State Messages

```tsx
import { TABLE_EMPTY_MESSAGES } from '@/config/table-config';

{table.getRowModel().rows.length === 0 && (
  <p>{TABLE_EMPTY_MESSAGES.noData}</p>
)}
```

### Configuration Helpers

```tsx
import {
  getDefaultTableOptions,
  getServerSideTableOptions,
  getClientSideTableOptions,
} from '@/config/table-config';

// For client-side tables
const table = useReactTable({
  ...getClientSideTableOptions<User>(),
  data,
  columns,
});

// For server-side tables
const table = useReactTable({
  ...getServerSideTableOptions<User>(),
  data,
  columns,
  pageCount,
});
```

---

## Usage Examples

### Example 1: Sortable Table

```tsx
const { table } = useDataTable({
  data: users,
  columns,
  enableSorting: true,
  initialSorting: [{ id: 'name', desc: false }],
});

// Render sortable header
<th onClick={header.column.getToggleSortingHandler()}>
  {header.column.columnDef.header}
  {header.column.getIsSorted() === 'asc' && ' ↑'}
  {header.column.getIsSorted() === 'desc' && ' ↓'}
</th>
```

### Example 2: Paginated Table

```tsx
const { table, pagination, totalRows, pageCount } = useDataTable({
  data: users,
  columns,
  enablePagination: true,
  initialPageSize: 25,
});

// Pagination controls
<div>
  <button
    onClick={() => table.previousPage()}
    disabled={!table.getCanPreviousPage()}
  >
    Previous
  </button>
  <span>
    Page {pagination.pageIndex + 1} of {pageCount}
  </span>
  <button
    onClick={() => table.nextPage()}
    disabled={!table.getCanNextPage()}
  >
    Next
  </button>
</div>
```

### Example 3: Filterable Table

```tsx
const { table, globalFilter, setGlobalFilter } = useDataTable({
  data: users,
  columns,
  enableGlobalFilter: true,
});

// Global search input
<input
  value={globalFilter}
  onChange={(e) => setGlobalFilter(e.target.value)}
  placeholder="Search..."
/>
```

### Example 4: Table with Row Selection

```tsx
const { table, rowSelection, resetRowSelection } = useDataTable({
  data: users,
  columns,
  enableRowSelection: true,
  enableMultiRowSelection: true,
  onRowSelectionChange: (selection) => {
    console.log('Selected rows:', Object.keys(selection));
  },
});

// Select all checkbox
<input
  type="checkbox"
  checked={table.getIsAllRowsSelected()}
  onChange={table.getToggleAllRowsSelectedHandler()}
/>

// Row checkbox
<input
  type="checkbox"
  checked={row.getIsSelected()}
  onChange={row.getToggleSelectedHandler()}
/>

// Clear selection
<button onClick={resetRowSelection}>Clear Selection</button>
```

### Example 5: Server-Side Table with React Query

```tsx
function ServerTable() {
  const { table, pagination, sorting, columnFilters, globalFilter } = useDataTable({
    data: queryResult?.data || [],
    columns,
    manualMode: true,
    totalRows: queryResult?.total || 0,
    isLoading: isQueryLoading,
    error: queryError,
  });

  const { data: queryResult, isLoading: isQueryLoading, error: queryError } = useQuery({
    queryKey: ['users', pagination, sorting, columnFilters, globalFilter],
    queryFn: async () => {
      const params = getServerSideTableParams(sorting, columnFilters, pagination, globalFilter);
      const response = await fetch(`/api/users?${new URLSearchParams(params)}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  if (table.isLoading) return <div>Loading...</div>;
  if (table.error) return <div>Error: {table.error.message}</div>;

  // Render table...
}
```

### Example 6: Custom Column with Actions

```tsx
const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button onClick={() => handleEdit(row.original)}>
          Edit
        </Button>
        <Button onClick={() => handleDelete(row.original)} variant="destructive">
          Delete
        </Button>
      </div>
    ),
  }),
];
```

---

## Best Practices

### 1. Use TypeScript Generics

Always provide type parameter for type safety:

```tsx
const { table } = useDataTable<User>({
  data: users,
  columns,
});
```

### 2. Memoize Column Definitions

Prevent unnecessary re-renders:

```tsx
const columns = useMemo<ColumnDef<User>[]>(
  () => [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('email', { header: 'Email' }),
  ],
  []
);
```

### 3. Debounce Filter Inputs

Reduce API calls during typing:

```tsx
const debouncedFilter = useMemo(
  () => debounce((value: string) => setGlobalFilter(value), 300),
  [setGlobalFilter]
);
```

### 4. Use Unique Row IDs

Provide stable row IDs for selection and updates:

```tsx
const { table } = useDataTable({
  data: users,
  columns,
  getRowId: (row) => row.id,
});
```

### 5. Reset State When Needed

Reset pagination when filters change:

```tsx
useEffect(() => {
  resetPagination();
}, [columnFilters, globalFilter, resetPagination]);
```

### 6. Handle Loading and Error States

Always display loading and error states:

```tsx
if (isLoading) return <TableSkeleton />;
if (error) return <ErrorMessage error={error} />;
if (!data.length) return <EmptyState />;
```

### 7. Use Server-Side Mode for Large Datasets

Switch to server-side when data exceeds ~1000 rows:

```tsx
const { table } = useDataTable({
  data: users,
  columns,
  manualMode: data.length > 1000,
  totalRows: data.length,
});
```

---

## API Reference

### Utility Functions

#### `createColumnHelper<TData>()`
Creates a type-safe column helper.

#### `getDefaultTableState(overrides?)`
Returns default table state with optional overrides.

#### `getDefaultPaginationState(overrides?)`
Returns default pagination state.

#### `getPaginationRange(pageIndex, pageSize, totalRows)`
Calculates display range (e.g., "1-10 of 100").

#### `getTotalPages(totalRows, pageSize)`
Calculates total number of pages.

#### `isValidPageIndex(pageIndex, totalRows, pageSize)`
Validates page index.

#### `handleServerSideSort(sorting)`
Converts sorting state to API parameters.

#### `handleServerSideFilter(columnFilters, globalFilter?)`
Converts filter state to API parameters.

#### `handleServerSidePagination(pagination)`
Converts pagination state to API parameters.

#### `getServerSideTableParams(sorting, columnFilters, pagination, globalFilter?)`
Combines all table state into API parameters.

#### `debounce<T>(func, wait?)`
Debounces function execution (default: 300ms).

### Configuration Constants

- `DEFAULT_PAGE_SIZE_OPTIONS`: `[10, 25, 50, 100]`
- `DEFAULT_PAGE_SIZE`: `10`
- `TABLE_CLASS_NAMES`: CSS class names object
- `TABLE_ARIA_LABELS`: ARIA labels object
- `TABLE_EMPTY_MESSAGES`: Empty state messages object
- `DEFAULT_FILTER_DEBOUNCE`: `300` (milliseconds)

### Configuration Functions

- `getDefaultTableOptions<TData>()`: Returns default table options
- `getServerSideTableOptions<TData>()`: Returns server-side options
- `getClientSideTableOptions<TData>()`: Returns client-side options
- `isValidPageSize(pageSize)`: Validates page size
- `getNextPageSize(currentSize)`: Gets next page size option
- `getPreviousPageSize(currentSize)`: Gets previous page size option

---

## Migration Guide

### From Other Table Libraries

If migrating from other table libraries (e.g., react-table v7, Material-UI Table):

1. **Install TanStack Table** (already done)
2. **Update imports**:
   ```tsx
   // Old (react-table v7)
   import { useTable, usePagination } from 'react-table';

   // New (TanStack Table v8)
   import { useDataTable } from '@/hooks';
   ```

3. **Update column definitions**:
   ```tsx
   // Old
   const columns = [{ Header: 'Name', accessor: 'name' }];

   // New
   const columnHelper = createColumnHelper<User>();
   const columns = [columnHelper.accessor('name', { header: 'Name' })];
   ```

4. **Use the hook**:
   ```tsx
   // Old
   const { rows, prepareRow } = useTable({ columns, data }, usePagination);

   // New
   const { table } = useDataTable({ data, columns });
   ```

5. **Update rendering**:
   ```tsx
   // Old
   {rows.map(row => {
     prepareRow(row);
     return <tr {...row.getRowProps()}>...</tr>;
   })}

   // New
   {table.getRowModel().rows.map(row => (
     <tr key={row.id}>...</tr>
   ))}
   ```

### Breaking Changes from v7 to v8

- `Header` → `header` (lowercase)
- `accessor` → `accessorKey` (for simple accessors)
- Hook composition removed (use single `useReactTable` or `useDataTable`)
- Manual pagination requires `pageCount` instead of `pageCount: Math.ceil(totalRows / pageSize)`

---

## Additional Resources

- [TanStack Table Documentation](https://tanstack.com/table/v8/docs/guide/introduction)
- [TanStack Table Examples](https://tanstack.com/table/v8/docs/examples/react/basic)
- [TypeScript Guide](https://tanstack.com/table/v8/docs/guide/typescript)
- [shadcn/ui Table Component](https://ui.shadcn.com/docs/components/table)

---

## Support

For questions or issues with table utilities:

1. Check this documentation
2. Review TanStack Table official docs
3. Check existing table implementations in the codebase
4. Ask the development team

---

**Last Updated**: 2025-12-17
**Version**: 1.0.0
**TanStack Table Version**: 8.21.3
