-- Database Verification Script for DaanarRX
-- Run this in Supabase SQL Editor to verify database structure

-- ============================================
-- 1. CHECK ALL TABLES EXIST
-- ============================================
SELECT
  'Tables Check' as check_type,
  table_name,
  CASE
    WHEN table_name IN ('clinics', 'users', 'locations', 'lots', 'drugs', 'units', 'transactions', 'invitations', 'feedback')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. CHECK MULTI-CLINIC COLUMNS EXIST
-- ============================================
SELECT
  'Multi-Clinic Columns' as check_type,
  column_name,
  data_type,
  table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'users' AND column_name IN ('clinic_ids', 'active_clinic_id'))
    OR (table_name = 'clinics' AND column_name = 'user_ids')
  )
ORDER BY table_name, column_name;

-- ============================================
-- 3. CHECK RLS POLICIES
-- ============================================
SELECT
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 4. CHECK INDEXES (Performance Critical)
-- ============================================
SELECT
  'Indexes' as check_type,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('units', 'transactions', 'lots', 'locations', 'drugs', 'users', 'clinics')
ORDER BY tablename, indexname;

-- ============================================
-- 5. CHECK FOREIGN KEY CONSTRAINTS
-- ============================================
SELECT
  'Foreign Keys' as check_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 6. CHECK REQUIRED INDEXES FOR ADVANCED QUERYING
-- ============================================
-- This will show if we need to create new indexes for performance
SELECT
  'Missing Indexes Check' as check_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'units' AND indexname LIKE '%expiry%clinic%')
    THEN '✓ units(expiry_date, clinic_id) index exists'
    ELSE '✗ MISSING: CREATE INDEX idx_units_expiry_clinic ON units(expiry_date, clinic_id);'
  END as expiry_clinic_index,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'units' AND indexname LIKE '%drug%clinic%')
    THEN '✓ units(drug_id, clinic_id) index exists'
    ELSE '✗ MISSING: CREATE INDEX idx_units_drug_clinic ON units(drug_id, clinic_id);'
  END as drug_clinic_index,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'transactions' AND indexname LIKE '%timestamp%')
    THEN '✓ transactions(timestamp) index exists'
    ELSE '✗ MISSING: CREATE INDEX idx_transactions_timestamp_desc ON transactions(timestamp DESC);'
  END as transaction_timestamp_index;

-- ============================================
-- 7. CHECK DATA INTEGRITY
-- ============================================
-- Count records per table
SELECT 'Data Counts' as check_type, 'clinics' as table_name, COUNT(*) as count FROM clinics
UNION ALL
SELECT 'Data Counts', 'users', COUNT(*) FROM users
UNION ALL
SELECT 'Data Counts', 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'Data Counts', 'lots', COUNT(*) FROM lots
UNION ALL
SELECT 'Data Counts', 'drugs', COUNT(*) FROM drugs
UNION ALL
SELECT 'Data Counts', 'units', COUNT(*) FROM units
UNION ALL
SELECT 'Data Counts', 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Data Counts', 'invitations', COUNT(*) FROM invitations;

-- ============================================
-- 8. CHECK MULTI-CLINIC DATA INTEGRITY
-- ============================================
-- Verify all users have clinic_ids populated
SELECT
  'Multi-Clinic Data Integrity' as check_type,
  'Users without clinic_ids' as issue,
  COUNT(*) as count
FROM users
WHERE clinic_ids IS NULL OR clinic_ids = '{}';

-- Verify all clinics have user_ids populated
SELECT
  'Multi-Clinic Data Integrity' as check_type,
  'Clinics without user_ids' as issue,
  COUNT(*) as count
FROM clinics
WHERE user_ids IS NULL OR user_ids = '{}';

-- ============================================
-- 9. CHECK RLS IS ENABLED
-- ============================================
SELECT
  'RLS Status' as check_type,
  tablename,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('clinics', 'users', 'locations', 'lots', 'drugs', 'units', 'transactions', 'invitations')
ORDER BY tablename;

-- ============================================
-- 10. CHECK HELPER FUNCTIONS EXIST
-- ============================================
SELECT
  'Helper Functions' as check_type,
  routine_name as function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('add_user_to_clinic', 'remove_user_from_clinic', 'switch_active_clinic', 'get_user_clinics')
ORDER BY routine_name;
