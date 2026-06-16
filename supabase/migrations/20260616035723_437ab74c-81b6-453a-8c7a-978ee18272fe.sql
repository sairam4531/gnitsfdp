
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- REGISTRATIONS
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT UNIQUE NOT NULL,
  faculty_name TEXT NOT NULL,
  faculty_id TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  custom_department TEXT,
  institute TEXT NOT NULL,
  custom_institute TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  registration_fee INTEGER NOT NULL,
  utr_number TEXT NOT NULL,
  payment_screenshot_url TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT INSERT ON public.registrations TO anon;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register" ON public.registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read all registrations" ON public.registrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update registrations" ON public.registrations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete registrations" ON public.registrations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- PAYMENT SETTINGS (singleton row)
CREATE TABLE public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id TEXT,
  account_name TEXT,
  qr_code_url TEXT,
  internal_fee INTEGER NOT NULL DEFAULT 250,
  external_fee INTEGER NOT NULL DEFAULT 500,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read payment settings" ON public.payment_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage payment settings" ON public.payment_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.payment_settings (upi_id, account_name, internal_fee, external_fee)
VALUES ('', '', 250, 500);

-- WEBSITE SETTINGS (singleton row)
CREATE TABLE public.website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fdp_title TEXT NOT NULL DEFAULT 'One Week Faculty Development Program (FDP)',
  fdp_subtitle TEXT NOT NULL DEFAULT 'Smart Data Visualization using Power BI with Prompt Engineering and Generative AI',
  fdp_dates TEXT NOT NULL DEFAULT '22 June 2026 – 27 June 2026',
  venue TEXT NOT NULL DEFAULT 'CL-11, CSE Block, GNITS, Hyderabad',
  description TEXT NOT NULL DEFAULT 'The Department of CSE (Data Science), GNITS, Hyderabad is organizing a One Week Faculty Development Program on Smart Data Visualization using Power BI with Prompt Engineering and Generative AI.',
  registration_open BOOLEAN NOT NULL DEFAULT true,
  seat_limit INTEGER NOT NULL DEFAULT 500,
  hero_banner_url TEXT,
  brochure_url TEXT,
  contact_email TEXT DEFAULT '',
  contact_phone TEXT,
  footer_text TEXT DEFAULT '© G. Narayanamma Institute of Technology and Science (GNITS), Hyderabad',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.website_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.website_settings TO authenticated;
GRANT ALL ON public.website_settings TO service_role;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read website settings" ON public.website_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage website settings" ON public.website_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.website_settings DEFAULT VALUES;

-- SPEAKERS
CREATE TABLE public.speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  organization TEXT,
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.speakers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.speakers TO authenticated;
GRANT ALL ON public.speakers TO service_role;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read speakers" ON public.speakers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage speakers" ON public.speakers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.speakers (name, designation, organization, sort_order) VALUES
  ('Mr. Sunil Chengalva', 'AVP', 'Broadridge, Hyderabad', 1),
  ('Mr. K. Raghavendra Swamy', 'Senior Technical Corporate Trainer', '', 2),
  ('Mr. Vijaya Kadiyala', 'Executive Director & Head of Data, AI & Cloud Engineering', 'DBS Tech India', 3),
  ('Dr. S. Viswanadha Raju', 'Senior Professor & Principal', 'JNTUH UCEJ', 4);

-- Registration ID auto-generator (GNITS-FDP-XXXXXX)
CREATE OR REPLACE FUNCTION public.generate_registration_id()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.registration_id IS NULL OR NEW.registration_id = '' THEN
    NEW.registration_id := 'GNITS-FDP-' || lpad(floor(random()*900000+100000)::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_registration_id BEFORE INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.generate_registration_id();
