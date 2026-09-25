-- Multi-Workshop Registration System Migration
-- Creates workshops table, updates registrations, and updates duplicate check RPC

-- 1. Create workshops table
CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  department TEXT DEFAULT 'CSE (Data Science)',
  dates TEXT NOT NULL,
  timings TEXT DEFAULT '9:00 AM to 4:00 PM',
  venue TEXT NOT NULL,
  registration_fee NUMERIC NOT NULL DEFAULT 250,
  seat_limit INTEGER NOT NULL DEFAULT 500,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  hero_banner_url TEXT,
  brochure_url TEXT,
  upi_id TEXT,
  account_name TEXT,
  qr_code_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant table permissions
GRANT SELECT ON public.workshops TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;

-- Enable RLS
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can read workshops" ON public.workshops;
CREATE POLICY "Public can read workshops" ON public.workshops FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage workshops" ON public.workshops;
CREATE POLICY "Admins manage workshops" ON public.workshops FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- 2. Add workshop identification columns to registrations
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS workshop_slug TEXT,
ADD COLUMN IF NOT EXISTS workshop_title TEXT DEFAULT 'Two Days Hands-On Workathon on ''ARTIFICIAL INTELLIGENCE HUMANOID ROBOT''';

-- 3. Seed initial 2 workshops if table is empty
INSERT INTO public.workshops (
  slug,
  title,
  subtitle,
  description,
  department,
  dates,
  timings,
  venue,
  registration_fee,
  seat_limit,
  registration_open,
  sort_order,
  is_featured
)
SELECT
  'ai-humanoid-robot',
  'Two Days Hands-On Workathon on ''ARTIFICIAL INTELLIGENCE HUMANOID ROBOT''',
  'under GNITS CSI Student Chapter — Gain hands-on experience in AI humanoid robot technologies.',
  'Department of CSE (Data Science) is organizing a Two Days Hands-On Workathon on ARTIFICIAL INTELLIGENCE HUMANOID ROBOT under GNITS CSI Student Chapter.',
  'CSE (Data Science)',
  '10 September 2026 – 11 September 2026',
  '9:00 AM to 4:00 PM',
  'CL-12 & 13, 4th Floor, Admin Block, GNITS, Hyderabad',
  250,
  500,
  true,
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE slug = 'ai-humanoid-robot');

INSERT INTO public.workshops (
  slug,
  title,
  subtitle,
  description,
  department,
  dates,
  timings,
  venue,
  registration_fee,
  seat_limit,
  registration_open,
  sort_order,
  is_featured
)
SELECT
  'agentic-ai-cloud',
  'Two Days Hands-On Workshop on ''AGENTIC AI & CLOUD-NATIVE SYSTEMS''',
  'Master autonomous AI agents, LLM pipelines, and scalable cloud deployment architectures.',
  'Department of Computer Science & Engineering is organizing an intensive 2-day workshop focused on practical Agentic AI workflows, LangChain/LlamaIndex, and cloud-native containerized microservices.',
  'CSE',
  '18 September 2026 – 19 September 2026',
  '9:30 AM to 4:30 PM',
  'Main Seminar Hall & Lab 3, CSE Block, GNITS, Hyderabad',
  250,
  400,
  true,
  2,
  false
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE slug = 'agentic-ai-cloud');

-- 4. Update check_duplicate_registration to support per-workshop checks
CREATE OR REPLACE FUNCTION public.check_duplicate_registration(
  _roll_number text,
  _workshop_identifier text DEFAULT NULL
)
RETURNS boolean SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  IF _workshop_identifier IS NOT NULL AND _workshop_identifier <> '' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.registrations 
      WHERE faculty_id = _roll_number 
        AND (
          workshop_slug = _workshop_identifier 
          OR workshop_title = _workshop_identifier 
          OR workshop_id::text = _workshop_identifier
        )
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.registrations 
      WHERE faculty_id = _roll_number
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_duplicate_registration(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_duplicate_registration(text) TO anon, authenticated, service_role;

-- 5. Update get_registration_count to support per-workshop count
CREATE OR REPLACE FUNCTION public.get_registration_count(
  _workshop_identifier text DEFAULT NULL
)
RETURNS integer SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  IF _workshop_identifier IS NOT NULL AND _workshop_identifier <> '' THEN
    RETURN (
      SELECT COUNT(*)::integer FROM public.registrations
      WHERE workshop_slug = _workshop_identifier 
         OR workshop_title = _workshop_identifier 
         OR workshop_id::text = _workshop_identifier
    );
  ELSE
    RETURN (SELECT COUNT(*)::integer FROM public.registrations);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_registration_count(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_registration_count() TO anon, authenticated, service_role;
