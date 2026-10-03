import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Workshop } from "@/lib/queries";

// Types
export type FeedbackForm = {
  id: string;
  fdp_title: string;
  feedback_button_name: string;
  feedback_date: string | null;
  is_enabled: boolean;
  workshop_slug?: string | null;
  created_at: string;
  updated_at: string;
};

export function getLocalWorkshopFeedbackForms(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem("gnits_workshop_feedback_map") || "{}");
  } catch {
    return {};
  }
}

export function saveLocalWorkshopFeedbackForm(formId: string, workshopSlug: string) {
  try {
    const map = getLocalWorkshopFeedbackForms();
    map[formId] = workshopSlug.toLowerCase();
    localStorage.setItem("gnits_workshop_feedback_map", JSON.stringify(map));
  } catch (e) {
    console.error("Failed to map feedback form to workshop:", e);
  }
}

export function isFeedbackFormForWorkshop(
  form: FeedbackForm | undefined | null,
  ws: Workshop | undefined | null
): boolean {
  if (!form || !ws) return false;

  // 1. Explicit local mapping check
  const localMap = getLocalWorkshopFeedbackForms();
  if (localMap[form.id]) {
    return localMap[form.id] === ws.slug.toLowerCase();
  }

  // 2. Explicit workshop_slug property check
  if (form.workshop_slug) {
    return form.workshop_slug.toLowerCase() === ws.slug.toLowerCase();
  }

  // 3. String matching on fdp_title
  const formTitle = (form.fdp_title || "").toLowerCase().trim();
  const wsTitle = (ws.title || "").toLowerCase().trim();
  const wsSlug = (ws.slug || "").toLowerCase().trim();

  // If the title contains the slug or exact title
  if (formTitle.includes(wsSlug) || wsTitle.includes(formTitle) || formTitle.includes(wsTitle)) {
    return true;
  }

  // Specific domain matching to avoid cross-contamination
  const isFormHumanoid =
    formTitle.includes("humanoid") || formTitle.includes("robot") || formTitle.includes("bionic");
  const isWsHumanoid =
    wsSlug.includes("humanoid") || wsSlug.includes("robot") || wsSlug.includes("bionic");

  if (isFormHumanoid) {
    return isWsHumanoid;
  }

  const isFormAgentic = formTitle.includes("agentic") || formTitle.includes("cloud-native");
  const isWsAgentic = wsSlug.includes("agentic") || wsSlug.includes("cloud");

  if (isFormAgentic) {
    return isWsAgentic;
  }

  const isFormWeb = formTitle.includes("web") || formTitle.includes("frontend") || formTitle.includes("backend");
  const isWsWeb = wsSlug.includes("web") || wsSlug.includes("dev");

  if (isFormWeb) {
    return isWsWeb;
  }

  return false;
}

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
  roll_number: string | null;
  department: string | null;
  year: string | null;
  semester: string | null;
  section: string | null;
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
