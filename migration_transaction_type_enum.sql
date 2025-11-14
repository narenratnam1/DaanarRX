-- Migration: Update transaction type values to use underscores
-- This migration updates existing 'check in' and 'check out' values to 'check_in' and 'check_out'
-- and updates the CHECK constraint to enforce the new enum values

-- Step 1: Drop the old constraint FIRST (before updating data)
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Step 2: Update existing data
UPDATE transactions 
SET type = 'check_in' 
WHERE type = 'check in';

UPDATE transactions 
SET type = 'check_out' 
WHERE type = 'check out';

-- Step 3: Add the new constraint with underscores
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('adjust', 'check_out', 'check_in'));

-- Verify the migration
SELECT DISTINCT type FROM transactions;

