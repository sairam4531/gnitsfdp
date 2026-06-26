-- Add RPC function to securely get a participant's quiz response
CREATE OR REPLACE FUNCTION public.get_participant_quiz_response(_exam_id uuid, _faculty_id text)
RETURNS TABLE (
  score integer,
  total_questions integer,
  time_taken_seconds integer,
  answers_json jsonb,
  faculty_name text,
  faculty_id text,
  department text,
  custom_department text,
  college_name text,
  custom_college text
) SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.score,
    r.total_questions,
    r.time_taken_seconds,
    r.answers_json,
    r.faculty_name,
    r.faculty_id,
    r.department,
    r.custom_department,
    r.college_name,
    r.custom_college
  FROM public.quiz_responses r
  WHERE r.exam_id = _exam_id AND r.faculty_id = _faculty_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_participant_quiz_response(uuid, text) TO anon, authenticated, service_role;
