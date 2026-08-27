-- Add RPC function to securely get the total registration count for public seat tracking
CREATE OR REPLACE FUNCTION public.get_registration_count()
RETURNS integer SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM public.registrations);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_registration_count() TO anon, authenticated, service_role;


-- Add RPC function to securely check if a Roll Number is already registered
CREATE OR REPLACE FUNCTION public.check_duplicate_registration(_roll_number text)
RETURNS boolean SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.registrations 
    WHERE faculty_id = _roll_number
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_duplicate_registration(text) TO anon, authenticated, service_role;
