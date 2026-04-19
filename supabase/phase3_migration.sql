-- ============================================
-- Certify.cx — Phase 3 Migration
-- Dynamic Permissions + Custom User Fields + Custom Application Fields
-- ============================================
-- Run in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================

-- --------------------------------------------
-- 1. CUSTOM PERMISSIONS (role × permission overrides)
-- --------------------------------------------
-- The baseline role→permission map lives in src/utils/roles.js. This table
-- stores per-(role, permission) overrides so a super admin can toggle any
-- capability on or off at runtime without a code deploy.
--
-- Semantics:
--   - No row   → baseline from roles.js applies.
--   - enabled=true  → permission is granted (even if baseline denies).
--   - enabled=false → permission is revoked (even if baseline grants).
CREATE TABLE IF NOT EXISTS public.custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL
    CHECK (role IN ('super_admin','regional_admin','auditor','certification_body','client')),
  permission TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (role, permission)
);

CREATE INDEX IF NOT EXISTS idx_custom_permissions_role
  ON public.custom_permissions(role);

ALTER TABLE public.custom_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_permissions_read_all_authenticated" ON public.custom_permissions;
CREATE POLICY "custom_permissions_read_all_authenticated"
  ON public.custom_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Writes happen server-side via service role.


-- --------------------------------------------
-- 2. CUSTOM USER FIELDS (field definitions)
-- --------------------------------------------
-- Super-admin-defined extra profile fields. Rendered on signup + profile +
-- admin user detail views, scoped to `applies_to_roles`.
CREATE TABLE IF NOT EXISTS public.custom_user_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key TEXT NOT NULL UNIQUE,     -- machine key, e.g. "tax_id"
  label TEXT NOT NULL,                -- UI label, e.g. "Tax ID Number"
  field_type TEXT NOT NULL
    CHECK (field_type IN ('text','textarea','number','select','multiselect','date','boolean')),
  options JSONB,                      -- for select/multiselect: ["A","B","C"]
  required BOOLEAN NOT NULL DEFAULT false,
  applies_to_roles TEXT[] NOT NULL DEFAULT ARRAY['client']::TEXT[],
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_user_fields_active
  ON public.custom_user_fields(is_active, display_order);

ALTER TABLE public.custom_user_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_user_fields_read_all" ON public.custom_user_fields;
CREATE POLICY "custom_user_fields_read_all"
  ON public.custom_user_fields FOR SELECT
  USING (true);  -- signup form needs this before auth


-- Values bag on profiles. Keyed by field_key.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;


-- --------------------------------------------
-- 3. CUSTOM APPLICATION FIELDS (approval/rejection)
-- --------------------------------------------
-- Extra structured fields the super admin requires reviewers to capture when
-- approving or rejecting an application. Each field opts into a trigger set.
CREATE TABLE IF NOT EXISTS public.custom_application_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL
    CHECK (field_type IN ('text','textarea','number','select','multiselect','date','boolean')),
  options JSONB,
  required BOOLEAN NOT NULL DEFAULT false,
  trigger_on TEXT[] NOT NULL DEFAULT ARRAY['approval']::TEXT[],  -- subset of {'approval','rejection'}
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_app_fields_active
  ON public.custom_application_fields(is_active, display_order);

ALTER TABLE public.custom_application_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_application_fields_read_authenticated" ON public.custom_application_fields;
CREATE POLICY "custom_application_fields_read_authenticated"
  ON public.custom_application_fields FOR SELECT
  USING (auth.role() = 'authenticated');


-- Value bags on applications.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS approval_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rejection_data JSONB NOT NULL DEFAULT '{}'::jsonb;
