-- Performance Indexes for Advanced Querying
-- These indexes optimize filtering by expiry, location, dosage, and medication
-- Run this in Supabase SQL Editor

-- ============================================
-- PERFORMANCE INDEXES FOR UNITS TABLE
-- ============================================

-- Index for expiry date filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_units_expiry_clinic ON units(expiry_date, clinic_id);

-- Index for drug-based queries (medication filtering)
CREATE INDEX IF NOT EXISTS idx_units_drug_clinic ON units(drug_id, clinic_id);

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_units_location_clinic ON units(lot_id, clinic_id);

-- Index for available quantity queries (low stock alerts)
CREATE INDEX IF NOT EXISTS idx_units_available_qty ON units(available_quantity) WHERE available_quantity > 0;

-- Composite index for expiry and location filtering
CREATE INDEX IF NOT EXISTS idx_units_expiry_location ON units(expiry_date, lot_id, clinic_id);

-- ============================================
-- PERFORMANCE INDEXES FOR TRANSACTIONS TABLE
-- ============================================

-- Index for transaction timestamp (recent activity)
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp_desc ON transactions(timestamp DESC, clinic_id);

-- Index for transaction type filtering
CREATE INDEX IF NOT EXISTS idx_transactions_type_clinic ON transactions(type, clinic_id, timestamp DESC);

-- ============================================
-- PERFORMANCE INDEXES FOR LOTS TABLE
-- ============================================

-- Index for lot location lookup
CREATE INDEX IF NOT EXISTS idx_lots_location_clinic ON lots(location_id, clinic_id);

-- ============================================
-- PERFORMANCE INDEXES FOR DRUGS TABLE
-- ============================================

-- Index for medication name search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_drugs_medication_name_gin ON drugs USING gin(to_tsvector('english', medication_name));

-- Index for generic name search
CREATE INDEX IF NOT EXISTS idx_drugs_generic_name_gin ON drugs USING gin(to_tsvector('english', generic_name));

-- Index for strength filtering
CREATE INDEX IF NOT EXISTS idx_drugs_strength ON drugs(strength, strength_unit);

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
