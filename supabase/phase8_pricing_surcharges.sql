-- ============================================
-- Certify.cx — Phase 8 Migration: Pricing Surcharges
-- ============================================
-- Run in the Supabase SQL Editor.
-- Idempotent (safe to re-run).
--
-- Background:
--   Pricing was flattened to a per-standard model:
--     - ISO 9001 / 14001 / 45001 → $799 (Standard) / $999 (Premium)
--     - All other standards     → $999 (Standard) / $1299 (Premium)
--
--   The base price assumes an organization with up to 10 employees at 1
--   location. Buyers can add cumulative 50-employee bands and additional
--   locations on the checkout page; each adds a flat $200.
--
-- This migration adds the persistent surcharge columns to applications.
-- Pricing logic lives in src/utils/pricing.js (computeTotal), shared
-- between the checkout UI and api/checkout.js.
-- ============================================


-- --------------------------------------------
-- 1. Add surcharge columns to applications
-- --------------------------------------------
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS additional_employee_bands integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS additional_locations      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount              numeric(10,2);

-- Sanity: surcharge counts must be non-negative.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'applications_additional_employee_bands_nonneg'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_additional_employee_bands_nonneg
      CHECK (additional_employee_bands >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'applications_additional_locations_nonneg'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_additional_locations_nonneg
      CHECK (additional_locations >= 0);
  END IF;
END $$;


-- --------------------------------------------
-- 2. Indexes — none needed.
-- --------------------------------------------
-- These columns are read alongside the application row by primary key,
-- never used as a filter or join key.


-- --------------------------------------------
-- 3. Notes
-- --------------------------------------------
-- The legacy country-tier pricing ($499 for developing countries) has
-- been removed from src/utils/pricing.js. No data migration is needed —
-- pricing is recomputed at checkout time from the standard + tier +
-- surcharges, and historical applications already have their charged
-- amount in Stripe.
