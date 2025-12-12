-- Migration: Add is_migrated flag to facility_addresses table
-- Date: 2025-12-12
-- Description: Adds a boolean field to track whether an address was auto-migrated
--              from legacy text data or manually entered by users.
--              Auto-migrated addresses can be identified and potentially reviewed/updated later.

-- Add is_migrated column to facility_addresses table
ALTER TABLE facility_addresses
ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT false NOT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN facility_addresses.is_migrated IS 'Indicates whether this address was auto-migrated from legacy text data (true) or manually entered/updated by users (false). Auto-migrated addresses may need review.';

-- Create an index for quick filtering of migrated vs user-entered addresses
CREATE INDEX IF NOT EXISTS idx_facility_addresses_is_migrated
ON facility_addresses(is_migrated);

-- Optional: Update existing addresses to set is_migrated = false
-- (addresses created manually before migration should be marked as user-entered)
UPDATE facility_addresses
SET is_migrated = false
WHERE is_migrated IS NULL;
