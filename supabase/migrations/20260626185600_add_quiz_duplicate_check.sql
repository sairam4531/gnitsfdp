-- Add RPC function to securely check for duplicate quiz responses
CREATE OR REPLACE FUNCTION public.check_duplicate_quiz_response(_exam_id uuid, _faculty_id text)
RETURNS boolean SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.quiz_responses 
    WHERE exam_id = _exam_id AND faculty_id = _faculty_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_duplicate_quiz_response(uuid, text) TO anon, authenticated, service_role;
