-- ============================================
-- Certify.cx — Phase 2 Migration
-- ============================================
-- Run in the Supabase SQL Editor.
--
-- Covers:
--  1. Discount coupons & coupon-link redemptions (Super Admin managed).
--  2. Tiered referral commissions (rolling 12-month conversion count).
-- ============================================


-- --------------------------------------------
-- 1. Discount Coupons
-- --------------------------------------------
-- Super Admin creates a coupon with a code, a percent discount (10/15/20/25
-- per the rules, but any 1-100 is allowed), an optional expiry, an optional
-- usage cap, and an active flag. The code is shareable via URL:
--   /signup?coupon=CODE  (captured at signup)
--   /client/checkout/:id (can be entered manually on the checkout page)

CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent NUMERIC NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_redemptions INTEGER,         -- NULL = unlimited
  redemption_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,          -- NULL = never expires
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.discount_coupons(lower(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.discount_coupons(is_active);


CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  discount_percent NUMERIC NOT NULL,
  original_amount NUMERIC,
  discounted_amount NUMERIC,
  redeemed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_client ON public.coupon_redemptions(client_id);


-- --------------------------------------------
-- 2. Referral Commission Tiers
-- --------------------------------------------
-- Super Admin configures tiers keyed by the rolling 12-month conversion count
-- for a given referrer. Defaults per the manager's rules:
--   1–15 certs  → 15%
--   15–20 certs → 20%
--   20–25 certs → 25%
-- Tiers are evaluated at conversion time (checkout.js).

CREATE TABLE IF NOT EXISTS public.referral_commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_conversions INTEGER NOT NULL CHECK (min_conversions >= 0),
  max_conversions INTEGER,         -- NULL = open-ended top tier
  commission_percent NUMERIC NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_tiers_range
  ON public.referral_commission_tiers(min_conversions);

-- Seed default tiers (only if table is empty)
INSERT INTO public.referral_commission_tiers (min_conversions, max_conversions, commission_percent, label)
SELECT * FROM (VALUES
  (1,  15, 15, 'Bronze (1–15 certs)'),
  (15, 20, 20, 'Silver (15–20 certs)'),
  (20, 25, 25, 'Gold (20–25 certs)'),
  (25, NULL, 25, 'Gold+ (25+ certs)')
) AS t(min_conversions, max_conversions, commission_percent, label)
WHERE NOT EXISTS (SELECT 1 FROM public.referral_commission_tiers);


-- --------------------------------------------
-- 3. Referrals: remember which tier was applied
-- --------------------------------------------
-- Needed for audit/payout trace, since the tier could change later.

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC;

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS tier_label TEXT;


-- --------------------------------------------
-- 4. Applications: link to redeemed coupon
-- --------------------------------------------
-- Optional — handy for reporting ("which apps used which coupon").

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;
