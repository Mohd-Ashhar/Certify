-- ============================================
-- Certify.cx — Phase 1 Migration
-- ============================================
-- Run in the Supabase SQL Editor.
--
-- Covers:
--  1. Countries linked to Regions (master list + region_id column).
--  2. Per-standard CB pricing (cb_standard_pricing table).
--  3. CB Accreditation Schedule documents (cb_documents table + storage).
--  4. Admin uploads on application documents (uploaded_by column on documents).
-- ============================================


-- --------------------------------------------
-- 1. Countries ↔ Regions
-- --------------------------------------------
-- Add region_id (text code matching REGIONS in src/utils/roles.js).
-- Keep it nullable initially so existing rows survive; admin UI will backfill.

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS region_id TEXT
    CHECK (region_id IS NULL OR region_id IN (
      'asia','africa','europe','north_america','south_america'
    ));

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS iso_code TEXT;

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_countries_region_id ON public.countries(region_id);


-- --------------------------------------------
-- 2. Per-standard CB pricing
-- --------------------------------------------
-- Replaces the flat initial_price/surveillance_price/recertification_price on
-- certification_bodies. Those columns stay for now (non-breaking) but the UI
-- reads/writes this table.

CREATE TABLE IF NOT EXISTS public.cb_standard_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cb_id UUID NOT NULL REFERENCES public.certification_bodies(id) ON DELETE CASCADE,
  iso_standard TEXT NOT NULL,
  initial_price NUMERIC,
  surveillance_price NUMERIC,
  recertification_price NUMERIC,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT cb_standard_pricing_unique UNIQUE (cb_id, iso_standard)
);

CREATE INDEX IF NOT EXISTS idx_cb_pricing_cb_id ON public.cb_standard_pricing(cb_id);


-- --------------------------------------------
-- 3. CB Accreditation Schedule documents
-- --------------------------------------------
-- Files live in the `cb-documents` storage bucket at path: {cb_id}/{doc_id}

CREATE TABLE IF NOT EXISTS public.cb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cb_id UUID NOT NULL REFERENCES public.certification_bodies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size TEXT,
  document_type TEXT DEFAULT 'accreditation_schedule'
    CHECK (document_type IN ('accreditation_schedule','certificate','other')),
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cb_documents_cb_id ON public.cb_documents(cb_id);


-- --------------------------------------------
-- 4. Applications documents: who uploaded
-- --------------------------------------------
-- Tracks admin uploads so client-vs-admin uploads can be distinguished.

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS uploader_role TEXT
    CHECK (uploader_role IS NULL OR uploader_role IN (
      'client','super_admin','regional_admin','auditor','certification_body'
    ));


-- --------------------------------------------
-- 5. Storage buckets
-- --------------------------------------------
-- Run these in the Supabase dashboard → Storage, or via the API:
--   - Create bucket `cb-documents` (private).
--   - Policies: let authenticated users with role super_admin/regional_admin
--     upload, read, delete. Anyone with access to the CB row can download.
-- Example policy for cb-documents bucket (SELECT/INSERT/UPDATE/DELETE):
--
-- CREATE POLICY "cb_docs_admin_all" ON storage.objects
--   FOR ALL
--   USING (
--     bucket_id = 'cb-documents' AND
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.id = auth.uid()
--         AND profiles.role IN ('super_admin','regional_admin')
--     )
--   );


-- --------------------------------------------
-- 6. Backfill helper (optional)
-- --------------------------------------------
-- Populate region_id for existing countries using a lookup. Run once after
-- adding the column; adjust as needed.
--
-- UPDATE public.countries SET region_id = 'asia'
--   WHERE lower(name) IN ('india','china','japan','singapore','uae','saudi arabia');
-- UPDATE public.countries SET region_id = 'europe'
--   WHERE lower(name) IN ('united kingdom','germany','france','spain','italy');
-- ... (etc — or use the AdminCountries UI to set region per country)
