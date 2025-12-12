# Database Migrations

This directory contains SQL migration scripts for the MedSync application.

## Facility Address Migration

### Overview

The facility address migration script (`20251212_add_is_migrated_to_facility_addresses.sql`) adds support for tracking auto-migrated addresses in the `facility_addresses` table.

### Running the Migration

#### 1. Apply SQL Schema Changes

Run the SQL migration file on your Supabase database:

```sql
-- Execute in Supabase SQL Editor or via CLI
psql $DATABASE_URL -f migrations/20251212_add_is_migrated_to_facility_addresses.sql
```

Or manually execute the SQL in Supabase Dashboard > SQL Editor.

#### 2. Migrate Existing Facility Data

After applying the SQL migration, use the API endpoint to migrate existing facilities:

**Check migration status (dry run):**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/admin/migrate-addresses?dry_run=true"
```

**Get migration statistics:**
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/admin/migrate-addresses"
```

**Execute migration:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/admin/migrate-addresses"
```

### Migration Behavior

The migration script will:

1. **Find facilities without addresses**: Queries all facilities that don't have a record in `facility_addresses`
2. **Parse legacy address text**: Attempts to extract structured data from the old `address` text field
3. **Create structured addresses**: Creates `facility_addresses` records with:
   - Parsed street, number, neighborhood, city, state, postal_code
   - Default Brazil center coordinates (-14.235, -51.9253) for latitude/longitude
   - `is_migrated = true` flag to mark as auto-migrated
4. **Handle edge cases**:
   - Empty addresses get default placeholder values
   - Unparseable addresses use fallback values
   - Already migrated facilities are skipped (idempotent)
5. **Log all operations**: Detailed logs track successes, failures, and warnings

### Default Values

For facilities with missing or unparseable address data:

- **Street**: "Endereço não informado"
- **Number**: "S/N" (sem número)
- **Neighborhood**: "Centro"
- **City**: "Não informado"
- **State**: "SP"
- **Postal Code**: "00000-000"
- **Country**: "Brasil"
- **Coordinates**: Brazil center (-14.235, -51.9253)

### Address Parsing

The migration attempts to parse common Brazilian address formats:

- `"Rua ABC, 123, Bairro, Cidade - SP, 12345-678"`
- `"Av. XYZ, 456 - Complemento, Bairro, Cidade/SP"`
- Simple text addresses

Extracted components:
- CEP (postal code): Pattern `\d{5}-?\d{3}`
- State: Two uppercase letters matching Brazilian states
- City: Text before state separator
- Street/Number: First comma-separated segment
- Neighborhood: Third segment (if available)

### Migration Flags

The `is_migrated` flag allows you to:

1. **Identify auto-migrated addresses**: Filter addresses that need review
2. **Distinguish from user-entered data**: User-created addresses have `is_migrated = false`
3. **Audit migration results**: Query migrated addresses for quality checks

### Example Queries

**Find all migrated addresses:**
```sql
SELECT f.name, fa.*
FROM facility_addresses fa
JOIN facilities f ON f.id = fa.facility_id
WHERE fa.is_migrated = true;
```

**Find migrated addresses with default values (need review):**
```sql
SELECT f.name, fa.*
FROM facility_addresses fa
JOIN facilities f ON f.id = fa.facility_id
WHERE fa.is_migrated = true
  AND fa.street = 'Endereço não informado';
```

**Count migrated vs user-entered addresses:**
```sql
SELECT
  is_migrated,
  COUNT(*) as count
FROM facility_addresses
GROUP BY is_migrated;
```

### Rollback

To rollback the schema changes (not the data migration):

```sql
DROP INDEX IF EXISTS idx_facility_addresses_is_migrated;
ALTER TABLE facility_addresses DROP COLUMN IF EXISTS is_migrated;
```

**Note**: Rollback will not delete migrated address records. To remove migrated addresses:

```sql
DELETE FROM facility_addresses WHERE is_migrated = true;
```

### Safety Features

- **Idempotent**: Safe to run multiple times (skips existing addresses)
- **Non-destructive**: Doesn't modify or delete existing data
- **Dry run mode**: Preview migration without making changes
- **Comprehensive logging**: All operations tracked with timestamps
- **Error handling**: Individual failures don't stop entire migration
- **Authentication required**: API endpoint requires valid user token

### Monitoring

The migration API returns detailed results:

```json
{
  "mode": "migration_executed",
  "message": "Migration completed successfully",
  "result": {
    "success": true,
    "totalProcessed": 150,
    "successCount": 148,
    "failureCount": 2,
    "warningCount": 5,
    "startTime": "2025-12-12T20:00:00.000Z",
    "endTime": "2025-12-12T20:00:15.000Z",
    "duration": 15000,
    "logs": [...],
    "errors": [...]
  }
}
```

### Post-Migration

After migration:

1. Review migrated addresses with default values
2. Encourage users to update auto-migrated addresses
3. Consider adding UI indicator for `is_migrated = true` addresses
4. Run data quality checks on parsed addresses

### Troubleshooting

**Migration fails with authentication error:**
- Ensure you're passing a valid Bearer token
- Token must belong to an authenticated user

**Some addresses not migrated:**
- Check the error logs in the API response
- Common issues: database connection, permission errors
- Re-run migration (it's idempotent)

**Parsed addresses look wrong:**
- The parser handles common formats but may not catch all variations
- Review migrated addresses and update manually as needed
- Consider improving `parseAddressText()` function for specific patterns

**Migration times out:**
- For large databases (>1000 facilities), consider batch processing
- Run during low-traffic periods
- Monitor server resources

### Support

For issues or questions:
1. Check migration logs in API response
2. Review Supabase database logs
3. Check application server logs
4. Contact development team
