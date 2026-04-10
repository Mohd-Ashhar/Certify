-- ============================================
-- Certify.cx — Accreditation & Certification Body Registry
-- ============================================
-- Run in Supabase SQL Editor.
--
-- Creates:
--   1. countries               (reference list, IAF-covered)
--   2. accreditation_bodies    (master list: name + acronym)
--   3. certification_bodies    (extend existing)
--   4. cb_accreditation_bodies (many-to-many: CB ↔ AB)
--   5. cb_countries            (many-to-many: CB ↔ country)
--   6. cb_iso_standards        (many-to-many: CB ↔ ISO standard)
--   7. cb_iaf_codes            (many-to-many: CB ↔ IAF sector code)
-- ============================================

-- ============================================
-- 1. COUNTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.countries (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed full IAF country list
INSERT INTO public.countries (name) VALUES
  ('United States'),('Canada'),('Australia'),('France'),('Germany'),('Iceland'),
  ('Ireland'),('Italy'),('Spain'),('Sweden'),('Austria'),('Belgium'),('Finland'),
  ('Czech Republic'),('Denmark'),('Norway'),('United Kingdom'),('Switzerland'),
  ('New Zealand'),('Russian Federation'),('Portugal'),('Netherlands'),('Isle of Man'),
  ('Afghanistan'),('Aland Islands'),('Albania'),('Algeria'),('American Samoa'),
  ('Andorra'),('Angola'),('Anguilla'),('Antarctica'),('Antigua and Barbuda'),
  ('Argentina'),('Armenia'),('Aruba'),('Azerbaijan'),('Bahamas'),('Bahrain'),
  ('Bangladesh'),('Barbados'),('Belarus'),('Belize'),('Benin'),('Bermuda'),
  ('Bhutan'),('Bolivia, Plurinational State of'),('Bosnia and Herzegovina'),
  ('Botswana'),('Bouvet Island'),('Brazil'),('British Indian Ocean Territory'),
  ('Brunei Darussalam'),('Bulgaria'),('Burkina Faso'),('Burundi'),('Cambodia'),
  ('Cameroon'),('Cape Verde'),('Cayman Islands'),('Central African Republic'),
  ('Chad'),('Chile'),('China'),('Christmas Island'),('Cocos (Keeling) Islands'),
  ('Colombia'),('Comoros'),('Congo'),('Congo, the Democratic Republic of the'),
  ('Cook Islands'),('Costa Rica'),('Cote d''Ivoire'),('Croatia'),('Cuba'),
  ('Cyprus'),('Djibouti'),('Dominica'),('Dominican Republic'),('Ecuador'),
  ('Egypt'),('El Salvador'),('Equatorial Guinea'),('Eritrea'),('Estonia'),
  ('Ethiopia'),('Falkland Islands (Malvinas)'),('Faroe Islands'),('Fiji'),
  ('French Guiana'),('French Polynesia'),('French Southern Territories'),
  ('Gabon'),('Gambia'),('Georgia'),('Ghana'),('Gibraltar'),('Greece'),
  ('Greenland'),('Grenada'),('Guadeloupe'),('Guam'),('Guatemala'),('Guernsey'),
  ('Guinea'),('Guinea-Bissau'),('Guyana'),('Haiti'),
  ('Heard Island and McDonald Islands'),('Holy See (Vatican City State)'),
  ('Honduras'),('Hong Kong'),('Hungary'),('India'),('Indonesia'),
  ('Iran, Islamic Republic of'),('Iraq'),('Israel'),('Jamaica'),('Japan'),
  ('Jersey'),('Jordan'),('Kazakhstan'),('Kenya'),('Kiribati'),
  ('Korea, Democratic People''s Republic of'),('Korea, Republic of'),('Kuwait'),
  ('Kyrgyzstan'),('Lao People''s Democratic Republic'),('Latvia'),('Lebanon'),
  ('Lesotho'),('Liberia'),('Libyan Arab Jamahiriya'),('Liechtenstein'),
  ('Lithuania'),('Luxembourg'),('Macau'),('North Macedonia'),('Madagascar'),
  ('Malawi'),('Malaysia'),('Maldives'),('Mali'),('Malta'),('Marshall Islands'),
  ('Martinique'),('Mauritania'),('Mauritius'),('Mayotte'),('Mexico'),
  ('Micronesia, Federated States of'),('Moldova, Republic of'),('Monaco'),
  ('Mongolia'),('Montenegro'),('Montserrat'),('Morocco'),('Mozambique'),
  ('Myanmar'),('Namibia'),('Nauru'),('Nepal'),('Netherlands Antilles'),
  ('New Caledonia'),('Nicaragua'),('Niger'),('Nigeria'),('Niue'),
  ('Norfolk Island'),('Northern Mariana Islands'),('Oman'),('Pakistan'),
  ('Palau'),('Palestinian Territory, Occupied'),('Panama'),('Papua New Guinea'),
  ('Paraguay'),('Peru'),('Philippines'),('Pitcairn'),('Poland'),('Puerto Rico'),
  ('Qatar'),('Reunion'),('Romania'),('Rwanda'),('Saint Barthelemy'),
  ('Saint Helena'),('Saint Kitts and Nevis'),('Saint Lucia'),
  ('Saint Martin (French part)'),('Saint Pierre and Miquelon'),
  ('Saint Vincent and the Grenadines'),('Samoa'),('San Marino'),
  ('Sao Tome and Principe'),('Saudi Arabia'),('Senegal'),('Serbia'),
  ('Seychelles'),('Sierra Leone'),('Singapore'),('Slovakia'),('Slovenia'),
  ('Solomon Islands'),('Somalia'),('South Africa'),
  ('South Georgia and the South Sandwich Islands'),('Sri Lanka'),('Sudan'),
  ('Suriname'),('Svalbard and Jan Mayen'),('Swaziland'),('Syrian Arab Republic'),
  ('Chinese Taipei'),('Tajikistan'),('Tanzania, United Republic of'),
  ('Thailand'),('Timor-Leste'),('Togo'),('Tokelau'),('Tonga'),
  ('Trinidad and Tobago'),('Tunisia'),('Turkey'),('Turkmenistan'),
  ('Turks and Caicos Islands'),('Tuvalu'),('Uganda'),('Ukraine'),
  ('United Arab Emirates'),('United States Minor Outlying Islands'),('Uruguay'),
  ('Uzbekistan'),('Vanuatu'),('Venezuela, Bolivarian Republic of'),('Vietnam'),
  ('Virgin Islands, British'),('Virgin Islands, U.S'),('Wallis and Futuna'),
  ('Western Sahara'),('Yemen'),('Zambia'),('Zimbabwe'),('Kosovo')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. ACCREDITATION BODIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.accreditation_bodies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  acronym TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_acronym ON public.accreditation_bodies(acronym);

-- Seed master AB list
INSERT INTO public.accreditation_bodies (name, acronym) VALUES
  ('Accreditation Body of Serbia','ATS'),
  ('Akkreditierung Austria','AA'),
  ('American Association for Laboratory Accreditation','A2LA'),
  ('American National Standards Institute','ANSI'),
  ('ANSI National Accreditation Body','ANAB'),
  ('Belarusian State Centre for Accreditation','BSCA'),
  ('Belgian Accreditation Body','BELAC'),
  ('Bureau of Accreditation','BoA'),
  ('China National Accreditation Service for Conformity Assessment','CNAS'),
  ('COmité FRançais d''ACcréditation','COFRAC'),
  ('Czech Accreditation Institute','CAI'),
  ('Danish Accreditation','DANAK'),
  ('Deutsche Akkreditierungsstelle GmbH','DAkkS'),
  ('Dutch Accreditation Council (Raad Voor Accreditatie)','RvA'),
  ('Ecuadorian Accreditation Service (Servicio de Acreditación Ecuatoriano)','SAE'),
  ('Egyptian Accreditation Council','EGAC'),
  ('Emirates International Accreditation Center','EIAC'),
  ('Ente Costarricense de Acreditación','ECA'),
  ('Entidad mexicana de acreditación, a.c.','EMA'),
  ('Entidad Nacional de Acreditación','ENAC'),
  ('Ethiopia National Accreditation Office','ENAO'),
  ('Executive Agency - Bulgarian Accreditation Service','EA-BAS'),
  ('General Coordination for Accreditation','CGCRE'),
  ('General Directorate of Accreditation','DPA'),
  ('Gulf Cooperation Council Accreditation Center','GAC'),
  ('Hellenic Accreditation System','ESYD'),
  ('Hong Kong Accreditation Service','HKAS'),
  ('Institute for Accreditation of the Republic of Macedonia','IARM'),
  ('Instituto Nacional de Normalizacion','INN'),
  ('International Accreditation Japan','IAJapan'),
  ('International Accreditation Service','IAS'),
  ('International Organic and Sustainable Accreditation','IOAS'),
  ('Irish National Accreditation Board','INAB'),
  ('ISMS Accreditation Center','ISMS-AC'),
  ('Italian Accreditation Body','ACCREDIA'),
  ('Japan Accreditation Board','JAB'),
  ('Kenya Accreditation Service','KENAS'),
  ('Korea Accreditation Board','KAB'),
  ('Korea Accreditation System','KAS'),
  ('Kosovo Accreditation Directorate','DAK'),
  ('Luxembourg Office of Accreditation','OLAS'),
  ('Mauritius Accreditation Service','MAURITAS'),
  ('Mongolian Agency for Standardization and Metrology, Accreditation Department','MNAS'),
  ('Moroccan Accreditation Service','SEMAC'),
  ('NATIONAL ACCREDITATION AGENCY OF UKRAINE','NAAU'),
  ('National Accreditation Authority','NAH'),
  ('National Accreditation Board for Certification Bodies','NABCB'),
  ('National Accreditation Board for Education and Training','NABET'),
  ('National Accreditation Body of Colombia','ONAC'),
  ('National Accreditation Body of Indonesia','KAN'),
  ('National Accreditation Center of Iran','NACI'),
  ('National Center of Accreditation of the Republic of Kazakhstan','NCA'),
  ('National Institute of Environmental Research','NIER'),
  ('National Institute of Quality – Directorate of Accreditation','INACAL-DA'),
  ('National Standardization Council of Thailand','NSC'),
  ('Norwegian Accreditation','NA'),
  ('Organismo Argentino de Acreditacion','OAA'),
  ('Organismo Uruguayo de Acreditacion','OUA'),
  ('Pakistan National Accreditation Council','PNAC'),
  ('Philippine Accreditation Bureau','PAB'),
  ('Polish Centre for Accreditation','PCA'),
  ('Portuguese Institute for Accreditation','IPAC'),
  ('Romanian Accreditation Association','RENAR'),
  ('Scientific Technical Centre on Industrial Safety','STC-IS'),
  ('Singapore Accreditation Council','SAC'),
  ('Slovak National Accreditation Service','SNAS'),
  ('Slovenian Accreditation','SA'),
  ('South African National Accreditation System','SANAS'),
  ('Southern African Development Community Accreditation Services','SADCAS'),
  ('Sri Lanka Accreditation Board for Conformity Assessment','SLAB'),
  ('Standards Council of Canada','SCC'),
  ('Standards Malaysia','DSM'),
  ('Swedish Board for Accreditation and Conformity Assessment','SWEDAC'),
  ('Swiss Accreditation Service','SAS'),
  ('Taiwan Accreditation Foundation','TAF'),
  ('Tunisian Accreditation Council (Conseil National d''Accreditation, CNA)','TUNAC'),
  ('Turkish Accreditation Agency','TURKAK'),
  ('United Accreditation Foundation Inc.','UAF'),
  ('United Kingdom Accreditation Service','UKAS')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. CERTIFICATION BODIES — EXTEND EXISTING
-- ============================================
-- Existing columns (assumed): id, name, website, country, status, created_at
-- Add new columns without wiping data.

ALTER TABLE public.certification_bodies
  ADD COLUMN IF NOT EXISTS acronym TEXT,
  ADD COLUMN IF NOT EXISTS initial_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS surveillance_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS recertification_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================
-- 4. CB ↔ ACCREDITATION BODIES (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cb_accreditation_bodies (
  cb_id UUID NOT NULL REFERENCES public.certification_bodies(id) ON DELETE CASCADE,
  accreditation_body_id UUID NOT NULL REFERENCES public.accreditation_bodies(id) ON DELETE CASCADE,
  PRIMARY KEY (cb_id, accreditation_body_id)
);

CREATE INDEX IF NOT EXISTS idx_cb_ab_cb ON public.cb_accreditation_bodies(cb_id);
CREATE INDEX IF NOT EXISTS idx_cb_ab_ab ON public.cb_accreditation_bodies(accreditation_body_id);

-- ============================================
-- 5. CB ↔ COUNTRIES (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cb_countries (
  cb_id UUID NOT NULL REFERENCES public.certification_bodies(id) ON DELETE CASCADE,
  country_id INTEGER NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  PRIMARY KEY (cb_id, country_id)
);

CREATE INDEX IF NOT EXISTS idx_cb_countries_cb ON public.cb_countries(cb_id);

-- ============================================
-- 6. CB ↔ ISO STANDARDS (many-to-many, plain text keys)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cb_iso_standards (
  cb_id UUID NOT NULL REFERENCES public.certification_bodies(id) ON DELETE CASCADE,
  iso_standard TEXT NOT NULL,
  PRIMARY KEY (cb_id, iso_standard)
);

-- ============================================
-- 7. CB ↔ IAF SECTOR CODES (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cb_iaf_codes (
  cb_id UUID NOT NULL REFERENCES public.certification_bodies(id) ON DELETE CASCADE,
  iaf_code TEXT NOT NULL,
  PRIMARY KEY (cb_id, iaf_code)
);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditation_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_accreditation_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_iso_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_iaf_codes ENABLE ROW LEVEL SECURITY;

-- Countries: readable by all authenticated users
DROP POLICY IF EXISTS "countries_read_all" ON public.countries;
CREATE POLICY "countries_read_all" ON public.countries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Accreditation Bodies: readable by all authenticated users
DROP POLICY IF EXISTS "ab_read_all" ON public.accreditation_bodies;
CREATE POLICY "ab_read_all" ON public.accreditation_bodies
  FOR SELECT USING (auth.role() = 'authenticated');

-- Accreditation Bodies: Super Admin full, Regional Admin insert-only
DROP POLICY IF EXISTS "ab_super_admin_all" ON public.accreditation_bodies;
CREATE POLICY "ab_super_admin_all" ON public.accreditation_bodies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "ab_regional_admin_insert" ON public.accreditation_bodies;
CREATE POLICY "ab_regional_admin_insert" ON public.accreditation_bodies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'regional_admin')
  );

-- Certification Bodies: Super Admin full, Regional Admin insert-only
-- (existing table already has RLS — these augment it)
DROP POLICY IF EXISTS "cb_super_admin_all" ON public.certification_bodies;
CREATE POLICY "cb_super_admin_all" ON public.certification_bodies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "cb_regional_admin_insert" ON public.certification_bodies;
CREATE POLICY "cb_regional_admin_insert" ON public.certification_bodies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'regional_admin')
  );

-- CB can update its own row (for self-registration flow)
DROP POLICY IF EXISTS "cb_self_update" ON public.certification_bodies;
CREATE POLICY "cb_self_update" ON public.certification_bodies
  FOR UPDATE USING (created_by = auth.uid());

-- Read access to CB registry: authenticated users can read
DROP POLICY IF EXISTS "cb_read_all" ON public.certification_bodies;
CREATE POLICY "cb_read_all" ON public.certification_bodies
  FOR SELECT USING (auth.role() = 'authenticated');

-- Join tables: admins manage, everyone reads
DROP POLICY IF EXISTS "cb_ab_read" ON public.cb_accreditation_bodies;
CREATE POLICY "cb_ab_read" ON public.cb_accreditation_bodies
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "cb_ab_write" ON public.cb_accreditation_bodies;
CREATE POLICY "cb_ab_write" ON public.cb_accreditation_bodies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND role IN ('super_admin','regional_admin','certification_body'))
  );

DROP POLICY IF EXISTS "cb_countries_read" ON public.cb_countries;
CREATE POLICY "cb_countries_read" ON public.cb_countries
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "cb_countries_write" ON public.cb_countries;
CREATE POLICY "cb_countries_write" ON public.cb_countries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND role IN ('super_admin','regional_admin','certification_body'))
  );

DROP POLICY IF EXISTS "cb_iso_read" ON public.cb_iso_standards;
CREATE POLICY "cb_iso_read" ON public.cb_iso_standards
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "cb_iso_write" ON public.cb_iso_standards;
CREATE POLICY "cb_iso_write" ON public.cb_iso_standards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND role IN ('super_admin','regional_admin','certification_body'))
  );

DROP POLICY IF EXISTS "cb_iaf_read" ON public.cb_iaf_codes;
CREATE POLICY "cb_iaf_read" ON public.cb_iaf_codes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "cb_iaf_write" ON public.cb_iaf_codes;
CREATE POLICY "cb_iaf_write" ON public.cb_iaf_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
            AND role IN ('super_admin','regional_admin','certification_body'))
  );
