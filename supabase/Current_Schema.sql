-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accreditation_bodies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  acronym text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT accreditation_bodies_pkey PRIMARY KEY (id),
  CONSTRAINT accreditation_bodies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  company_name text NOT NULL,
  industry text NOT NULL,
  scope text NOT NULL,
  employee_count integer,
  locations_count integer,
  status text DEFAULT 'pending_recommendation'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  recommended_iso text,
  selected_package text,
  assigned_auditor_id uuid,
  assigned_cb_id uuid,
  internal_notes text,
  certification_status text DEFAULT 'pending'::text,
  certification_decision text,
  coupon_code text,
  approval_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT applications_assigned_auditor_id_fkey FOREIGN KEY (assigned_auditor_id) REFERENCES public.profiles(id),
  CONSTRAINT applications_assigned_cb_id_fkey FOREIGN KEY (assigned_cb_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.cb_accreditation_bodies (
  cb_id uuid NOT NULL,
  accreditation_body_id uuid NOT NULL,
  CONSTRAINT cb_accreditation_bodies_pkey PRIMARY KEY (cb_id, accreditation_body_id),
  CONSTRAINT cb_accreditation_bodies_cb_id_fkey FOREIGN KEY (cb_id) REFERENCES public.certification_bodies(id),
  CONSTRAINT cb_accreditation_bodies_accreditation_body_id_fkey FOREIGN KEY (accreditation_body_id) REFERENCES public.accreditation_bodies(id)
);
CREATE TABLE public.cb_countries (
  cb_id uuid NOT NULL,
  country_id integer NOT NULL,
  CONSTRAINT cb_countries_pkey PRIMARY KEY (cb_id, country_id),
  CONSTRAINT cb_countries_cb_id_fkey FOREIGN KEY (cb_id) REFERENCES public.certification_bodies(id),
  CONSTRAINT cb_countries_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.cb_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cb_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size text,
  document_type text DEFAULT 'accreditation_schedule'::text CHECK (document_type = ANY (ARRAY['accreditation_schedule'::text, 'certificate'::text, 'other'::text])),
  uploaded_by uuid,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cb_documents_pkey PRIMARY KEY (id),
  CONSTRAINT cb_documents_cb_id_fkey FOREIGN KEY (cb_id) REFERENCES public.certification_bodies(id),
  CONSTRAINT cb_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.cb_iaf_codes (
  cb_id uuid NOT NULL,
  iaf_code text NOT NULL,
  CONSTRAINT cb_iaf_codes_pkey PRIMARY KEY (cb_id, iaf_code),
  CONSTRAINT cb_iaf_codes_cb_id_fkey FOREIGN KEY (cb_id) REFERENCES public.certification_bodies(id)
);
CREATE TABLE public.cb_iso_standards (
  cb_id uuid NOT NULL,
  iso_standard text NOT NULL,
  CONSTRAINT cb_iso_standards_pkey PRIMARY KEY (cb_id, iso_standard),
  CONSTRAINT cb_iso_standards_cb_id_fkey FOREIGN KEY (cb_id) REFERENCES public.certification_bodies(id)
);
CREATE TABLE public.cb_standard_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cb_id uuid NOT NULL,
  iso_standard text NOT NULL,
  initial_price numeric,
  surveillance_price numeric,
  recertification_price numeric,
  currency text DEFAULT 'USD'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cb_standard_pricing_pkey PRIMARY KEY (id),
  CONSTRAINT cb_standard_pricing_cb_id_fkey FOREIGN KEY (cb_id) REFERENCES public.certification_bodies(id)
);
CREATE TABLE public.certification_bodies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  website text,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  acronym text,
  initial_price numeric,
  surveillance_price numeric,
  recertification_price numeric,
  currency text DEFAULT 'USD'::text,
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT certification_bodies_pkey PRIMARY KEY (id),
  CONSTRAINT certification_bodies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.countries (
  id integer NOT NULL DEFAULT nextval('countries_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  region_id text CHECK (region_id IS NULL OR (region_id = ANY (ARRAY['asia'::text, 'africa'::text, 'europe'::text, 'north_america'::text, 'south_america'::text]))),
  iso_code text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.coupon_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  client_id uuid,
  application_id uuid,
  discount_percent numeric NOT NULL,
  original_amount numeric,
  discounted_amount numeric,
  redeemed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_redemptions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.discount_coupons(id),
  CONSTRAINT coupon_redemptions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT coupon_redemptions_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.custom_application_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  field_key text NOT NULL UNIQUE,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type = ANY (ARRAY['text'::text, 'textarea'::text, 'number'::text, 'select'::text, 'multiselect'::text, 'date'::text, 'boolean'::text])),
  options jsonb,
  required boolean NOT NULL DEFAULT false,
  trigger_on ARRAY NOT NULL DEFAULT ARRAY['approval'::text],
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_application_fields_pkey PRIMARY KEY (id),
  CONSTRAINT custom_application_fields_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.custom_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role = ANY (ARRAY['super_admin'::text, 'regional_admin'::text, 'auditor'::text, 'certification_body'::text, 'client'::text])),
  permission text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT custom_permissions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.custom_user_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  field_key text NOT NULL UNIQUE,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type = ANY (ARRAY['text'::text, 'textarea'::text, 'number'::text, 'select'::text, 'multiselect'::text, 'date'::text, 'boolean'::text])),
  options jsonb,
  required boolean NOT NULL DEFAULT false,
  applies_to_roles ARRAY NOT NULL DEFAULT ARRAY['client'::text],
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_user_fields_pkey PRIMARY KEY (id),
  CONSTRAINT custom_user_fields_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.discount_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_percent numeric NOT NULL CHECK (discount_percent > 0::numeric AND discount_percent <= 100::numeric),
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discount_coupons_pkey PRIMARY KEY (id),
  CONSTRAINT discount_coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid,
  client_id uuid,
  file_name text NOT NULL,
  file_size text,
  document_type text DEFAULT 'general'::text,
  uploaded_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'pending'::text,
  reviewer_comment text,
  uploaded_by uuid,
  uploader_role text CHECK (uploader_role IS NULL OR (uploader_role = ANY (ARRAY['client'::text, 'super_admin'::text, 'regional_admin'::text, 'auditor'::text, 'certification_body'::text]))),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT documents_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'system'::text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid,
  client_id uuid,
  stripe_session_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd'::text,
  payment_type text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  role text DEFAULT 'client'::text,
  region text,
  created_at timestamp with time zone DEFAULT now(),
  cb_id uuid,
  full_name text,
  company_name text,
  gap_analysis_score integer,
  stakeholder_type text DEFAULT 'client'::text,
  approval_status text DEFAULT 'approved'::text,
  approved_by uuid,
  approved_at timestamp with time zone,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_cb_id_fkey FOREIGN KEY (cb_id) REFERENCES public.certification_bodies(id),
  CONSTRAINT profiles_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.referral_commission_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  min_conversions integer NOT NULL CHECK (min_conversions >= 0),
  max_conversions integer,
  commission_percent numeric NOT NULL CHECK (commission_percent >= 0::numeric AND commission_percent <= 100::numeric),
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_commission_tiers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid,
  referred_email text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'signed_up'::text, 'converted'::text])),
  commission_rate numeric DEFAULT 10.00,
  commission_amount numeric DEFAULT 0,
  payment_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  converted_at timestamp with time zone,
  commission_percent numeric,
  tier_label text,
  CONSTRAINT referrals_pkey PRIMARY KEY (id),
  CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id),
  CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid,
  auditor_id uuid,
  report_url text,
  status text DEFAULT 'draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  decision text,
  auditor_comment text,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT reports_auditor_id_fkey FOREIGN KEY (auditor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.sara_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  interest text,
  source text DEFAULT 'landing_page'::text CHECK (source = ANY (ARRAY['landing_page'::text, 'dashboard'::text])),
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sara_leads_pkey PRIMARY KEY (id),
  CONSTRAINT sara_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);