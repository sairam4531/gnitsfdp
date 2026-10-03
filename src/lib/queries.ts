import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorkshopOutcomeItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

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
  outcomes?: WorkshopOutcomeItem[] | null;
  created_at?: string;
  updated_at?: string;
}

export function getDefaultOutcomesForWorkshop(slugOrWs?: string | Workshop): WorkshopOutcomeItem[] {
  const slug = (typeof slugOrWs === "string" ? slugOrWs : slugOrWs?.slug || "").toLowerCase();

  if (slug.includes("humanoid") || slug.includes("bionic") || slug.includes("robot")) {
    return [
      {
        id: "outcome-1",
        icon: "Cpu",
        title: "Robot Kinematics & Mobility",
        desc: "Master servo calibration, locomotion, and articulated limb movements.",
      },
      {
        id: "outcome-2",
        icon: "Terminal",
        title: "Voice Recognition & Speech",
        desc: "Build bidirectional NLP voice interaction and audio synthesis pipelines.",
      },
      {
        id: "outcome-3",
        icon: "Sliders",
        title: "Visual Perception & Computer Vision",
        desc: "Deploy real-time object tracking, facial recognition, and obstacle avoidance.",
      },
      {
        id: "outcome-4",
        icon: "Eye",
        title: "Autonomous Decision Making",
        desc: "Integrate sensor telemetry with edge compute logic for autonomous reaction.",
      },
      {
        id: "outcome-5",
        icon: "Brain",
        title: "AI Concepts in Robotics",
        desc: "Apply advanced AI decision-making concepts to humanoid robots.",
      },
      {
        id: "outcome-6",
        icon: "Target",
        title: "YOLO Simulation & Projects",
        desc: "Develop YOLO tracking simulations in custom robotics projects.",
      },
    ];
  }

  if (slug.includes("agentic") || slug.includes("agent") || slug.includes("cloud")) {
    return [
      {
        id: "outcome-1",
        icon: "Brain",
        title: "Autonomous Agent Architectures",
        desc: "Design and implement autonomous agents using state-of-the-art frameworks.",
      },
      {
        id: "outcome-2",
        icon: "Terminal",
        title: "LangChain & LlamaIndex Mastery",
        desc: "Build complex RAG pipelines and tool-augmented reasoning workflows.",
      },
      {
        id: "outcome-3",
        icon: "Cpu",
        title: "Cloud-Native Microservices",
        desc: "Package, containerize, and orchestrate scalable services using Docker & Kubernetes.",
      },
      {
        id: "outcome-4",
        icon: "Eye",
        title: "Vector DB & Semantic Search",
        desc: "Integrate high-performance vector databases for enterprise semantic discovery.",
      },
      {
        id: "outcome-5",
        icon: "Sliders",
        title: "API Orchestration & Security",
        desc: "Secure and streamline multi-agent communication and cloud endpoints.",
      },
      {
        id: "outcome-6",
        icon: "Target",
        title: "End-to-End Capstone Project",
        desc: "Build and deploy an enterprise-ready agentic cloud system from scratch.",
      },
    ];
  }

  if (slug.includes("web") || slug.includes("frontend") || slug.includes("backend")) {
    return [
      {
        id: "outcome-1",
        icon: "Terminal",
        title: "Frontend Development",
        desc: "Build responsive and interactive web interfaces using modern frontend technologies and develop the user-facing components of web applications.",
      },
      {
        id: "outcome-2",
        icon: "Cpu",
        title: "Backend Development",
        desc: "Develop server-side applications and implement backend functionality to support complete web application workflows.",
      },
      {
        id: "outcome-3",
        icon: "Workflow",
        title: "REST APIs & Integration",
        desc: "Learn to create, consume, and integrate REST APIs to enable effective communication between frontend and backend systems.",
      },
      {
        id: "outcome-4",
        icon: "Sliders",
        title: "Database Integration",
        desc: "Connect web applications with databases and learn how to integrate and manage application data effectively.",
      },
      {
        id: "outcome-5",
        icon: "CheckCircle2",
        title: "Authentication & Version Control",
        desc: "Implement authentication mechanisms and apply version control practices for organized and collaborative application development.",
      },
      {
        id: "outcome-6",
        icon: "Target",
        title: "API Testing & Deployment",
        desc: "Perform API testing and learn application deployment techniques, culminating in the development of a complete real-world web application.",
      },
    ];
  }

  // General default matching the landing page outcomes
  return [
    {
      id: "outcome-1",
      icon: "Cpu",
      title: "Core Architecture & Foundations",
      desc: "Gain in-depth practical understanding of modern tools, hardware, and runtime platforms.",
    },
    {
      id: "outcome-2",
      icon: "Terminal",
      title: "Applied Programming & Development",
      desc: "Build functional solutions, scripts, and workflows following industry standards.",
    },
    {
      id: "outcome-3",
      icon: "Sliders",
      title: "Control, Optimization & Performance",
      desc: "Learn precision parameter tuning, efficiency enhancement, and debugging techniques.",
    },
    {
      id: "outcome-4",
      icon: "Eye",
      title: "Integration & System Design",
      desc: "Connect diverse toolkits, APIs, and modern frameworks into cohesive workflows.",
    },
    {
      id: "outcome-5",
      icon: "Brain",
      title: "Advanced Problem Solving",
      desc: "Apply intelligent logic, algorithms, and real-time decision making to complex challenges.",
    },
    {
      id: "outcome-6",
      icon: "Target",
      title: "Capstone Project Deployment",
      desc: "Build and test an end-to-end practical project ready for your technical portfolio.",
    },
  ];
}

export function getLocalWorkshopOutcomes(): Record<string, WorkshopOutcomeItem[]> {
  try {
    return JSON.parse(localStorage.getItem("gnits_workshop_outcomes") || "{}");
  } catch {
    return {};
  }
}

export function saveLocalWorkshopOutcomes(slug: string, outcomes: WorkshopOutcomeItem[]) {
  try {
    const all = getLocalWorkshopOutcomes();
    all[slug.toLowerCase()] = outcomes;
    localStorage.setItem("gnits_workshop_outcomes", JSON.stringify(all));

    // Also sync into custom workshops cache if present
    const list = getLocalCustomWorkshops();
    const idx = list.findIndex((w) => w.slug.toLowerCase() === slug.toLowerCase());
    if (idx >= 0) {
      list[idx].outcomes = outcomes;
      localStorage.setItem("gnits_custom_workshops", JSON.stringify(list));
    }
  } catch (e) {
    console.error("Failed to save workshop outcomes:", e);
  }
}

export interface WorkshopPaymentInfo {
  upi_id?: string | null;
  account_name?: string | null;
  qr_code_url?: string | null;
  registration_fee?: number | null;
}

export function getLocalWorkshopPayments(): Record<string, WorkshopPaymentInfo> {
  try {
    return JSON.parse(localStorage.getItem("gnits_workshop_payments") || "{}");
  } catch {
    return {};
  }
}

export function saveLocalWorkshopPayment(slug: string, payment: WorkshopPaymentInfo) {
  try {
    const all = getLocalWorkshopPayments();
    all[slug.toLowerCase()] = { ...(all[slug.toLowerCase()] || {}), ...payment };
    localStorage.setItem("gnits_workshop_payments", JSON.stringify(all));

    // Also update custom workshops if present
    const list = getLocalCustomWorkshops();
    const idx = list.findIndex((w) => w.slug.toLowerCase() === slug.toLowerCase());
    if (idx >= 0) {
      if (payment.upi_id !== undefined) list[idx].upi_id = payment.upi_id;
      if (payment.account_name !== undefined) list[idx].account_name = payment.account_name;
      if (payment.qr_code_url !== undefined) list[idx].qr_code_url = payment.qr_code_url;
      if (payment.registration_fee !== undefined && payment.registration_fee !== null) {
        list[idx].registration_fee = payment.registration_fee;
      }
      localStorage.setItem("gnits_custom_workshops", JSON.stringify(list));
    }
  } catch (e) {
    console.error("Failed to save workshop payment info:", e);
  }
}

export async function uploadFileOrConvertToBase64(
  file: File,
  preferredBuckets: string[] = ["payment-screenshots", "website-assets"]
): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `asset-${Date.now()}-${cleanName}`;

  // Try available Supabase storage buckets
  for (const bucket of preferredBuckets) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: true });

      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch {
      // Continue to next bucket or fallback to base64
    }
  }

  // Resilient fallback: read as Base64 data URL (works 100% reliably even if buckets are missing)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to process image file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
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

export function getLocalDeletedWorkshops(): string[] {
  try {
    return JSON.parse(localStorage.getItem("gnits_deleted_workshops") || "[]");
  } catch {
    return [];
  }
}

export function markWorkshopDeleted(idOrSlug: string) {
  try {
    if (!idOrSlug) return;
    const list = getLocalDeletedWorkshops();
    if (!list.includes(idOrSlug)) {
      list.push(idOrSlug);
      localStorage.setItem("gnits_deleted_workshops", JSON.stringify(list));
    }
    // Also remove from custom workshops if saved there
    const custom = getLocalCustomWorkshops().filter((w) => w.id !== idOrSlug && w.slug !== idOrSlug);
    localStorage.setItem("gnits_custom_workshops", JSON.stringify(custom));
  } catch (e) {
    console.error("Failed to mark workshop as deleted:", e);
  }
}

export function getLocalCustomWorkshops(): Workshop[] {
  try {
    return JSON.parse(localStorage.getItem("gnits_custom_workshops") || "[]");
  } catch {
    return [];
  }
}

export function saveLocalCustomWorkshop(ws: Workshop) {
  try {
    const list = getLocalCustomWorkshops();
    const idx = list.findIndex((w) => w.id === ws.id || w.slug === ws.slug);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...ws };
    } else {
      list.push(ws);
    }
    localStorage.setItem("gnits_custom_workshops", JSON.stringify(list));

    // Remove from deleted list if re-added or saved
    const deleted = getLocalDeletedWorkshops().filter((d) => d !== ws.id && d !== ws.slug);
    localStorage.setItem("gnits_deleted_workshops", JSON.stringify(deleted));
  } catch (e) {
    console.error("Failed to save local custom workshop:", e);
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

export const WEB_DEVELOPMENT_WORKSHOP: Workshop = {
  id: "workshop-3-web-development",
  slug: "web-development",
  title: "Two-Days Hands-on Workshop on “Web Development: Frontend, Backend, APIs & Deployment”",
  subtitle: "under GNITS CSI & ACM-W Student Chapter",
  description:
    "A two-days hands-on workshop designed to equip students with hands-on, industry-oriented skills in full-stack web application development. The workshop covers frontend technologies, backend development, REST APIs, database integration, authentication, version control, API testing, and application deployment, culminating in the development of a complete real-world web application.",
  department: "CSE(DATA SCIENCE)",
  dates: "12th October 2026 – 13th October 2026",
  timings: "9:00 AM to 4:00 PM",
  venue: "Computer Lab - 12 & 13, IV Floor, Admin Block, GNITS, Hyderabad.",
  registration_fee: 200,
  seat_limit: 80,
  registration_open: true,
  hero_banner_url: null,
  brochure_url: null,
  upi_id: "thambalahari407-1@okaxis",
  account_name: "Tamba Lahari",
  qr_code_url: "https://qwnycqjgrgygpivoybfx.supabase.co/storage/v1/object/public/payment-qr/qr-code.png",
  sort_order: 3,
  is_featured: false,
  admin_username: "csd_admin",
  admin_password: "gnits@csd2026",
  outcomes: [
    {
      id: "outcome-1",
      icon: "Terminal",
      title: "Frontend Development",
      desc: "Build responsive and interactive web interfaces using modern frontend technologies and develop the user-facing components of web applications.",
    },
    {
      id: "outcome-2",
      icon: "Cpu",
      title: "Backend Development",
      desc: "Develop server-side applications and implement backend functionality to support complete web application workflows.",
    },
    {
      id: "outcome-3",
      icon: "Workflow",
      title: "REST APIs & Integration",
      desc: "Learn to create, consume, and integrate REST APIs to enable effective communication between frontend and backend systems.",
    },
    {
      id: "outcome-4",
      icon: "Sliders",
      title: "Database Integration",
      desc: "Connect web applications with databases and learn how to integrate and manage application data effectively.",
    },
    {
      id: "outcome-5",
      icon: "CheckCircle2",
      title: "Authentication & Version Control",
      desc: "Implement authentication mechanisms and apply version control practices for organized and collaborative application development.",
    },
    {
      id: "outcome-6",
      icon: "Target",
      title: "API Testing & Deployment",
      desc: "Perform API testing and learn application deployment techniques, culminating in the development of a complete real-world web application.",
    },
  ],
};

export function useWorkshops() {
  const { data: websiteSettings } = useWebsiteSettings();
  const { data: paymentSettings } = usePaymentSettings();

  return useQuery<Workshop[]>({
    queryKey: ["workshops", websiteSettings?.id, paymentSettings?.id],
    queryFn: async () => {
      const localCreds = getLocalWorkshopCredentials();
      const deletedList = getLocalDeletedWorkshops();
      const localCustom = getLocalCustomWorkshops();

      let fetchedWorkshops: Workshop[] = [];

      try {
        const { data, error } = await supabase
          .from("workshops" as never)
          .select("*")
          .order("sort_order");

        if (!error && Array.isArray(data) && data.length > 0) {
          fetchedWorkshops = (data as unknown as Workshop[]).map((ws) => {
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

      if (fetchedWorkshops.length === 0) {
        // Seamless fallback from website_settings & payment_settings
        fetchedWorkshops = [
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
            upi_id: null,
            account_name: null,
            qr_code_url: null,
            sort_order: 2,
            is_featured: false,
            admin_username: localCreds["agentic-ai-cloud"]?.username || "cse_admin",
            admin_password: localCreds["agentic-ai-cloud"]?.password || "gnits@cse2026",
          },
          {
            ...WEB_DEVELOPMENT_WORKSHOP,
            admin_username: localCreds["web-development"]?.username || WEB_DEVELOPMENT_WORKSHOP.admin_username,
            admin_password: localCreds["web-development"]?.password || WEB_DEVELOPMENT_WORKSHOP.admin_password,
          },
        ];
      }

      // Always guarantee web-development workshop exists
      if (!fetchedWorkshops.some((w) => w.slug === "web-development")) {
        fetchedWorkshops.push({
          ...WEB_DEVELOPMENT_WORKSHOP,
          admin_username: localCreds["web-development"]?.username || WEB_DEVELOPMENT_WORKSHOP.admin_username,
          admin_password: localCreds["web-development"]?.password || WEB_DEVELOPMENT_WORKSHOP.admin_password,
        });
      }

      // Merge locally created / edited workshops
      for (const customWs of localCustom) {
        const index = fetchedWorkshops.findIndex((w) => w.id === customWs.id || w.slug === customWs.slug);
        if (index >= 0) {
          // If customWs has outdated minimal placeholder title "Web Development" or generic venue, upgrade to the official web-development data
          const isStaleWebDev =
            customWs.slug === "web-development" &&
            (customWs.title === "Web Development" ||
              customWs.venue?.includes("Admin Block / Lab") ||
              !customWs.outcomes ||
              customWs.outcomes.length === 0);

          if (isStaleWebDev) {
            fetchedWorkshops[index] = {
              ...fetchedWorkshops[index],
              ...customWs,
              title: WEB_DEVELOPMENT_WORKSHOP.title,
              department: WEB_DEVELOPMENT_WORKSHOP.department,
              venue: WEB_DEVELOPMENT_WORKSHOP.venue,
              dates: WEB_DEVELOPMENT_WORKSHOP.dates,
              timings: WEB_DEVELOPMENT_WORKSHOP.timings,
              description: WEB_DEVELOPMENT_WORKSHOP.description,
              outcomes: WEB_DEVELOPMENT_WORKSHOP.outcomes,
              registration_fee: customWs.registration_fee ?? 200,
              seat_limit: customWs.seat_limit ?? 80,
            };
          } else {
            fetchedWorkshops[index] = { ...fetchedWorkshops[index], ...customWs };
          }
        } else {
          fetchedWorkshops.push(customWs);
        }
      }

      // Filter out deleted workshops
      const finalWorkshops = fetchedWorkshops.filter(
        (ws) => !deletedList.includes(ws.id) && !deletedList.includes(ws.slug)
      );

      const localOutcomes = getLocalWorkshopOutcomes();
      const localPayments = getLocalWorkshopPayments();
      return finalWorkshops.map((ws) => {
        const pay = localPayments[ws.slug.toLowerCase()];
        const customOutcomeList = localOutcomes[ws.slug.toLowerCase()];
        const hasCustomOutcomes = customOutcomeList && customOutcomeList.length > 0;
        return {
          ...ws,
          upi_id: pay?.upi_id !== undefined ? pay.upi_id : (ws.upi_id || null),
          account_name: pay?.account_name !== undefined ? pay.account_name : (ws.account_name || null),
          qr_code_url: pay?.qr_code_url !== undefined ? pay.qr_code_url : (ws.qr_code_url || null),
          registration_fee:
            pay?.registration_fee !== undefined && pay?.registration_fee !== null
              ? pay.registration_fee
              : (ws.registration_fee ?? 200),
          outcomes: hasCustomOutcomes
            ? customOutcomeList
            : ws.outcomes && ws.outcomes.length > 0
              ? ws.outcomes
              : getDefaultOutcomesForWorkshop(ws),
        };
      });
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

export function getLocalRegistrations(): RegistrationRecord[] {
  try {
    return JSON.parse(localStorage.getItem("gnits_local_registrations") || "[]");
  } catch {
    return [];
  }
}

export function saveLocalRegistration(record: RegistrationRecord) {
  try {
    const list = getLocalRegistrations();
    if (!list.some((r) => r.id === record.id || r.registration_id === record.registration_id)) {
      list.unshift(record);
      localStorage.setItem("gnits_local_registrations", JSON.stringify(list));
    }
  } catch (e) {
    console.error("Failed to save local registration:", e);
  }
}

export function deleteLocalRegistration(id: string) {
  try {
    const list = getLocalRegistrations();
    const updated = list.filter(
      (r) => r.id !== id && r.registration_id !== id && `local-${r.registration_id}` !== id
    );
    localStorage.setItem("gnits_local_registrations", JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete local registration:", e);
  }
}


export function updateLocalRegistrationScreenshot(id: string, screenshotUrl: string) {
  try {
    const list = getLocalRegistrations();
    const idx = list.findIndex((r) => r.id === id || r.registration_id === id);
    if (idx !== -1) {
      list[idx].payment_screenshot_url = screenshotUrl;
      localStorage.setItem("gnits_local_registrations", JSON.stringify(list));
    }
  } catch (e) {
    console.error("Failed to update local registration screenshot:", e);
  }
}

export function compressImageToBase64(file: File, maxWidth = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve((e.target?.result as string) || "");
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || "");
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}


export function isRegistrationForWorkshop(r: any, ws: Workshop): boolean {
  if (!r || !ws) return false;

  // 1. Direct slug match
  if (r.workshop_slug && typeof r.workshop_slug === "string") {
    return r.workshop_slug.toLowerCase() === ws.slug.toLowerCase();
  }

  // 2. Direct workshop_id match
  if (r.workshop_id && typeof r.workshop_id === "string") {
    return r.workshop_id === ws.id;
  }

  // 3. Match via custom_department tag: "ws:<slug>"
  if (r.custom_department && typeof r.custom_department === "string") {
    if (r.custom_department.startsWith("ws:")) {
      return r.custom_department.slice(3).toLowerCase() === ws.slug.toLowerCase();
    }
  }

  // 4. Match via registration_id prefix (e.g. GNITS-WEBD-..., GNITS-AIHU-...)
  const wsPrefix = ws.slug.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
  if (r.registration_id && typeof r.registration_id === "string" && wsPrefix) {
    if (r.registration_id.startsWith(`GNITS-${wsPrefix}-`)) {
      return true;
    }
  }

  // 5. Match via workshop_title
  if (r.workshop_title && ws.title && typeof r.workshop_title === "string") {
    if (r.workshop_title.toLowerCase().includes(ws.title.toLowerCase()) || ws.title.toLowerCase().includes(r.workshop_title.toLowerCase())) {
      return true;
    }
  }

  // 6. Only legacy untagged registrations belong to the default initial workshop (ai-humanoid-robot)
  if (!r.workshop_slug && (!r.registration_id || r.registration_id.startsWith("GNITS-AIHU-") || r.registration_id.startsWith("GNITS-10SEP-")) && ws.slug === "ai-humanoid-robot") {
    return true;
  }

  return false;
}

export function useRegistrations() {
  return useQuery<RegistrationRecord[]>({
    queryKey: ["registrations"],
    queryFn: async () => {
      let fetched: RegistrationRecord[] = [];
      try {
        const { data, error } = await supabase
          .from("registrations")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) {
          fetched = data as RegistrationRecord[];
        }
      } catch (err) {
        console.warn("Could not fetch remote registrations:", err);
      }

      // Merge local registrations
      const local = getLocalRegistrations();
      for (const loc of local) {
        if (!fetched.some((f) => f.id === loc.id || f.registration_id === loc.registration_id)) {
          fetched.unshift(loc);
        }
      }

      return fetched;
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
  const { data: allRegs = [] } = useRegistrations();
  const { data: workshops = [] } = useWorkshops();

  return useQuery({
    queryKey: ["registration_count", identifier, allRegs.length],
    queryFn: async () => {
      // If a specific workshop identifier is provided:
      if (identifier) {
        const cleanIdent = identifier.toLowerCase();
        const targetWs = workshops.find(
          (w) => w.slug.toLowerCase() === cleanIdent || w.id === identifier
        );

        // Count specifically from loaded registrations
        if (allRegs.length > 0) {
          const matchingCount = allRegs.filter((r) => {
            if (targetWs) return isRegistrationForWorkshop(r, targetWs);
            const wSlug = (r.workshop_slug || "").toLowerCase();
            if (wSlug === cleanIdent) return true;
            if (r.custom_department === `ws:${cleanIdent}`) return true;
            const prefix = cleanIdent.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
            if (r.registration_id && r.registration_id.startsWith(`GNITS-${prefix}-`)) return true;
            return false;
          }).length;
          return matchingCount;
        }

        // Try direct count from Supabase specifically for THIS workshop
        try {
          const prefix = cleanIdent.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
          const { count, error } = await supabase
            .from("registrations")
            .select("id", { count: "exact", head: true })
            .or(`workshop_slug.eq.${identifier},custom_department.eq.ws:${cleanIdent},registration_id.ilike.GNITS-${prefix}-%`);

          if (!error && typeof count === "number") {
            return count;
          }
        } catch {
          // ignore
        }

        // Try RPC specifically with the workshop identifier parameter
        try {
          const { data, error } = await supabase.rpc("get_registration_count" as any, {
            _workshop_identifier: identifier,
          });
          if (!error && typeof data === "number") return data;
        } catch {
          // ignore
        }

        // CRITICAL: NEVER return global total count when an individual workshop identifier was requested!
        return 0;
      }

      // If NO identifier is requested: return total count across all workshops
      try {
        const { data, error } = await supabase.rpc("get_registration_count" as any);
        if (!error && typeof data === "number") return data;
      } catch (err) {
        console.warn("Global registration count rpc failed:", err);
      }
      return allRegs.length;
    },
    refetchInterval: 10000,
  });
}
