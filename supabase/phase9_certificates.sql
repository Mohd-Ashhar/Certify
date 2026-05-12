-- ============================================
-- Certify.cx — Phase 9 Migration: Certificates
-- ============================================
-- Run in the Supabase SQL Editor.
-- Idempotent (safe to re-run).
--
-- Background:
--   Until now, "certification" was just an application status of
--   `approved`. Clients saw a congratulations message but had no
--   downloadable artifact. This migration introduces real PDF
--   certificates issued automatically when a CB approves an application.
--
-- Architecture:
--   - Each row in `public.certificates` represents one issued certificate.
--   - The PDF itself lives in the private `certificates` storage bucket;
--     `storage_path` is its key.
--   - RLS scopes reads to the owning client and to staff (admin / CB /
--     auditor) who already have visibility into the parent application.
--   - api/issue-certificate.js inserts a row and uploads the PDF.
--     A unique constraint on application_id keeps issuance idempotent —
--     calling the endpoint twice returns the same record.
-- ============================================


-- --------------------------------------------
-- 1. Certificates table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id     uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  iso_standard       text NOT NULL,
  certificate_number text NOT NULL UNIQUE,
  company_name       text NOT NULL,
  issued_at          timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL,
  storage_path       text NOT NULL,
  status             text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'revoked', 'expired')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- One certificate per application keeps issuance idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS certificates_application_id_uniq
  ON public.certificates (application_id);

CREATE INDEX IF NOT EXISTS certificates_client_id_idx
  ON public.certificates (client_id);


-- --------------------------------------------
-- 2. updated_at trigger
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.set_certificates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS certificates_set_updated_at ON public.certificates;
CREATE TRIGGER certificates_set_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_certificates_updated_at();


-- --------------------------------------------
-- 3. RLS — clients see their own; staff sees all
-- --------------------------------------------
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificates_client_select"        ON public.certificates;
DROP POLICY IF EXISTS "certificates_staff_select"         ON public.certificates;
DROP POLICY IF EXISTS "certificates_service_role_all"     ON public.certificates;

-- Client can read their own certificates.
CREATE POLICY "certificates_client_select"
  ON public.certificates
  FOR SELECT
  USING (client_id = auth.uid());

-- Staff (super_admin / regional_admin / certification_body / auditor)
-- can read all certificates. Regional scoping is enforced at the
-- application level when staff opens individual records.
CREATE POLICY "certificates_staff_select"
  ON public.certificates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'regional_admin', 'certification_body', 'auditor')
    )
  );

-- The api/issue-certificate.js handler uses the service-role key, which
-- bypasses RLS — no INSERT/UPDATE policy needed for the happy path.


-- --------------------------------------------
-- 4. Private storage bucket
-- --------------------------------------------
-- Create the bucket if it doesn't exist. PDFs are served via signed URLs
-- minted by api/issue-certificate.js / api/get-certificate-url.js, so the
-- bucket itself stays private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Direct object-read policy for clients (fallback path; the app uses
-- signed URLs in practice). Paths are conventionally
-- "<client_id>/<application_id>.pdf" so clients can read only their
-- own folder.
DROP POLICY IF EXISTS "certificates_storage_client_read" ON storage.objects;
CREATE POLICY "certificates_storage_client_read"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "certificates_storage_staff_read" ON storage.objects;
CREATE POLICY "certificates_storage_staff_read"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'regional_admin', 'certification_body', 'auditor')
    )
  );


-- --------------------------------------------
-- 5. Notes
-- --------------------------------------------
-- Issuance is service-role only (api/issue-certificate.js). No client or
-- staff-level INSERT policy is needed.
--
-- Default expiry = issued_at + 3 years, set by the handler (not the DB)
-- so the policy can evolve without a migration.
