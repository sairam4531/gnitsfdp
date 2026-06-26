
-- quiz_exams
CREATE TABLE public.quiz_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_date date NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  is_enabled boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT 'Quiz Exam',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_date)
);
GRANT SELECT ON public.quiz_exams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_exams TO authenticated;
GRANT ALL ON public.quiz_exams TO service_role;
ALTER TABLE public.quiz_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_exams_select_all" ON public.quiz_exams FOR SELECT USING (true);
CREATE POLICY "quiz_exams_admin_insert" ON public.quiz_exams FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "quiz_exams_admin_update" ON public.quiz_exams FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "quiz_exams_admin_delete" ON public.quiz_exams FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

-- quiz_questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.quiz_exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  question_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_questions_select_all" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "quiz_questions_admin_insert" ON public.quiz_questions FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "quiz_questions_admin_update" ON public.quiz_questions FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "quiz_questions_admin_delete" ON public.quiz_questions FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_quiz_questions_exam ON public.quiz_questions(exam_id, question_order);

-- quiz_responses
CREATE TABLE public.quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.quiz_exams(id) ON DELETE CASCADE,
  faculty_name text NOT NULL,
  faculty_id text NOT NULL,
  department text NOT NULL,
  custom_department text,
  college_name text NOT NULL,
  custom_college text,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  auto_submitted boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, faculty_id)
);
GRANT INSERT ON public.quiz_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_responses TO authenticated;
GRANT ALL ON public.quiz_responses TO service_role;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_responses_public_insert" ON public.quiz_responses FOR INSERT
  WITH CHECK (length(faculty_name) > 0 AND length(faculty_id) > 0);
CREATE POLICY "quiz_responses_admin_select" ON public.quiz_responses FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "quiz_responses_admin_delete" ON public.quiz_responses FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER quiz_exams_set_updated_at BEFORE UPDATE ON public.quiz_exams
  FOR EACH ROW EXECUTE FUNCTION public.feedback_set_updated_at();
CREATE TRIGGER quiz_questions_set_updated_at BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.feedback_set_updated_at();
