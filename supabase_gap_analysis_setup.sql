-- =====================================================================
-- Gap Analysis Score — migration
-- =====================================================================
-- Adds the `gap_analysis_score` column to the `profiles` table so the
-- client-side quiz score persists across sessions.
--
-- Run this once in the Supabase SQL editor.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gap_analysis_score INTEGER
  CHECK (gap_analysis_score IS NULL OR (gap_analysis_score >= 0 AND gap_analysis_score <= 100));
