-- ============================================
-- ISO Link Settings — activation toggle for shareable ISO links
-- ============================================
-- Stores per-ISO activation state managed from the Super Admin
-- "Shareable Links" page. When a row is missing, the link is treated
-- as active by default (see fallback in src/pages/admin/ShareableLinks.jsx
-- and src/pages/iso/IsoLanding.jsx).

CREATE TABLE IF NOT EXISTS public.iso_link_settings (
  slug TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.iso_link_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read activation state (needed for the public ISO landing page).
DROP POLICY IF EXISTS "iso_link_settings_read_all" ON public.iso_link_settings;
CREATE POLICY "iso_link_settings_read_all"
  ON public.iso_link_settings
  FOR SELECT
  USING (true);

-- Only super admins can mutate activation state.
DROP POLICY IF EXISTS "iso_link_settings_super_admin_write" ON public.iso_link_settings;
CREATE POLICY "iso_link_settings_super_admin_write"
  ON public.iso_link_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );
