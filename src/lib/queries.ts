import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Workshop {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  department?: string | null;
  dates: string;
  timings?: string | null;
  venue: string;
  registration_fee: number;
  seat_limit: number;
  registration_open: boolean;
  hero_banner_url?: string | null;
  brochure_url?: string | null;
  upi_id?: string | null;
  account_name?: string | null;
  qr_code_url?: string | null;
  admin_username?: string | null;
  admin_password?: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export function getLocalWorkshopCredentials(): Record<string, { username?: string; password?: string }> {
  try {
    return JSON.parse(localStorage.getItem("gnits_workshop_credentials") || "{}");
  } catch {
    return {};
  }
}

export function saveLocalWorkshopCredentials(slug: string, username?: string | null, password?: string | null) {
  try {
    const creds = getLocalWorkshopCredentials();
    creds[slug] = { username: username || "", password: password || "" };
    localStorage.setItem("gnits_workshop_credentials", JSON.stringify(creds));
  } catch (e) {
    console.error("Failed to save local workshop credentials:", e);
  }
}

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

export function useWorkshops() {
  const { data: websiteSettings } = useWebsiteSettings();
  const { data: paymentSettings } = usePaymentSettings();

  return useQuery<Workshop[]>({
    queryKey: ["workshops", websiteSettings?.id, paymentSettings?.id],
    queryFn: async () => {
      const localCreds = getLocalWorkshopCredentials();
      try {
        const { data, error } = await supabase
          .from("workshops" as never)
          .select("*")
          .order("sort_order");

        if (!error && Array.isArray(data) && data.length > 0) {
          return (data as unknown as Workshop[]).map((ws) => {
            const extra = localCreds[ws.slug] || {};
            return {
              ...ws,
              admin_username: ws.admin_username || extra.username || "admin",
              admin_password: ws.admin_password || extra.password || "admin123",
            };
          });
        }
      } catch (err) {
        console.warn("Could not query workshops table directly, using fallback defaults:", err);
      }

      // Seamless fallback from website_settings & payment_settings
      const defaultWorkshops: Workshop[] = [
        {
          id: "workshop-1-ai-humanoid",
          slug: "ai-humanoid-robot",
          title:
            websiteSettings?.fdp_title ||
            "Two Days Hands-On Workathon on 'ARTIFICIAL INTELLIGENCE HUMANOID ROBOT'",
          subtitle:
            websiteSettings?.fdp_subtitle ||
            "under GNITS CSI Student Chapter — Gain hands-on experience in AI humanoid robot technologies.",
          description:
            websiteSettings?.description ||
            "Department of CSE (Data Science) is organizing a Two Days Hands-On Workathon on 'ARTIFICIAL INTELLIGENCE HUMANOID ROBOT' under GNITS CSI Student Chapter.",
          department: "CSE (Data Science)",
          dates: websiteSettings?.fdp_dates || "10 September 2026 – 11 September 2026",
          timings: websiteSettings?.timings || "9:00 AM to 4:00 PM",
          venue: websiteSettings?.venue || "CL-12 & 13, 4th Floor, Admin Block, GNITS, Hyderabad",
          registration_fee: paymentSettings?.internal_fee ?? 250,
          seat_limit: websiteSettings?.seat_limit ?? 500,
          registration_open: websiteSettings?.registration_open ?? true,
          hero_banner_url: websiteSettings?.hero_banner_url || null,
          brochure_url: websiteSettings?.brochure_url || null,
          upi_id: paymentSettings?.upi_id || null,
          account_name: paymentSettings?.account_name || null,
          qr_code_url: paymentSettings?.qr_code_url || null,
          sort_order: 1,
          is_featured: true,
          admin_username: localCreds["ai-humanoid-robot"]?.username || "csd_admin",
          admin_password: localCreds["ai-humanoid-robot"]?.password || "gnits@csd2026",
        },
        {
          id: "workshop-2-agentic-ai",
          slug: "agentic-ai-cloud",
          title: "Two Days Hands-On Workshop on 'AGENTIC AI & CLOUD-NATIVE SYSTEMS'",
          subtitle:
            "Master autonomous AI agents, LLM pipelines, and scalable cloud deployment architectures.",
          description:
            "Department of Computer Science & Engineering is organizing an intensive 2-day workshop focused on practical Agentic AI workflows, LangChain, LlamaIndex, and cloud-native containerized microservices.",
          department: "CSE",
          dates: "18 September 2026 – 19 September 2026",
          timings: "9:30 AM to 4:30 PM",
          venue: "Main Seminar Hall & Lab 3, CSE Block, GNITS, Hyderabad",
          registration_fee: paymentSettings?.internal_fee ?? 250,
          seat_limit: 400,
          registration_open: true,
          hero_banner_url: null,
          brochure_url: null,
          upi_id: paymentSettings?.upi_id || null,
          account_name: paymentSettings?.account_name || null,
          qr_code_url: paymentSettings?.qr_code_url || null,
          sort_order: 2,
          is_featured: false,
          admin_username: localCreds["agentic-ai-cloud"]?.username || "cse_admin",
          admin_password: localCreds["agentic-ai-cloud"]?.password || "gnits@cse2026",
        },
      ];

      return defaultWorkshops;
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

export interface RegistrationRecord {
  id: string;
  faculty_name: string;
  faculty_id: string;
  designation: string;
  department: string;
  category: string;
  institute: string;
  email: string;
  phone: string;
  registration_fee: number;
  utr_number: string;
  payment_screenshot_url: string | null;
  registration_id: string;
  payment_status: string;
  workshop_id?: string | null;
  workshop_slug?: string | null;
  workshop_title?: string | null;
  created_at: string;
}

export function useRegistrations() {
  return useQuery<RegistrationRecord[]>({
    queryKey: ["registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as RegistrationRecord[]) ?? [];
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
          console.warn("Could not fetch coordinators table, returning empty array:", error);
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

export function useRegistrationCount(identifier?: string) {
  return useQuery({
    queryKey: ["registration_count", identifier],
    queryFn: async () => {
      try {
        if (identifier) {
          const { data, error } = await supabase.rpc("get_registration_count" as any, {
            _workshop_identifier: identifier,
          });
          if (!error && typeof data === "number") return data;
        }
        const { data, error } = await supabase.rpc("get_registration_count" as any);
        if (error) {
          console.warn("Could not fetch registration count via RPC, falling back to 0:", error);
          return 0;
        }
        return (data as number) ?? 0;
      } catch (err) {
        console.warn("Failed to fetch registration count:", err);
        return 0;
      }
    },
    refetchInterval: 10000,
  });
}
