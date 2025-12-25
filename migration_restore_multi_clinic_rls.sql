-- Migration: Restore Multi-Clinic RLS Policies
-- This migration fixes RLS policies to work with multi-clinic support
-- Run this in your Supabase SQL Editor

-- Step 1: Drop old single-clinic RLS policies
DROP POLICY IF EXISTS clinic_isolation ON clinics;
DROP POLICY IF EXISTS user_isolation ON users;
DROP POLICY IF EXISTS user_multi_clinic_isolation ON users;
DROP POLICY IF EXISTS user_insert_own ON users;
DROP POLICY IF EXISTS clinic_multi_access ON clinics;
DROP POLICY IF EXISTS location_isolation ON locations;
-- Guard against typos / previous runs:
DROP POLICY IF EXISTS location_mualti_clinic_isolation ON locations;
DROP POLICY IF EXISTS location_multi_clinic_isolation ON locations;
DROP POLICY IF EXISTS lot_isolation ON lots;
DROP POLICY IF EXISTS lot_multi_clinic_isolation ON lots;
DROP POLICY IF EXISTS unit_isolation ON units;
DROP POLICY IF EXISTS unit_multi_clinic_isolation ON units;
DROP POLICY IF EXISTS transaction_isolation ON transactions;
DROP POLICY IF EXISTS transaction_multi_clinic_isolation ON transactions;

-- Step 2: Recreate multi-clinic RLS policies

-- Clinics: Users can see all clinics they belong to
CREATE POLICY clinic_multi_access ON clinics
  FOR ALL
  USING (
    clinic_id = ANY(
      SELECT UNNEST(clinic_ids)
      FROM users
      WHERE user_id = auth.uid()
    )
  );

-- Users: Users can see themselves and users in any clinic they share
CREATE POLICY user_multi_clinic_isolation ON users
  FOR ALL
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u1
      WHERE u1.user_id = auth.uid()
      AND u1.clinic_ids && users.clinic_ids
    )
  );

-- Special policy for user creation during signup
CREATE POLICY user_insert_own ON users
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Locations: Users can see locations from any clinic they belong to
CREATE POLICY location_multi_clinic_isolation ON locations
  FOR ALL
  USING (
    clinic_id = ANY(
      SELECT UNNEST(clinic_ids)
      FROM users
      WHERE user_id = auth.uid()
    )
  );

-- Lots: Users can see lots from any clinic they belong to
CREATE POLICY lot_multi_clinic_isolation ON lots
  FOR ALL
  USING (
    clinic_id = ANY(
      SELECT UNNEST(clinic_ids)
      FROM users
      WHERE user_id = auth.uid()
    )
  );

-- Units: Users can see units from any clinic they belong to
CREATE POLICY unit_multi_clinic_isolation ON units
  FOR ALL
  USING (
    clinic_id = ANY(
      SELECT UNNEST(clinic_ids)
      FROM users
      WHERE user_id = auth.uid()
    )
  );

-- Transactions: Users can see transactions from any clinic they belong to
CREATE POLICY transaction_multi_clinic_isolation ON transactions
  FOR ALL
  USING (
    clinic_id = ANY(
      SELECT UNNEST(clinic_ids)
      FROM users
      WHERE user_id = auth.uid()
    )
  );

-- Step 3: Verify all users have clinic_ids populated
-- Ensure existing users have their clinic_ids array populated
UPDATE users
SET clinic_ids = ARRAY[clinic_id]
WHERE clinic_id IS NOT NULL
  AND (clinic_ids IS NULL OR clinic_ids = '{}' OR NOT (clinic_ids @> ARRAY[clinic_id]));

-- Ensure active_clinic_id is set for all users
UPDATE users
SET active_clinic_id = clinic_id
WHERE active_clinic_id IS NULL AND clinic_id IS NOT NULL;

-- Step 4: Verify all clinics have user_ids populated
UPDATE clinics c
SET user_ids = (
  SELECT ARRAY_AGG(DISTINCT u.user_id)
  FROM users u
  WHERE c.clinic_id = ANY(u.clinic_ids)
)
WHERE user_ids IS NULL OR user_ids = '{}';

-- Step 5: Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clinics', 'users', 'locations', 'lots', 'units', 'transactions')
ORDER BY tablename, policyname;
