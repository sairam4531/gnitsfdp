import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useWebsiteSettings() {
  return useQuery({
    queryKey: ["website_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePaymentSettings() {
  return useQuery({
    queryKey: ["payment_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSpeakers() {
  return useQuery({
    queryKey: ["speakers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("speakers").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRegistrations() {
  return useQuery({
    queryKey: ["registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface Coordinator {
  id: string;
  name: string;
  department: string;
  phone: string;
  type: "Faculty" | "Student";
  sort_order: number;
  created_at: string;
}

export function useCoordinators() {
  return useQuery<Coordinator[]>({
    queryKey: ["coordinators"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("coordinators" as never)
          .select("*")
          .order("sort_order");
        if (error) {
          console.warn(
            "Could not fetch coordinators table, returning empty array. Make sure the coordinators table is created via SQL migrations.",
            error,
          );
          return [];
        }
        return data ?? [];
      } catch (err) {
        console.warn("Failed to fetch coordinators:", err);
        return [];
      }
    },
  });
}
