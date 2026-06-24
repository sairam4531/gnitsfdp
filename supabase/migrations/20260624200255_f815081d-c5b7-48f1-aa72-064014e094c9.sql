
-- 1) Move SECURITY DEFINER functions out of the exposed `public` schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, app_role) SET SCHEMA private;
ALTER FUNCTION public.bootstrap_first_admin() SET SCHEMA private;
ALTER FUNCTION public.promote_user_to_admin(text) SET SCHEMA private;

-- has_role must remain callable so RLS expressions can evaluate it
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO anon, authenticated, service_role;

-- These should NOT be callable by clients
REVOKE ALL ON FUNCTION private.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.promote_user_to_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.bootstrap_first_admin() TO service_role;
GRANT EXECUTE ON FUNCTION private.promote_user_to_admin(text) TO service_role;

-- 2) Lock down user_roles: only admins may insert/update/delete roles
CREATE POLICY "Admins manage user roles - insert"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage user roles - update"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage user roles - delete"
  ON public.user_roles FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 3) Restrict payment-screenshots uploads to images with bounded name length
DROP POLICY IF EXISTS "Anyone can upload payment screenshots" ON storage.objects;
CREATE POLICY "Anyone can upload payment screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND lower(storage.extension(name)) = ANY (ARRAY['png','jpg','jpeg','webp'])
    AND octet_length(name) < 256
  );

-- 4) Replace WITH CHECK (true) on registrations INSERT with a basic sanity check
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;
CREATE POLICY "Anyone can register"
  ON public.registrations FOR INSERT
  WITH CHECK (
    length(btrim(faculty_name)) > 0
    AND length(btrim(email)) > 3
    AND length(btrim(utr_number)) > 0
  );
