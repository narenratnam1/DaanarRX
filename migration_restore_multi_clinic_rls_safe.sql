-- Migration: Restore Multi-Clinic RLS Policies (Safe Version)
-- This migration fixes RLS policies to work with multi-clinic support
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL existing RLS policies on these tables
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on clinics table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'clinics'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON clinics', pol.policyname);
    END LOOP;

    -- Drop all policies on users table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;

    -- Drop all policies on locations table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'locations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON locations', pol.policyname);
    END LOOP;

    -- Drop all policies on lots table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'lots'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON lots', pol.policyname);
    END LOOP;

    -- Drop all policies on units table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'units'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON units', pol.policyname);
    END LOOP;

    -- Drop all policies on transactions table
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'transactions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON transactions', pol.policyname);
    END LOOP;
END $$;

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

-- Step 5: Verify policies were created successfully
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
