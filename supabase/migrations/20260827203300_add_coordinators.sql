-- Create coordinators table
CREATE TABLE IF NOT EXISTS public.coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Faculty', 'Student')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT ON public.coordinators TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coordinators TO authenticated;
GRANT ALL ON public.coordinators TO service_role;

-- Enable RLS
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can read coordinators" ON public.coordinators FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage coordinators" ON public.coordinators FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default rows (only if the table is empty)
INSERT INTO public.coordinators (name, department, phone, type, sort_order)
SELECT 'Dr. K. Raghavendra Swamy', 'CSE', '8790883408', 'Faculty', 1
WHERE NOT EXISTS (SELECT 1 FROM public.coordinators);
