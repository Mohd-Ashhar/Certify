-- ============================================
-- Certify.cx — Phase 7 Migration: Payment-First Onboarding Flow
-- ============================================
-- Run in the Supabase SQL Editor.
-- Idempotent (safe to re-run).
--
-- Background:
--   The ISO 9001 onboarding flow was reordered from
--     Select → Apply (detailed form) → Pay
--   to
--     Select → Pay → Apply (detailed form)
--
--   A stub `applications` row is now created BEFORE Stripe checkout
--   (carrying only client_id + selected_package + recommended_iso +
--   status='awaiting_registration'). After successful payment, the
--   client lands on /client/apply/:applicationId which UPDATEs the
--   stub with full company info and flips status to 'pending'.
--
-- This migration relaxes the NOT NULL constraints on the heavy
-- registration fields so the stub row is valid.
-- ============================================


-- --------------------------------------------
-- 1. Relax NOT NULL on heavy registration fields
-- --------------------------------------------
-- These are filled in AFTER payment (via ApplicationForm UPDATE mode).
-- employee_count and locations_count are already nullable.
ALTER TABLE public.applications
  ALTER COLUMN company_name DROP NOT NULL;

ALTER TABLE public.applications
  ALTER COLUMN industry DROP NOT NULL;

ALTER TABLE public.applications
  ALTER COLUMN scope DROP NOT NULL;


-- --------------------------------------------
-- 2. Notes
-- --------------------------------------------
-- The `status` column has no CHECK constraint at the DB level
-- (only the application enforces the lifecycle), so the new value
-- 'awaiting_registration' is accepted without further schema change.
--
-- Lifecycle after this migration:
--   awaiting_registration  -- paid, stub row, no company info yet
--     ↓ (post-payment UPDATE via ApplicationForm)
--   pending  -- registration submitted, awaiting admin recommendation
--     ↓ → audit_scheduled → in_review → approved | rejected
