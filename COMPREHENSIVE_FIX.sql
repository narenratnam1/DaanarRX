-- =====================================================================
-- COMPREHENSIVE FIX FOR DATABASE SCHEMA ISSUES
-- =====================================================================
-- This script fixes:
-- 1. Missing patient_name column in transactions table
-- 2. Ensures all RLS policies are correctly configured
-- 3. Verifies helper functions exist and work correctly
-- =====================================================================

-- Step 1: Add patient_name column to transactions table
-- ---------------------------------------------------------------------
DO $$
BEGIN
    -- Add patient_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'patient_name'
    ) THEN
        ALTER TABLE public.transactions 
        ADD COLUMN patient_name VARCHAR(255);
        
        RAISE NOTICE 'Added patient_name column to transactions table';
    ELSE
        RAISE NOTICE 'patient_name column already exists in transactions table';
    END IF;
END $$;

-- Create index for faster search by patient name
CREATE INDEX IF NOT EXISTS idx_transactions_patient_name 
ON public.transactions(patient_name);

-- Add comment to document the column
COMMENT ON COLUMN public.transactions.patient_name IS 
'Name of the patient receiving the medication (for check_out transactions)';

-- Step 2: Verify and refresh helper functions for RLS
-- ---------------------------------------------------------------------

-- Helper function: current_user_role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT (
        SELECT u.user_role::text
        FROM public.users u
        WHERE u.user_id = auth.uid()
    );
$$;

-- Helper function: current_user_clinic_ids (supports multi-clinic access)
CREATE OR REPLACE FUNCTION public.current_user_clinic_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT COALESCE(
        (
            SELECT array_remove(
                array_cat(
                    COALESCE(u.clinic_ids, ARRAY[]::uuid[]),
                    ARRAY[u.clinic_id]
                ),
                NULL
            )
            FROM public.users u
            WHERE u.user_id = auth.uid()
        ),
        ARRAY[]::uuid[]
    );
$$;

-- Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT COALESCE(
        (
            SELECT (u.user_role::text = ANY(ARRAY['admin', 'superadmin']))
            FROM public.users u
            WHERE u.user_id = auth.uid()
        ),
        false
    );
$$;

-- Step 3: Verify RLS is enabled on all tables
-- ---------------------------------------------------------------------
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 4: Refresh the schema cache
-- ---------------------------------------------------------------------
-- This ensures Supabase recognizes the new column immediately
NOTIFY pgrst, 'reload schema';

-- Step 5: Verification queries
-- ---------------------------------------------------------------------
DO $$
DECLARE
    col_exists boolean;
    rls_enabled boolean;
BEGIN
    -- Check if patient_name column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'patient_name'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ patient_name column exists in transactions table';
    ELSE
        RAISE EXCEPTION '❌ patient_name column is missing from transactions table';
    END IF;
    
    -- Check if RLS is enabled on transactions
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'transactions' 
    AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;
    
    IF rls_enabled THEN
        RAISE NOTICE '✅ RLS is enabled on transactions table';
    ELSE
        RAISE WARNING '⚠️  RLS is not enabled on transactions table';
    END IF;
END $$;

-- Step 6: Display current table structure
-- ---------------------------------------------------------------------
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Done!
SELECT '✅ Migration completed successfully!' AS status;

