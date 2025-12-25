-- Add patient_name column to transactions table
-- This migration adds the missing patient_name column that is used in the application

-- Add patient_name column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255);

-- Create index for faster search by patient name
CREATE INDEX IF NOT EXISTS idx_transactions_patient_name 
ON public.transactions(patient_name);

-- Add comment to document the column
COMMENT ON COLUMN public.transactions.patient_name IS 'Name of the patient receiving the medication (for check_out transactions)';

