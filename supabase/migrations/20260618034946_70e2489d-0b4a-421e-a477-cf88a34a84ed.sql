
-- Feedback Forms
CREATE TABLE public.feedback_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fdp_title TEXT NOT NULL,
  feedback_button_name TEXT NOT NULL DEFAULT 'Submit Feedback',
  feedback_date DATE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feedback_forms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_forms TO authenticated;
GRANT ALL ON public.feedback_forms TO service_role;
ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view enabled feedback forms" ON public.feedback_forms
  FOR SELECT TO anon, authenticated USING (is_enabled = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage feedback forms" ON public.feedback_forms
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Feedback Questions
CREATE TABLE public.feedback_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_form_id UUID NOT NULL REFERENCES public.feedback_forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice','short_answer')),
  options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feedback_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_questions TO authenticated;
GRANT ALL ON public.feedback_questions TO service_role;
ALTER TABLE public.feedback_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view questions of enabled forms" ON public.feedback_questions
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.feedback_forms f WHERE f.id = feedback_form_id AND (f.is_enabled = true OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "Admins manage feedback questions" ON public.feedback_questions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Feedback Responses
CREATE TABLE public.feedback_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_form_id UUID NOT NULL REFERENCES public.feedback_forms(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  answers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (feedback_form_id, participant_email)
);
GRANT INSERT ON public.feedback_responses TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.feedback_responses TO authenticated;
GRANT ALL ON public.feedback_responses TO service_role;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit feedback to enabled forms" ON public.feedback_responses
  FOR INSERT TO anon, authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.feedback_forms f WHERE f.id = feedback_form_id AND f.is_enabled = true)
  );
CREATE POLICY "Admins view feedback responses" ON public.feedback_responses
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete feedback responses" ON public.feedback_responses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.feedback_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_feedback_forms_updated BEFORE UPDATE ON public.feedback_forms
  FOR EACH ROW EXECUTE FUNCTION public.feedback_set_updated_at();
CREATE TRIGGER trg_feedback_questions_updated BEFORE UPDATE ON public.feedback_questions
  FOR EACH ROW EXECUTE FUNCTION public.feedback_set_updated_at();

CREATE INDEX idx_feedback_questions_form ON public.feedback_questions(feedback_form_id, question_order);
CREATE INDEX idx_feedback_responses_form_date ON public.feedback_responses(feedback_form_id, submitted_at);
