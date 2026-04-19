-- ============================================
-- Certify.cx — Phase 3 Migration PATCH
-- ============================================
-- Run in Supabase SQL Editor AFTER phase3_migration.sql.
-- Idempotent (safe to re-run).
--
-- Fixes gaps discovered after initial Phase 3 rollout:
--  1. Write RLS on custom_user_fields (super admin CRUD from browser).
--  2. Write RLS on custom_application_fields (super admin CRUD from browser).
--  3. custom_application_fields: allow public SELECT (signup-time fetch of
--     approval/rejection fields happens pre-auth only in rare cases; keeping
--     authenticated-only is still correct — no change needed). Left as-is.
--  4. Ensure profiles.custom_fields and applications.approval_data/
--     rejection_data are writable via the existing row policies (they already
--     are, since they ride on the row's existing policies — no change needed).
-- ============================================


-- --------------------------------------------
-- 1. custom_user_fields — super admin write policy
-- --------------------------------------------
-- AdminUserFields.jsx writes directly from the browser using the anon key +
-- the logged-in super admin's JWT. Without these policies, insert/update/
-- delete silently fails with 403.

DROP POLICY IF EXISTS "custom_user_fields_super_admin_write"
  ON public.custom_user_fields;

CREATE POLICY "custom_user_fields_super_admin_write"
  ON public.custom_user_fields
  FOR ALL
  TO authenticated
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


-- --------------------------------------------
-- 2. custom_application_fields — super admin write policy
-- --------------------------------------------

DROP POLICY IF EXISTS "custom_application_fields_super_admin_write"
  ON public.custom_application_fields;

CREATE POLICY "custom_application_fields_super_admin_write"
  ON public.custom_application_fields
  FOR ALL
  TO authenticated
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


-- --------------------------------------------
-- 3. applications.approval_data / rejection_data — ensure CB can write
-- --------------------------------------------
-- These JSONB columns are updated by the certification body from
-- ApplicationDetails.jsx (handleCbDecision). That path already succeeds if
-- the existing applications-row update policy permits CBs to update their
-- assigned rows. If your policy only allows specific columns, extend it.
-- No DDL needed here unless you have column-level restrictions — verify with:
--
--   SELECT polname, polcmd, qual, with_check
--   FROM pg_policy
--   WHERE polrelid = 'public.applications'::regclass;
--
-- If the CB update path returns 42501, add a policy like:
--
-- DROP POLICY IF EXISTS "applications_cb_can_decide" ON public.applications;
-- CREATE POLICY "applications_cb_can_decide"
--   ON public.applications FOR UPDATE
--   TO authenticated
--   USING (
--     assigned_cb_id = auth.uid()
--     OR EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.id = auth.uid()
--         AND profiles.role IN ('super_admin','regional_admin','certification_body')
--     )
--   );


-- --------------------------------------------
-- 4. Sanity: backfill empty JSONB defaults (safe no-op if already set)
-- --------------------------------------------


