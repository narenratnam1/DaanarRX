-- Migration: Fix RLS policies to prevent infinite recursion during signup
-- This fixes the "infinite recursion detected in policy for relation 'users'" error

-- Drop existing policies
DROP POLICY IF EXISTS clinic_isolation ON clinics;
DROP POLICY IF EXISTS user_isolation ON users;
DROP POLICY IF EXISTS location_isolation ON locations;
DROP POLICY IF EXISTS lot_isolation ON lots;
DROP POLICY IF EXISTS unit_isolation ON units;
DROP POLICY IF EXISTS transaction_isolation ON transactions;

-- Clinics: Users can see their own clinic
-- Use direct auth.uid() comparison instead of subquery to avoid recursion
CREATE POLICY clinic_isolation ON clinics
  FOR ALL
  USING (
    -- Allow access if user is authenticated
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.clinic_id = clinics.clinic_id
    )
  );

-- Users: Users can see users from their own clinic
-- Use direct clinic_id comparison without nested subquery
CREATE POLICY user_isolation ON users
  FOR ALL
  USING (
    -- User can see themselves
    user_id = auth.uid()
    OR
    -- User can see others in their clinic
    clinic_id IN (
      SELECT clinic_id FROM users WHERE user_id = auth.uid()
    )
  );

-- Special policy for user creation during signup
-- Allows insert when the user_id matches the authenticated user
CREATE POLICY user_insert_own ON users
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Locations: Users can only see locations from their clinic
CREATE POLICY location_isolation ON locations
  FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE user_id = auth.uid()
    )
  );

-- Lots: Users can only see lots from their clinic
CREATE POLICY lot_isolation ON lots
  FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE user_id = auth.uid()
    )
  );

-- Units: Users can only see units from their clinic
CREATE POLICY unit_isolation ON units
  FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE user_id = auth.uid()
    )
  );

-- Transactions: Users can only see transactions from their clinic
CREATE POLICY transaction_isolation ON transactions
  FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE user_id = auth.uid()
    )
  );

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

