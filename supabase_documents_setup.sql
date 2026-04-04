-- ============================================
-- Certify.cx — Documents Table + Storage Setup
-- ============================================
-- Run this in Supabase SQL Editor to create the
-- documents table, RLS policies, and storage bucket.
-- ============================================

-- 1. Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size TEXT,
  document_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Clients can INSERT documents for their own applications
CREATE POLICY "Clients can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Clients can SELECT their own documents
CREATE POLICY "Clients can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = client_id);

-- Clients can DELETE their own documents
CREATE POLICY "Clients can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = client_id);

-- Admins (super_admin, regional_admin) can do everything
CREATE POLICY "Admins full access to documents"
  ON public.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'regional_admin')
    )
  );

-- Auditors can SELECT and UPDATE documents for their assigned applications
CREATE POLICY "Auditors can view assigned documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.application_id
        AND applications.assigned_auditor_id = auth.uid()
    )
  );

CREATE POLICY "Auditors can update assigned documents"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.application_id
        AND applications.assigned_auditor_id = auth.uid()
    )
  );

-- Certification Bodies can SELECT documents for their assigned applications
CREATE POLICY "CB can view assigned documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = documents.application_id
        AND applications.assigned_cb_id = auth.uid()
    )
  );

-- 4. Create storage bucket (run in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-documents', 'application-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS Policies

-- Clients can upload files to their application folder
CREATE POLICY "Clients can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'application-documents'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can read documents (further scoped by app-level RLS)
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'application-documents'
    AND auth.role() = 'authenticated'
  );

-- Clients can delete their own uploaded documents
CREATE POLICY "Clients can delete own storage files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'application-documents'
    AND auth.role() = 'authenticated'
  );
