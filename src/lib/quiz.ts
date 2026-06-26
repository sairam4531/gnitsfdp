import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type QuizExam = {
  id: string;
  exam_date: string;
  duration_minutes: number;
  is_enabled: boolean;
  title: string;
  created_at: string;
  updated_at: string;
};

export type QuizQuestion = {
  id: string;
  exam_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  question_order: number;
};

export type QuizResponse = {
  id: string;
  exam_id: string;
  faculty_name: string;
  faculty_id: string;
  department: string;
  custom_department: string | null;
  college_name: string;
  custom_college: string | null;
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  answers_json: Record<string, "A" | "B" | "C" | "D">;
  auto_submitted: boolean;
  submitted_at: string;
};

export const quizDb = supabase as any;

export function useQuizExams() {
  return useQuery({
    queryKey: ["quiz_exams"],
    queryFn: async () => {
      const { data, error } = await quizDb
        .from("quiz_exams")
        .select("*")
        .order("exam_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuizExam[];
    },
  });
}

export function useEnabledQuizExam() {
  return useQuery({
    queryKey: ["quiz_exams", "enabled"],
    queryFn: async () => {
      const { data, error } = await quizDb
        .from("quiz_exams")
        .select("*")
        .eq("is_enabled", true)
        .order("exam_date", { ascending: false })
        .limit(1);
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as QuizExam | null;
    },
  });
}

export function useQuizQuestions(examId: string | undefined) {
  return useQuery({
    queryKey: ["quiz_questions", examId],
    queryFn: async () => {
      const { data, error } = await quizDb
        .from("quiz_questions")
        .select("*")
        .eq("exam_id", examId)
        .order("question_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as QuizQuestion[];
    },
    enabled: !!examId,
  });
}

export function useQuizResponses(examId: string | undefined) {
  return useQuery({
    queryKey: ["quiz_responses", examId],
    queryFn: async () => {
      if (!examId) return [];
      const { data, error } = await quizDb
        .from("quiz_responses")
        .select("*")
        .eq("exam_id", examId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuizResponse[];
    },
    enabled: !!examId,
  });
}
