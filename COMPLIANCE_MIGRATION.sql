-- FDA Compliance Migration: Add Manufacturer Lot Number Tracking
-- Required by FDA for recall tracking and PDMA compliance
-- Execute this migration before deploying updated code

-- Add manufacturer_lot_number column to units table
ALTER TABLE units
ADD COLUMN IF NOT EXISTS manufacturer_lot_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN units.manufacturer_lot_number IS 'FDA Required: Pharmaceutical manufacturer lot number for tracking distribution and facilitating recalls. Distinct from lot.source which is the donation source.';

-- Create index for recall lookups
CREATE INDEX IF NOT EXISTS idx_units_manufacturer_lot_number
ON units(manufacturer_lot_number)
WHERE manufacturer_lot_number IS NOT NULL;

-- Verify migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'units'
AND column_name = 'manufacturer_lot_number';
