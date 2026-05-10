-- ============================================
-- Certify.cx — Phase 5 Migration: Welcome Email Trigger
-- ============================================
-- Run in the Supabase SQL Editor.
-- Idempotent (safe to re-run).
--
-- Adds:
--   1. profiles.welcome_sent_at — bookkeeping for one-shot welcome email.
--   2. pg_net extension (if not already enabled).
--   3. handle_email_confirmed() — fires on auth.users.email_confirmed_at
--      transitioning from NULL to a timestamp (i.e. user just verified).
--      It POSTs to /api/send-welcome which idempotently sends the welcome
--      email via Resend.
--   4. on_email_confirmed trigger on auth.users.
--
-- IMPORTANT: the welcome URL + shared secret are baked into the function
-- body below (the WELCOME_URL and WELCOME_SECRET constants). We tried using
-- app.settings.* GUCs first, but Supabase managed projects deny
-- ALTER ROLE ... SET app.settings.* even for the postgres user. Inline
-- constants sidestep that restriction.
--
-- WELCOME_SECRET must equal the INTERNAL_WEBHOOK_SECRET env var on Vercel.
-- To rotate: change the value in both places and re-run this file.
-- ============================================


-- --------------------------------------------
-- 1. profiles.welcome_sent_at
-- --------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;


-- --------------------------------------------
-- 2. pg_net extension (HTTP from Postgres)
-- --------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- --------------------------------------------
-- 3. handle_email_confirmed()
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  welcome_url    CONSTANT TEXT := 'https://certify.cx/api/send-welcome';
  -- WELCOME_SECRET: must match Vercel env var INTERNAL_WEBHOOK_SECRET.
  welcome_secret CONSTANT TEXT := 'fc50d9c834ead8984ba9bf51a4012b99b2539298ae136c5d46ff6801a1480ba3';
BEGIN
  -- Only fire on the null -> non-null transition (user just verified).
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF OLD.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := welcome_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-token', welcome_secret
    ),
    body    := jsonb_build_object('user_id', NEW.id)
  );

  RETURN NEW;
END;
$$;


-- --------------------------------------------
-- 4. on_email_confirmed trigger
-- --------------------------------------------
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;

CREATE TRIGGER on_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_confirmed();
