# Supabase Query Functions

This directory contains reusable database query functions for Supabase.

## Overview

These functions provide typed, optimized database queries with proper Row Level Security (RLS) enforcement. They are designed to avoid N+1 query problems by using efficient JOINs and batch operations.

## Available Functions

### Medical Staff Queries

#### `getMedicalStaffById(supabase, staffId, organizationId)`

Fetches comprehensive medical staff details by ID, including all related data.

**Features:**
- Single optimized query with nested selects
- Organization-based RLS filtering
- Includes specialty, profession, facilities, and recent shifts
- Returns null for non-existent or unauthorized access

**Returns:**
```typescript
MedicalStaffDetailView | null
```

**Example:**
```typescript
import { supabase } from '@/lib/supabase';
import { getMedicalStaffById } from '@/lib/supabase/medical-staff-queries';

const staffDetails = await getMedicalStaffById(
  supabase,
  'staff-uuid-here',
  'org-uuid-here'
);

if (staffDetails) {
  console.log('Name:', staffDetails.name);
  console.log('Specialty:', staffDetails.especialidade?.nome);
  console.log('Facilities:', staffDetails.facilities.length);
  console.log('Recent Shifts:', staffDetails.recentShifts.length);
}
```

**Data Structure:**

The returned `MedicalStaffDetailView` includes:

- **Personal Information**: name, email, phone, CPF, color, avatar
- **Professional Registration**: CRM (legacy), registro_numero, registro_uf, registro_categoria
- **Specialty**: Full `Especialidade` object with id and nome
- **Profession**: Full `ProfissaoComConselho` object with nested conselho data
- **Facilities**: Array of facilities where the staff member has worked (derived from shifts)
- **Recent Shifts**: Last 10 shifts with facility information
- **Organizations**: All organizations this staff member belongs to
- **Metadata**: created_at, updated_at timestamps

#### `getMedicalStaffByIds(supabase, staffIds, organizationId)`

Fetches medical staff details for multiple staff members in batch.

**Features:**
- Parallel queries for multiple staff IDs
- Filters out inaccessible staff members (RLS enforcement)
- Returns only staff members the user has access to

**Returns:**
```typescript
MedicalStaffDetailView[]
```

**Example:**
```typescript
import { getMedicalStaffByIds } from '@/lib/supabase/medical-staff-queries';

const staffList = await getMedicalStaffByIds(
  supabase,
  ['uuid-1', 'uuid-2', 'uuid-3'],
  'org-uuid-here'
);

console.log(`Found ${staffList.length} staff members`);
staffList.forEach(staff => {
  console.log(`- ${staff.name} (${staff.especialidade?.nome})`);
});
```

## Query Optimization

### N+1 Problem Prevention

All queries in this directory are designed to avoid the N+1 query problem:

- **Single Query Approach**: Uses nested selects to fetch related data in one query
- **Batch Operations**: Functions like `getMedicalStaffByIds` use `Promise.all` for parallel execution
- **Limited Data**: Recent shifts limited to 10 to prevent excessive data fetching

### Performance Considerations

- Shift history is limited to the most recent 10 shifts
- Facilities are extracted from shifts (up to 50 most recent) to avoid separate queries
- Unique facilities are deduplicated in-memory

## Row Level Security (RLS)

All queries respect Supabase Row Level Security policies:

- **Organization Boundaries**: Queries verify the staff member belongs to the requested organization
- **Automatic Filtering**: RLS policies automatically filter data based on user permissions
- **Access Control**: Returns `null` if user doesn't have access to the requested organization

## TypeScript Types

All functions use strict TypeScript types from:

- `@/lib/database.types.ts` - Generated Supabase database types
- `@medsync/shared` - Shared type definitions

### MedicalStaffDetailView

```typescript
interface MedicalStaffDetailView {
  // Personal Information
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  active: boolean | null;
  color: string | null;
  avatar_url: string | null;

  // Professional Registration
  crm: string | null;
  registro_numero: string | null;
  registro_categoria: string | null;
  registro_uf: string | null;

  // Related Data
  especialidade: Especialidade | null;
  profissao: ProfissaoComConselho | null;
  facilities: Array<Facility>;
  recentShifts: Array<Shift>;
  organizations: Array<StaffOrganization>;

  // Metadata
  created_at: string | null;
  updated_at: string | null;
}
```

## Error Handling

All functions include comprehensive error handling:

- Database errors are logged to console and return `null`
- Unauthorized access returns `null` (not an error)
- Invalid IDs return `null` gracefully

## Testing

Unit tests are available in `__tests__/medical-staff-queries.test.ts`:

- ✅ Successful queries with complete data
- ✅ Handling missing specialty/profession
- ✅ Recent shifts limiting (10 max)
- ✅ Organization boundary enforcement
- ✅ Multi-organization staff access
- ✅ Error handling for non-existent staff
- ✅ Database connection failures
- ✅ Batch queries with inaccessible staff filtering

Run tests:
```bash
pnpm test src/lib/supabase/__tests__/medical-staff-queries.test.ts
```

## Best Practices

1. **Always provide organizationId**: Required for RLS enforcement
2. **Handle null returns**: Check if result is null before accessing properties
3. **Use batch functions for multiple IDs**: More efficient than sequential calls
4. **Limit shift history**: Default limit is 10, adjust if needed for performance
5. **Type safety**: Always use TypeScript types for query results

## Future Enhancements

Potential improvements:

- [ ] Add pagination support for shifts
- [ ] Add filtering options for facilities and shifts
- [ ] Add caching layer with React Query
- [ ] Add performance metrics tracking
- [ ] Add specialized queries for specific use cases (e.g., getStaffBySpecialty)
