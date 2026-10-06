CREATE TABLE IF NOT EXISTS public.workshop_payments (
  slug text PRIMARY KEY,
  upi_id text,
  account_name text,
  qr_code_url text,
  registration_fee integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workshop_payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshop_payments TO authenticated;
GRANT ALL ON public.workshop_payments TO service_role;
ALTER TABLE public.workshop_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workshop_payments_select_all" ON public.workshop_payments FOR SELECT USING (true);
CREATE POLICY "workshop_payments_admin_insert" ON public.workshop_payments FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "workshop_payments_admin_update" ON public.workshop_payments FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "workshop_payments_admin_delete" ON public.workshop_payments FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));