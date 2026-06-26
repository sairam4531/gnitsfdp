import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export type FeedbackForm = {
  id: string;
  fdp_title: string;
  feedback_button_name: string;
  feedback_date: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type FeedbackQuestion = {
  id: string;
  feedback_form_id: string;
  question_text: string;
  question_type: "multiple_choice" | "short_answer";
  options_json: string[];
  question_order: number;
};

export type FeedbackAnswer = {
  question_id: string;
  question_text: string;
  question_type: "multiple_choice" | "short_answer";
  answer: string;
};

export type FeedbackResponse = {
  id: string;
  feedback_form_id: string;
  participant_name: string;
  participant_email: string;
  employee_id: string | null;
  department: string | null;
  institution_name: string | null;
  answers_json: FeedbackAnswer[];
  submitted_at: string;
};

// Use `as any` because supabase generated types haven't been regenerated yet
const db = supabase as any;

export function useFeedbackForms() {
  return useQuery({
    queryKey: ["feedback_forms"],
    queryFn: async () => {
      const { data, error } = await db
        .from("feedback_forms")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FeedbackForm[];
    },
  });
}

export function useEnabledFeedbackForms() {
  return useQuery({
    queryKey: ["feedback_forms", "enabled"],
    queryFn: async () => {
      const { data, error } = await db
        .from("feedback_forms")
        .select("*")
        .eq("is_enabled", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FeedbackForm[];
    },
  });
}

export function useFeedbackForm(id: string | undefined) {
  return useQuery({
    queryKey: ["feedback_form", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("feedback_forms")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as FeedbackForm | null;
    },
    enabled: !!id,
  });
}

export function useFeedbackQuestions(formId: string | undefined) {
  return useQuery({
    queryKey: ["feedback_questions", formId],
    queryFn: async () => {
      const { data, error } = await db
        .from("feedback_questions")
        .select("*")
        .eq("feedback_form_id", formId)
        .order("question_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FeedbackQuestion[];
    },
    enabled: !!formId,
  });
}

export function useFeedbackResponses() {
  return useQuery({
    queryKey: ["feedback_responses"],
    queryFn: async () => {
      const { data, error } = await db
        .from("feedback_responses")
        .select("*, feedback_forms(fdp_title, feedback_button_name)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (FeedbackResponse & {
        feedback_forms: { fdp_title: string; feedback_button_name: string } | null;
      })[];
    },
  });
}

export const feedbackDb = db;
