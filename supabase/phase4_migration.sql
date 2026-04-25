-- ============================================
-- Certify.cx — Phase 4 Migration
-- ============================================
-- Run in the Supabase SQL Editor.
-- Idempotent (safe to re-run).
--
-- Fixes RLS gaps for tables the Super Admin manages from the browser:
--  1. discount_coupons     (Super Admin CRUD; authenticated read for client redemption flow).
--  2. coupon_redemptions   (Super Admin read; client insert on own redemption).
--  3. referral_commission_tiers (Super Admin CRUD; authenticated read).
--  4. countries            (Super Admin CRUD; public read — used pre-auth on signup).
-- ============================================


-- --------------------------------------------
-- 1. discount_coupons
-- --------------------------------------------
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discount_coupons_read_authenticated" ON public.discount_coupons;
CREATE POLICY "discount_coupons_read_authenticated"
  ON public.discount_coupons FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "discount_coupons_super_admin_write" ON public.discount_coupons;
CREATE POLICY "discount_coupons_super_admin_write"
  ON public.discount_coupons
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
-- 2. coupon_redemptions
-- --------------------------------------------
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupon_redemptions_super_admin_read" ON public.coupon_redemptions;
CREATE POLICY "coupon_redemptions_super_admin_read"
  ON public.coupon_redemptions FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin','regional_admin')
    )
  );

DROP POLICY IF EXISTS "coupon_redemptions_client_insert" ON public.coupon_redemptions;
CREATE POLICY "coupon_redemptions_client_insert"
  ON public.coupon_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );


-- --------------------------------------------
-- 3. referral_commission_tiers
-- --------------------------------------------
ALTER TABLE public.referral_commission_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commission_tiers_read_authenticated" ON public.referral_commission_tiers;
CREATE POLICY "commission_tiers_read_authenticated"
  ON public.referral_commission_tiers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "commission_tiers_super_admin_write" ON public.referral_commission_tiers;
CREATE POLICY "commission_tiers_super_admin_write"
  ON public.referral_commission_tiers
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
-- 4. countries
-- --------------------------------------------
-- Country list is consumed pre-auth on the signup form (region routing) so
-- read access stays public; writes are Super Admin only.
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "countries_read_all" ON public.countries;
CREATE POLICY "countries_read_all"
  ON public.countries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "countries_super_admin_write" ON public.countries;
CREATE POLICY "countries_super_admin_write"
  ON public.countries
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
-- 5. Backfill: assign region_id for known countries
-- --------------------------------------------
-- Mirrors the static COUNTRY_REGION_MAP in src/utils/roles.js so the
-- Countries admin page no longer shows hundreds of "Unassigned" rows.

-- Asia
UPDATE public.countries SET region_id = 'asia' WHERE region_id IS NULL AND lower(name) IN (
  'india','china','japan','south korea','korea, republic of','korea','singapore','malaysia','indonesia',
  'thailand','vietnam','philippines','pakistan','bangladesh','sri lanka','nepal','myanmar','burma',
  'cambodia','laos','mongolia','hong kong','taiwan','australia','new zealand','saudi arabia','ksa',
  'united arab emirates','uae','qatar','kuwait','bahrain','oman','jordan','lebanon','iraq','iran',
  'iran, islamic republic of','yemen','syria','syrian arab republic','palestine','palestinian territory',
  'state of palestine','israel','turkey','türkiye','turkiye','afghanistan','uzbekistan','kazakhstan',
  'turkmenistan','tajikistan','kyrgyzstan','armenia','georgia','azerbaijan','brunei','brunei darussalam',
  'east timor','timor-leste','maldives','bhutan','fiji','papua new guinea','samoa','tonga','vanuatu',
  'solomon islands','kiribati','nauru','tuvalu','marshall islands','micronesia','palau'
);

-- Africa
UPDATE public.countries SET region_id = 'africa' WHERE region_id IS NULL AND lower(name) IN (
  'egypt','south africa','nigeria','kenya','ghana','ethiopia','tanzania','tanzania, united republic of',
  'uganda','rwanda','morocco','tunisia','algeria','libya','sudan','south sudan','cameroon',
  'ivory coast','cote d''ivoire','côte d''ivoire','senegal','mali','burkina faso','niger','chad',
  'democratic republic of the congo','congo, democratic republic of the','dr congo','republic of the congo',
  'congo','congo, republic of the','angola','mozambique','zimbabwe','zambia','botswana','namibia',
  'madagascar','mauritius','somalia','eritrea','djibouti','gabon','togo','benin','sierra leone',
  'liberia','guinea','guinea-bissau','gambia','the gambia','malawi','lesotho','eswatini','swaziland',
  'equatorial guinea','cape verde','cabo verde','comoros','seychelles','sao tome and principe',
  'são tomé and príncipe','central african republic','burundi','mauritania','western sahara'
);

-- Europe
UPDATE public.countries SET region_id = 'europe' WHERE region_id IS NULL AND lower(name) IN (
  'united kingdom','uk','great britain','england','scotland','wales','northern ireland',
  'france','germany','italy','spain','netherlands','belgium','switzerland','austria','sweden',
  'norway','denmark','finland','ireland','portugal','poland','czech republic','czechia','greece',
  'romania','hungary','russia','russian federation','ukraine','croatia','serbia','bulgaria',
  'slovakia','slovenia','lithuania','latvia','estonia','luxembourg','malta','cyprus','iceland',
  'albania','north macedonia','macedonia','montenegro','bosnia and herzegovina','moldova',
  'moldova, republic of','belarus','kosovo','liechtenstein','monaco','andorra','san marino',
  'vatican city','holy see','aland islands','faroe islands','gibraltar','guernsey','jersey',
  'isle of man','svalbard and jan mayen'
);

-- North America
UPDATE public.countries SET region_id = 'north_america' WHERE region_id IS NULL AND lower(name) IN (
  'united states','united states of america','usa','us','canada','mexico','guatemala','honduras',
  'el salvador','nicaragua','costa rica','panama','belize','cuba','haiti','dominican republic',
  'jamaica','trinidad and tobago','bahamas','the bahamas','barbados','puerto rico','aruba',
  'cayman islands','bermuda','dominica','grenada','saint lucia','saint kitts and nevis',
  'saint vincent and the grenadines','antigua and barbuda','curacao','curaçao','sint maarten',
  'turks and caicos islands','british virgin islands','virgin islands, british',
  'us virgin islands','virgin islands, u.s.','greenland','saint pierre and miquelon',
  'saint barthelemy','saint barthélemy','saint martin','anguilla','montserrat','guadeloupe','martinique'
);

-- South America
UPDATE public.countries SET region_id = 'south_america' WHERE region_id IS NULL AND lower(name) IN (
  'brazil','argentina','colombia','chile','peru','venezuela',
  'venezuela, bolivarian republic of','ecuador','bolivia','bolivia, plurinational state of',
  'paraguay','uruguay','guyana','suriname','french guiana','falkland islands',
  'falkland islands (malvinas)','south georgia and the south sandwich islands'
);

-- Antarctica & uncategorised territories — keep NULL so admin can decide.
