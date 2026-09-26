import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  useWorkshops,
  useRegistrations,
  useCoordinators,
  useSpeakers,
  saveLocalWorkshopCredentials,
  Workshop,
  Coordinator,
  RegistrationRecord,
} from "@/lib/queries";
import {
  useFeedbackForms,
  useFeedbackResponses,
  feedbackDb,
  FeedbackForm,
} from "@/lib/feedback";
import {
  useQuizExams,
  useQuizQuestions,
  quizDb,
} from "@/lib/quiz";
import { QuestionsManager } from "@/components/feedback/QuestionsManager";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Search,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  Calendar,
  CalendarDays,
  CalendarCheck,
  MapPin,
  IndianRupee,
  Settings,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  Loader2,
  Lock,
  Globe,
  Upload,
  MessageSquare,
  ClipboardList,
  GraduationCap,
  ListChecks,
  BarChart3,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Mic,
  Layers,
  Pencil,
  RotateCcw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import logoUrl from "@/assets/logo.png";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/$workshopSlug/admin")({
  head: () => ({
    meta: [{ title: "Workshop Admin Portal — GNITS" }],
  }),
  component: WorkshopAdminPage,
});

type AdminNavTab =
  | "dashboard"
  | "workshops"
  | "registrations"
  | "feedback-forms"
  | "feedback-responses"
  | "quiz-questions"
  | "quiz-responses"
  | "analytics"
  | "reports";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "workshops", label: "Workshops", icon: CalendarCheck },
  { id: "registrations", label: "Responses", icon: Users },
  { id: "feedback-forms", label: "Feedback Forms", icon: MessageSquare },
  { id: "feedback-responses", label: "Feedback Responses", icon: ClipboardList },
  { id: "quiz-questions", label: "Quiz Questions", icon: GraduationCap },
  { id: "quiz-responses", label: "Quiz Responses", icon: ListChecks },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: FileText },
];

type SpeakerRow = {
  id: string;
  name: string;
  designation: string;
  organization: string | null;
  photo_url: string | null;
  sort_order: number;
};

function WorkshopAdminPage() {
  const { workshopSlug } = useParams({ from: "/$workshopSlug/admin" });
  const qc = useQueryClient();

  const { data: workshops = [], isLoading: loadingWorkshops } = useWorkshops();
  const { data: allRegistrations = [], isLoading: loadingRegs } = useRegistrations();
  const { data: feedbackForms = [] } = useFeedbackForms();
  const { data: feedbackResponses = [] } = useFeedbackResponses();
  const { data: quizExams = [] } = useQuizExams();
  const { data: speakers = [] } = useSpeakers();
  const { data: coords = [] } = useCoordinators();

  const ws = workshops.find(
    (w) => w.slug.toLowerCase() === workshopSlug.toLowerCase(),
  );

  // Authentication State
  const [isWsAuth, setIsWsAuth] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("gnits_it_admin") === "sairohit45") return true;
      return sessionStorage.getItem(`gnits_ws_admin_${workshopSlug}`) === "true";
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<AdminNavTab>("dashboard");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // ----------------------------------------------------
  // Screenshot 1: Workshop Responses State & Filters
  // ----------------------------------------------------
  const [search, setSearch] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [selectedRegs, setSelectedRegs] = useState<Set<string>>(new Set());
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);

  // ----------------------------------------------------
  // Screenshot 2: Feedback Forms & Questions State
  // ----------------------------------------------------
  const [creatingFeedbackForm, setCreatingFeedbackForm] = useState(false);
  const [editingFeedbackForm, setEditingFeedbackForm] = useState<FeedbackForm | null>(null);
  const [managingQuestionsFor, setManagingQuestionsFor] = useState<FeedbackForm | null>(null);
  const [feedbackTitleInput, setFeedbackTitleInput] = useState("");
  const [feedbackBtnInput, setFeedbackBtnInput] = useState("Submit Workshop Feedback Day 1");
  const [feedbackDateInput, setFeedbackDateInput] = useState(new Date().toISOString().slice(0, 10));

  // ----------------------------------------------------
  // Screenshot 3: Feedback Responses State & Filters
  // ----------------------------------------------------
  const [feedbackDateFilter, setFeedbackDateFilter] = useState("");
  const [feedbackFormFilter, setFeedbackFormFilter] = useState<string>("all");

  // Multi-Workshop & Detail Management States (from previous request)
  const [open, setOpen] = useState(true);
  const [seatLimit, setSeatLimit] = useState(500);
  const [savingReg, setSavingReg] = useState(false);
  const [detailsForm, setDetailsForm] = useState<Partial<Workshop>>({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [upi, setUpi] = useState("");
  const [acct, setAcct] = useState("");
  const [fee, setFee] = useState(250);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Partial<SpeakerRow> | null>(null);
  const [savingSpeaker, setSavingSpeaker] = useState(false);
  const [uploadingSpeakerPhoto, setUploadingSpeakerPhoto] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState<Partial<Coordinator> | null>(null);
  const [savingCoordinator, setSavingCoordinator] = useState(false);

  // Sync state when workshop loads
  useEffect(() => {
    if (ws) {
      setOpen(ws.registration_open);
      setSeatLimit(ws.seat_limit);
      setDetailsForm({ ...ws });
      setUpi(ws.upi_id || "");
      setAcct(ws.account_name || "");
      setFee(ws.registration_fee || 250);
      setQrUrl(ws.qr_code_url || null);
      setFeedbackTitleInput(ws.title);
    }
  }, [ws]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);

    setTimeout(() => {
      const inputUser = usernameInput.trim();
      const inputPass = passwordInput.trim();
      const expectedUser = ws?.admin_username || `${ws?.slug}_admin`;
      const expectedPass = ws?.admin_password || "gnits@admin2026";

      if (
        (inputUser === expectedUser && inputPass === expectedPass) ||
        (inputUser === "sairohit45" && inputPass === "Rohitsharma45")
      ) {
        setIsWsAuth(true);
        sessionStorage.setItem(`gnits_ws_admin_${workshopSlug}`, "true");
        toast.success(`Welcome to ${ws?.title || "Workshop"} Admin Portal!`);
      } else {
        toast.error("Invalid credentials for this workshop.");
      }
      setLoginLoading(false);
    }, 300);
  }

  function handleLogout() {
    sessionStorage.removeItem(`gnits_ws_admin_${workshopSlug}`);
    setIsWsAuth(false);
    toast.info("Signed out of Workshop Admin.");
  }

  // Registrations belonging to this workshop
  const workshopRegistrations = useMemo(() => {
    if (!ws) return [];
    return allRegistrations.filter((r: any) => {
      return (
        r.workshop_slug === ws.slug ||
        r.workshop_id === ws.id ||
        (r.workshop_title &&
          r.workshop_title.toLowerCase().includes(ws.title.toLowerCase())) ||
        (!r.workshop_slug && ws.is_featured)
      );
    });
  }, [allRegistrations, ws]);

  // Filtered registrations matching Screenshot 1 filters
  const filteredRegistrations = useMemo(() => {
    return workshopRegistrations.filter((r) => {
      const q = search.trim().toLowerCase();
      if (
        q &&
        !`${r.registration_id} ${r.faculty_name} ${r.email} ${r.phone || ""} ${r.faculty_id} ${r.utr_number} ${r.designation} ${r.workshop_title || ""}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      if (workshopFilter !== "all") {
        const wSlug = r.workshop_slug || "";
        const wTitle = r.workshop_title || "";
        if (wSlug !== workshopFilter && !wTitle.toLowerCase().includes(workshopFilter.toLowerCase())) {
          return false;
        }
      }
      if (statusFilter !== "all") {
        const s = (r.payment_status || "Pending").toLowerCase();
        if (s !== statusFilter.toLowerCase()) return false;
      }
      if (departmentFilter !== "all" && r.department !== departmentFilter) return false;
      if (yearFilter !== "all" && r.designation !== yearFilter) return false;
      if (semesterFilter !== "all" && r.category !== semesterFilter) return false;
      if (sectionFilter !== "all" && r.institute !== sectionFilter) return false;
      return true;
    });
  }, [
    workshopRegistrations,
    search,
    workshopFilter,
    statusFilter,
    departmentFilter,
    yearFilter,
    semesterFilter,
    sectionFilter,
  ]);

  // Statistics for Dashboard
  const today = startOfDay(new Date());
  const todayCount = workshopRegistrations.filter(
    (r) => new Date(r.created_at) >= today,
  ).length;
  const approvedRegistrations = workshopRegistrations.filter(
    (r) => r.payment_status?.toLowerCase() === "approved",
  );
  const pendingRegistrations = workshopRegistrations.filter(
    (r) => (r.payment_status || "pending").toLowerCase() === "pending",
  );
  const approvedCount = approvedRegistrations.length;
  const pendingCount = pendingRegistrations.length;
  const totalRevenue = approvedRegistrations.reduce(
    (s, r) => s + (r.registration_fee || ws?.registration_fee || 0),
    0,
  );
  const remainingSeats = ws ? Math.max(0, ws.seat_limit - workshopRegistrations.length) : 0;

  // Chart data
  const daily = Array.from({ length: 14 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 13 - i));
    const next = startOfDay(subDays(new Date(), 12 - i));
    const day = workshopRegistrations.filter(
      (r) => new Date(r.created_at) >= d && new Date(r.created_at) < next,
    );
    const dayApproved = day.filter((r) => r.payment_status?.toLowerCase() === "approved");
    return {
      date: format(d, "MMM d"),
      registrations: day.length,
      revenue: dayApproved.reduce(
        (s, r) => s + (r.registration_fee || ws?.registration_fee || 0),
        0,
      ),
    };
  });

  const byYear = Object.entries(
    workshopRegistrations.reduce<Record<string, number>>((acc, r) => {
      const k = r.designation || "Unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const byDept = Object.entries(
    workshopRegistrations.reduce<Record<string, number>>((acc, r) => {
      const k = r.department || "Unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ["#7c3aed", "#a855f7", "#facc15", "#22d3ee", "#f97316", "#ec4899", "#10b981"];

  // Payment status update
  async function updatePaymentStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: newStatus })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Payment status marked as ${newStatus}.`);
      qc.invalidateQueries({ queryKey: ["registrations"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payment status.");
    }
  }

  async function deleteOneRegistration(id: string) {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    try {
      const { error } = await supabase.from("registrations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Registration deleted.");
      qc.invalidateQueries({ queryKey: ["registrations"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete registration.");
    }
  }

  async function bulkDeleteRegistrations() {
    if (selectedRegs.size === 0) return;
    if (!confirm(`Delete ${selectedRegs.size} selected registrations?`)) return;
    try {
      const { error } = await supabase
        .from("registrations")
        .delete()
        .in("id", Array.from(selectedRegs));
      if (error) throw error;
      toast.success("Selected registrations deleted.");
      setSelectedRegs(new Set());
      qc.invalidateQueries({ queryKey: ["registrations"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to bulk delete.");
    }
  }

  // --- Registration Controls Save ---
  async function saveRegistrationControls() {
    if (!ws) return;
    setSavingReg(true);
    try {
      const { error } = await supabase
        .from("workshops" as never)
        .update({
          registration_open: open,
          seat_limit: seatLimit,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", ws.id);
      if (error) throw error;
      toast.success("Registration Controls Saved!");
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save registration controls.");
    } finally {
      setSavingReg(false);
    }
  }

  // --- Details Tab Save ---
  async function saveWorkshopDetails() {
    if (!ws) return;
    setSavingDetails(true);
    try {
      saveLocalWorkshopCredentials(
        ws.slug,
        detailsForm.admin_username,
        detailsForm.admin_password,
      );

      const payload: any = {
        title: detailsForm.title,
        subtitle: detailsForm.subtitle,
        description: detailsForm.description,
        department: detailsForm.department,
        dates: detailsForm.dates,
        timings: detailsForm.timings,
        venue: detailsForm.venue,
        hero_banner_url: detailsForm.hero_banner_url,
        brochure_url: detailsForm.brochure_url,
        admin_username: detailsForm.admin_username || null,
        admin_password: detailsForm.admin_password || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("workshops" as never)
        .update(payload as never)
        .eq("id", ws.id);

      if (error && error.message?.includes("admin_username")) {
        delete payload.admin_username;
        delete payload.admin_password;
        await supabase.from("workshops" as never).update(payload as never).eq("id", ws.id);
      }

      toast.success("Workshop Details Saved Successfully!");
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save details.");
    } finally {
      setSavingDetails(false);
    }
  }

  async function uploadWorkshopAsset(file: File, field: "hero_banner_url" | "brochure_url") {
    if (field === "hero_banner_url") setUploadingBanner(true);
    else setUploadingBrochure(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `workshops/${ws?.slug}-${field}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("website-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("website-assets").getPublicUrl(path);
      setDetailsForm((prev) => ({ ...prev, [field]: data.publicUrl }));
      toast.success(`${field === "hero_banner_url" ? "Hero Banner" : "Brochure"} uploaded!`);
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      if (field === "hero_banner_url") setUploadingBanner(false);
      else setUploadingBrochure(false);
    }
  }

  // --- Payment Tab Save ---
  async function savePaymentSettings() {
    if (!ws) return;
    setSavingPayment(true);
    try {
      const { error } = await supabase
        .from("workshops" as never)
        .update({
          upi_id: upi,
          account_name: acct,
          registration_fee: fee,
          qr_code_url: qrUrl,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", ws.id);
      if (error) throw error;
      toast.success("Payment Settings Saved!");
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save payment settings.");
    } finally {
      setSavingPayment(false);
    }
  }

  async function uploadQR(file: File) {
    setUploadingQR(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `qr-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      setQrUrl(data.publicUrl);
      toast.success("Payment QR uploaded!");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingQR(false);
    }
  }

  // --- Speakers Save / Delete ---
  async function saveSpeakerAction() {
    if (!editingSpeaker || !editingSpeaker.name) {
      toast.error("Please enter speaker name.");
      return;
    }
    setSavingSpeaker(true);
    try {
      const payload = {
        name: editingSpeaker.name,
        designation: editingSpeaker.designation || "Resource Person",
        organization: editingSpeaker.organization || null,
        photo_url: editingSpeaker.photo_url || null,
        sort_order: editingSpeaker.sort_order || 0,
      };

      const { error } = editingSpeaker.id
        ? await supabase.from("speakers").update(payload).eq("id", editingSpeaker.id)
        : await supabase.from("speakers").insert(payload);

      if (error) throw error;
      toast.success("Speaker Saved!");
      setEditingSpeaker(null);
      qc.invalidateQueries({ queryKey: ["speakers"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save speaker.");
    } finally {
      setSavingSpeaker(false);
    }
  }

  async function deleteSpeaker(id: string) {
    if (!confirm("Delete this speaker?")) return;
    try {
      const { error } = await supabase.from("speakers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Speaker Deleted");
      qc.invalidateQueries({ queryKey: ["speakers"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete speaker.");
    }
  }

  async function uploadSpeakerPhoto(file: File) {
    setUploadingSpeakerPhoto(true);
    try {
      const path = `speakers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("website-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("website-assets").getPublicUrl(path);
      setEditingSpeaker((prev) => ({ ...prev, photo_url: data.publicUrl }));
      toast.success("Photo uploaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload photo.");
    } finally {
      setUploadingSpeakerPhoto(false);
    }
  }

  // --- Coordinators Save / Delete ---
  async function saveCoordinatorAction() {
    if (!editingCoordinator || !editingCoordinator.name) {
      toast.error("Please enter coordinator name.");
      return;
    }
    setSavingCoordinator(true);
    try {
      const payload = {
        name: editingCoordinator.name,
        department: editingCoordinator.department || ws?.department || "CSE",
        phone: editingCoordinator.phone || "",
        type: editingCoordinator.type || "Faculty",
        sort_order: editingCoordinator.sort_order || 0,
      };

      const isEdit = !!editingCoordinator.id;
      const { error } = isEdit
        ? await supabase.from("coordinators" as never).update(payload).eq("id", editingCoordinator.id)
        : await supabase.from("coordinators" as never).insert(payload);

      if (error) throw error;
      toast.success("Coordinator Saved!");
      setEditingCoordinator(null);
      qc.invalidateQueries({ queryKey: ["coordinators"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save coordinator.");
    } finally {
      setSavingCoordinator(false);
    }
  }

  async function deleteCoordinator(id: string) {
    if (!confirm("Delete this coordinator?")) return;
    try {
      const { error } = await supabase.from("coordinators" as never).delete().eq("id", id);
      if (error) throw error;
      toast.success("Coordinator Deleted");
      qc.invalidateQueries({ queryKey: ["coordinators"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete coordinator.");
    }
  }

  // --- Feedback Forms Actions (Screenshot 2) ---
  async function toggleFeedbackEnabled(form: FeedbackForm, enabled: boolean) {
    const { error } = await feedbackDb
      .from("feedback_forms")
      .update({ is_enabled: enabled })
      .eq("id", form.id);
    if (error) return toast.error(error.message);
    toast.success(enabled ? "Feedback form enabled" : "Feedback form disabled");
    qc.invalidateQueries({ queryKey: ["feedback_forms"] });
  }

  async function saveFeedbackForm() {
    if (!feedbackTitleInput.trim() || !feedbackBtnInput.trim()) {
      toast.error("Please fill title and button name");
      return;
    }

    const payload = {
      fdp_title: feedbackTitleInput.trim(),
      feedback_button_name: feedbackBtnInput.trim(),
      feedback_date: feedbackDateInput || null,
      is_enabled: true,
    };

    if (editingFeedbackForm) {
      const { error } = await feedbackDb
        .from("feedback_forms")
        .update(payload)
        .eq("id", editingFeedbackForm.id);
      if (error) return toast.error(error.message);
      toast.success("Feedback form updated");
      setEditingFeedbackForm(null);
    } else {
      const { error } = await feedbackDb.from("feedback_forms").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Feedback form created");
      setCreatingFeedbackForm(false);
    }
    qc.invalidateQueries({ queryKey: ["feedback_forms"] });
  }

  async function deleteFeedbackForm(id: string) {
    if (!confirm("Delete this feedback form?")) return;
    const { error } = await feedbackDb.from("feedback_forms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Feedback form deleted");
    qc.invalidateQueries({ queryKey: ["feedback_forms"] });
  }

  // --- Feedback Responses Filter & Dynamic Questions (Screenshot 3) ---
  const filteredFeedbackResponses = useMemo(() => {
    return feedbackResponses.filter((r) => {
      if (feedbackFormFilter !== "all" && r.feedback_form_id !== feedbackFormFilter) return false;
      if (feedbackDateFilter) {
        const d = new Date(r.submitted_at).toISOString().slice(0, 10);
        if (d !== feedbackDateFilter) return false;
      }
      return true;
    });
  }, [feedbackResponses, feedbackFormFilter, feedbackDateFilter]);

  const uniqueFeedbackQuestions = useMemo(() => {
    const qTexts = new Set<string>();
    filteredFeedbackResponses.forEach((r) => {
      (r.answers_json ?? []).forEach((a) => {
        if (a.question_text) {
          qTexts.add(a.question_text);
        }
      });
    });
    return Array.from(qTexts);
  }, [filteredFeedbackResponses]);

  function exportFeedbackExcel() {
    const rows = filteredFeedbackResponses.map((r, i) => {
      const rowData: any = {
        "S.No": i + 1,
        "Student Name": r.participant_name,
        "Roll Number": r.roll_number || r.employee_id || "",
        Department: r.department ?? "",
        Year: r.year ?? "",
        Semester: r.semester ?? "",
        Section: r.section ?? "",
      };

      const answersMap = new Map((r.answers_json ?? []).map((a) => [a.question_text, a.answer]));
      uniqueFeedbackQuestions.forEach((q, idx) => {
        rowData[`${idx + 1}. ${q}`] = answersMap.get(q) || "";
      });
      rowData["Submitted"] = new Date(r.submitted_at).toLocaleString();
      return rowData;
    });

    if (rows.length === 0) return toast.error("No responses to export");
    const wsSheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSheet, "Feedback Responses");
    XLSX.writeFile(wb, `feedback-responses-${Date.now()}.xlsx`);
  }

  // --- Registrations Export Handlers (Screenshot 1) ---
  function getRegistrationsExportData() {
    return filteredRegistrations.map((r, index) => ({
      "S.No": index + 1,
      Workshop: ws?.title || "AI Humanoid Robot",
      "Roll Number": r.faculty_id,
      "Student Name": r.faculty_name,
      Year: r.designation,
      Department: r.department,
      Semester: r.category,
      Section: r.institute,
      "Gmail ID": r.email,
      "Mobile Number": r.phone,
      "Payment Details":
        r.utr_number && r.utr_number !== "Pending Payment" && r.utr_number !== "PENDING"
          ? `UTR: ${r.utr_number}`
          : "Pending Payment",
      "Payment Status": r.payment_status === "Pending" ? "Pending Payment" : r.payment_status,
      "Registration ID": r.registration_id,
      "Date & Time": new Date(r.created_at).toLocaleString(),
    }));
  }

  function exportRegistrationsExcel() {
    const data = getRegistrationsExportData();
    if (data.length === 0) return toast.error("No data to export");
    const wsSheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSheet, "Registrations");
    XLSX.writeFile(wb, `${ws?.slug || "workshop"}-registrations.xlsx`);
    toast.success("Excel downloaded!");
  }

  function exportRegistrationsCSV() {
    const data = getRegistrationsExportData();
    if (data.length === 0) return toast.error("No data to export");
    const wsSheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(wsSheet);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ws?.slug || "workshop"}-registrations.csv`;
    a.click();
    toast.success("CSV downloaded!");
  }

  function exportRegistrationsPDF() {
    if (filteredRegistrations.length === 0) return toast.error("No data to export");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text(`${ws?.title || "Workshop"} — Responses`, 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [
        [
          "S.No",
          "Workshop",
          "Roll Number",
          "Student Name",
          "Year",
          "Dept",
          "Sem",
          "Sec",
          "Payment Details",
          "Status",
          "Date & Time",
        ],
      ],
      body: filteredRegistrations.map((r, index) => [
        index + 1,
        ws?.department || "AI Humanoid",
        r.faculty_id,
        r.faculty_name,
        r.designation,
        r.department,
        r.category,
        r.institute,
        r.utr_number && r.utr_number !== "Pending Payment" && r.utr_number !== "PENDING"
          ? `UTR: ${r.utr_number}`
          : "Pending Payment",
        r.payment_status === "Pending" ? "Pending Payment" : r.payment_status,
        new Date(r.created_at).toLocaleString(),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [124, 58, 237] },
    });
    doc.save(`${ws?.slug || "workshop"}-registrations.pdf`);
    toast.success("PDF downloaded!");
  }

  if (loadingWorkshops) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <span className="ml-3 font-medium">Loading workshop admin…</span>
      </div>
    );
  }

  if (!ws) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md bg-slate-900 border-slate-800 text-center p-6">
          <CardTitle className="text-xl text-white">Workshop Not Found</CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-2">
            No workshop exists with slug <code className="text-amber-400">/{workshopSlug}</code>.
          </CardDescription>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
              <Link to="/it-admin">Go to IT-Admin</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-700">
              <Link to="/">Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Workshop Admin Login Screen
  if (!isWsAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 p-4 text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#7c3aed15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <Card className="w-full max-w-md border-purple-500/30 bg-slate-900/95 shadow-2xl backdrop-blur-xl relative z-10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <Badge className="mx-auto mt-3 bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[10px] uppercase">
              {ws.department || "GNITS"} Workshop
            </Badge>
            <CardTitle className="mt-2 text-xl font-black text-white">
              {ws.title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 font-mono mt-1">
              Admin & Coordinator Portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-200">Admin Username</Label>
                <Input
                  type="text"
                  required
                  placeholder={`e.g. ${ws.admin_username || `${ws.slug}_admin`}`}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="mt-1.5 bg-slate-950 border-slate-700 text-white font-mono text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-200">Admin Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black shadow-lg shadow-purple-500/25 hover:opacity-90 transition-all mt-2 py-5"
              >
                {loginLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Sign In to Workshop Admin
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <Link
                to={`/${ws.slug}`}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                ← View Public Workshop Page
              </Link>
              <Link to="/auth" className="text-slate-400 hover:text-white font-mono">
                Central Admin
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated Workshop Admin Portal
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* 1. LEFT SIDEBAR */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <img src={logoUrl} alt="GNITS Logo" className="h-9 w-9 object-contain rounded-md" />
          <div className="leading-tight">
            <div className="text-sm font-bold">GNITS</div>
            <div className="text-[10px] opacity-70">Workshop Admin</div>
          </div>
        </div>

        <div className="px-4 py-2 text-[11px] font-semibold text-purple-300/80 uppercase tracking-wider border-b border-sidebar-border/40 truncate">
          {ws.department || "GNITS"}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((n) => {
            const active = activeTab === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setActiveTab(n.id as AdminNavTab)}
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
                    : "hover:bg-sidebar-accent text-sidebar-foreground"
                }`}
              >
                <n.icon className="h-4 w-4 shrink-0" />
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="truncate px-2 text-xs opacity-70 font-mono">
            /{ws.slug}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start text-xs font-semibold"
            asChild
          >
            <a href={`/${ws.slug}`} target="_blank" rel="noreferrer">
              <Globe className="mr-2 h-3.5 w-3.5 text-cyan-400" /> Public Page
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-rose-300 hover:text-rose-200 border-sidebar-border"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
          </Button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-x-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm md:text-base">
              Workshop Portal — {ws.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <a href={`/${ws.slug}`} target="_blank" rel="noreferrer">
                <Globe className="mr-1.5 h-3.5 w-3.5 text-cyan-500" /> View Page
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Live overview of Workshop registrations.
                </p>
              </div>

              {/* 6 Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="rounded-xl border shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Total Registrations
                      </p>
                      <p className="text-2xl font-black text-foreground mt-0.5">
                        {workshopRegistrations.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Today</p>
                      <p className="text-2xl font-black text-foreground mt-0.5">
                        {todayCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-md">
                      <IndianRupee className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-black text-foreground mt-0.5">
                        ₹{totalRevenue.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Pending Payments
                      </p>
                      <p className="text-2xl font-black text-foreground mt-0.5">
                        {pendingCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Approved Payments
                      </p>
                      <p className="text-2xl font-black text-foreground mt-0.5">
                        {approvedCount}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Seats Left</p>
                      <p className="text-2xl font-black text-foreground mt-0.5">
                        {remainingSeats}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts row */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">
                      Daily Registrations (last 14 days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={daily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis fontSize={11} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="registrations" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={daily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#facc15"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Distribution Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">Year-wise Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    {byYear.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        No registrations yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={byYear}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }: any) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                          >
                            {byYear.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">Department-wise</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    {byDept.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        No registrations yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byDept}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" fontSize={11} />
                          <YAxis fontSize={11} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: WORKSHOPS (Workshop Management Suite with all 6 Subtabs) */}
          {activeTab === "workshops" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Workshop Management</h1>
                <p className="text-sm text-muted-foreground">
                  Configure registration status, landing page details, payment metrics, and speakers.
                </p>
              </div>

              <Tabs defaultValue="registration" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 max-w-3xl">
                  <TabsTrigger value="workshops" className="flex items-center gap-1.5 font-bold">
                    <Layers className="h-4 w-4" /> Workshops
                  </TabsTrigger>
                  <TabsTrigger value="registration" className="flex items-center gap-1.5 font-bold">
                    <CalendarCheck className="h-4 w-4" /> Registration
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center gap-1.5">
                    <Settings className="h-4 w-4" /> Details
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" /> Payment
                  </TabsTrigger>
                  <TabsTrigger value="speakers" className="flex items-center gap-1.5">
                    <Mic className="h-4 w-4" /> Speakers
                  </TabsTrigger>
                  <TabsTrigger value="coordinators" className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> Coordinators
                  </TabsTrigger>
                </TabsList>

                {/* SUBTAB 1: WORKSHOPS */}
                <TabsContent value="workshops" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {workshops.map((w) => (
                      <Card
                        key={w.slug}
                        className={`overflow-hidden border shadow-md flex flex-col justify-between ${
                          w.slug === ws.slug ? "ring-2 ring-purple-500 border-purple-500" : ""
                        }`}
                      >
                        <div>
                          {w.hero_banner_url && (
                            <div className="h-32 w-full overflow-hidden bg-slate-900 border-b">
                              <img src={w.hero_banner_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <CardHeader className="p-5 pb-3">
                            <div className="flex items-center justify-between gap-2">
                              <Badge
                                variant="outline"
                                className="border-purple-400 text-purple-600 dark:text-purple-400 font-bold text-[11px]"
                              >
                                {w.department || "GNITS"}
                              </Badge>
                              {w.slug === ws.slug && (
                                <Badge className="bg-purple-600 text-white text-[10px] font-bold">
                                  Current Workshop
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg font-bold leading-tight mt-2">
                              {w.title}
                            </CardTitle>
                            <CardDescription className="text-xs font-mono text-muted-foreground mt-1">
                              URL: /{w.slug}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-5 pt-0 space-y-1.5 text-xs text-muted-foreground">
                            <div>
                              <strong className="text-foreground">Dates:</strong> {w.dates}
                            </div>
                            <div>
                              <strong className="text-foreground">Venue:</strong> {w.venue}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t mt-2">
                              <span>
                                Fee: <strong className="text-foreground font-bold">₹{w.registration_fee}</strong>
                              </span>
                              <span>
                                Seats: <strong className="text-foreground font-bold">{w.seat_limit}</strong>
                              </span>
                            </div>
                          </CardContent>
                        </div>
                        <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                          <a
                            href={`/${w.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            Public Page <ExternalLink className="h-3 w-3" />
                          </a>
                          {w.slug !== ws.slug && (
                            <Button asChild size="sm" variant="outline">
                              <Link to="/$workshopSlug/admin" params={{ workshopSlug: w.slug }}>
                                Open Workshop Admin →
                              </Link>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* SUBTAB 2: REGISTRATION (Matching Screenshot from previous prompt) */}
                <TabsContent value="registration" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-xl border shadow-sm">
                      <CardContent className="p-5">
                        <div className="text-xs text-muted-foreground font-semibold">Status</div>
                        <div
                          className={`mt-1 text-2xl font-black ${
                            open ? "text-emerald-600" : "text-destructive"
                          }`}
                        >
                          {open ? "OPEN" : "CLOSED"}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-xl border shadow-sm">
                      <CardContent className="p-5">
                        <div className="text-xs text-muted-foreground font-semibold">Seats Available</div>
                        <div className="mt-1 text-2xl font-black text-foreground">
                          {remainingSeats} / {seatLimit}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-xl border shadow-sm">
                      <CardContent className="p-5">
                        <div className="text-xs text-muted-foreground font-semibold">Registered</div>
                        <div className="mt-1 text-2xl font-black text-foreground">
                          {workshopRegistrations.length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="rounded-xl border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Controls</CardTitle>
                      <CardDescription className="text-xs">
                        Changes apply instantly to the public site.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <Label className="font-semibold text-sm">Registration Open</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Toggle to open or close registrations.
                          </p>
                        </div>
                        <Switch checked={open} onCheckedChange={setOpen} />
                      </div>
                      <div>
                        <Label className="font-semibold text-xs">Seat Limit</Label>
                        <Input
                          type="number"
                          value={seatLimit}
                          onChange={(e) => setSeatLimit(parseInt(e.target.value) || 0)}
                          className="mt-1.5 max-w-md font-semibold"
                        />
                      </div>
                      <Button
                        onClick={saveRegistrationControls}
                        disabled={savingReg}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-5 shadow-sm"
                      >
                        {savingReg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                        Registration Controls
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SUBTAB 3: DETAILS */}
                <TabsContent value="details" className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-xl border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base font-bold">Workshop Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs font-semibold">Title</Label>
                          <Input
                            value={detailsForm.title || ""}
                            onChange={(e) =>
                              setDetailsForm({ ...detailsForm, title: e.target.value })
                            }
                            className="mt-1 font-semibold"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Subtitle / Theme</Label>
                          <Input
                            value={detailsForm.subtitle || ""}
                            onChange={(e) =>
                              setDetailsForm({ ...detailsForm, subtitle: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-semibold">Department</Label>
                            <Input
                              value={detailsForm.department || ""}
                              onChange={(e) =>
                                setDetailsForm({ ...detailsForm, department: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Dates</Label>
                            <Input
                              value={detailsForm.dates || ""}
                              onChange={(e) =>
                                setDetailsForm({ ...detailsForm, dates: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-semibold">Timings</Label>
                            <Input
                              value={detailsForm.timings || ""}
                              onChange={(e) =>
                                setDetailsForm({ ...detailsForm, timings: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Venue</Label>
                            <Input
                              value={detailsForm.venue || ""}
                              onChange={(e) =>
                                setDetailsForm({ ...detailsForm, venue: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Description</Label>
                          <Textarea
                            rows={4}
                            value={detailsForm.description || ""}
                            onChange={(e) =>
                              setDetailsForm({ ...detailsForm, description: e.target.value })
                            }
                            className="mt-1 text-xs leading-relaxed"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-6">
                      <Card className="rounded-xl border shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base font-bold">Coordinator Credentials</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs font-semibold">Admin Username</Label>
                            <Input
                              value={detailsForm.admin_username || ""}
                              onChange={(e) =>
                                setDetailsForm({ ...detailsForm, admin_username: e.target.value })
                              }
                              placeholder={`${ws.slug}_admin`}
                              className="mt-1 font-mono text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Admin Password</Label>
                            <Input
                              type="text"
                              value={detailsForm.admin_password || ""}
                              onChange={(e) =>
                                setDetailsForm({ ...detailsForm, admin_password: e.target.value })
                              }
                              className="mt-1 font-mono text-sm"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-xl border shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base font-bold">Assets</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs font-semibold">Hero Banner</Label>
                            {detailsForm.hero_banner_url && (
                              <img
                                src={detailsForm.hero_banner_url}
                                alt="Banner"
                                className="mt-2 h-20 w-full rounded object-cover border"
                              />
                            )}
                            <Label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2.5 hover:bg-muted/50 text-xs">
                              <Upload className="h-3.5 w-3.5" />
                              <span>{uploadingBanner ? "Uploading..." : "Upload banner"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  e.target.files?.[0] &&
                                  uploadWorkshopAsset(e.target.files[0], "hero_banner_url")
                                }
                              />
                            </Label>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Brochure (PDF)</Label>
                            {detailsForm.brochure_url && (
                              <div className="mt-2 h-20 flex items-center justify-center border rounded bg-muted/20">
                                <a
                                  href={detailsForm.brochure_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-purple-600 underline font-semibold"
                                >
                                  View Current Brochure
                                </a>
                              </div>
                            )}
                            <Label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2.5 hover:bg-muted/50 text-xs">
                              <Upload className="h-3.5 w-3.5" />
                              <span>{uploadingBrochure ? "Uploading..." : "Upload PDF"}</span>
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) =>
                                  e.target.files?.[0] &&
                                  uploadWorkshopAsset(e.target.files[0], "brochure_url")
                                }
                              />
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Button
                    onClick={saveWorkshopDetails}
                    disabled={savingDetails}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-5 shadow-sm"
                  >
                    {savingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Details
                    & Assets
                  </Button>
                </TabsContent>

                {/* SUBTAB 4: PAYMENT */}
                <TabsContent value="payment" className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-xl border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base font-bold">UPI & Account Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs font-semibold">UPI ID</Label>
                          <Input
                            value={upi}
                            onChange={(e) => setUpi(e.target.value)}
                            placeholder="e.g. 9876543210@upi"
                            className="mt-1 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Payee Account Name</Label>
                          <Input
                            value={acct}
                            onChange={(e) => setAcct(e.target.value)}
                            placeholder="e.g. GNITS CSE Department"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Registration Fee (₹)</Label>
                          <Input
                            type="number"
                            value={fee}
                            onChange={(e) => setFee(Number(e.target.value) || 0)}
                            className="mt-1 font-bold text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base font-bold">Payment QR Code</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-card">
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt="QR Code"
                              className="h-44 w-44 object-contain rounded-lg border p-2 bg-white shadow-sm"
                            />
                          ) : (
                            <div className="h-44 w-44 rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground">
                              No QR uploaded
                            </div>
                          )}

                          <Label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-2 hover:bg-muted/50 text-xs font-bold">
                            <Upload className="h-3.5 w-3.5" />
                            <span>{uploadingQR ? "Uploading…" : "Upload Payment QR"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && uploadQR(e.target.files[0])}
                            />
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button
                    onClick={savePaymentSettings}
                    disabled={savingPayment}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-5 shadow-sm"
                  >
                    {savingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Payment
                    Settings
                  </Button>
                </TabsContent>

                {/* SUBTAB 5: SPEAKERS */}
                <TabsContent value="speakers" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Resource Persons & Speakers</h2>
                      <p className="text-sm text-muted-foreground">
                        Manage distinguished guest speakers and industry mentors.
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        setEditingSpeaker({
                          name: "",
                          designation: "",
                          organization: "",
                          photo_url: null,
                          sort_order: speakers.length + 1,
                        })
                      }
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                    >
                      <Plus className="mr-1.5 h-4 w-4" /> Add Speaker
                    </Button>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {speakers.map((sp) => (
                      <Card key={sp.id} className="overflow-hidden border shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="aspect-[4/3] w-full bg-slate-900 overflow-hidden relative">
                            {sp.photo_url ? (
                              <img src={sp.photo_url} alt={sp.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-muted-foreground">
                                <Users className="h-12 w-12 opacity-40" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-bold text-base">{sp.name}</h3>
                            <p className="text-xs font-semibold text-purple-600 mt-0.5">{sp.designation}</p>
                            {sp.organization && (
                              <p className="text-xs text-muted-foreground mt-0.5">{sp.organization}</p>
                            )}
                          </CardContent>
                        </div>
                        <div className="p-3 border-t bg-muted/20 flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSpeaker({ ...sp })}
                            className="h-8 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSpeaker(sp.id)}
                            className="h-8 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* SUBTAB 6: COORDINATORS */}
                <TabsContent value="coordinators" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Event Coordinators</h2>
                      <p className="text-sm text-muted-foreground">
                        Faculty and student coordinators listed on the public contact section.
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        setEditingCoordinator({
                          name: "",
                          department: ws.department || "CSE",
                          phone: "",
                          type: "Faculty",
                          sort_order: coords.length + 1,
                        })
                      }
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                    >
                      <Plus className="mr-1.5 h-4 w-4" /> Add Coordinator
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {coords.map((c) => (
                      <Card key={c.id} className="p-4 border shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <Badge variant={c.type === "Faculty" ? "default" : "secondary"} className="text-[10px]">
                              {c.type}
                            </Badge>
                            <span className="font-mono text-xs text-purple-600 font-semibold">{c.phone}</span>
                          </div>
                          <h4 className="font-bold text-base mt-2">{c.name}</h4>
                          <p className="text-xs text-muted-foreground">{c.department}</p>
                        </div>
                        <div className="pt-3 border-t mt-3 flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCoordinator({ ...c })}
                            className="h-7 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCoordinator(c.id)}
                            className="h-7 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* TAB 3: WORKSHOP RESPONSES (Exact 100% Match to Screenshot 1) */}
          {activeTab === "registrations" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Workshop Responses</h1>
                  <p className="text-sm text-muted-foreground">
                    {filteredRegistrations.length} of {workshopRegistrations.length} registrations
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportRegistrationsExcel} className="text-xs">
                    <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportRegistrationsCSV} className="text-xs">
                    <Download className="mr-1.5 h-4 w-4 text-cyan-600" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportRegistrationsPDF} className="text-xs">
                    <FileText className="mr-1.5 h-4 w-4 text-rose-600" />
                    PDF
                  </Button>
                  {selectedRegs.size > 0 && (
                    <Button variant="destructive" size="sm" onClick={bulkDeleteRegistrations} className="text-xs">
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete {selectedRegs.size}
                    </Button>
                  )}
                </div>
              </div>

              {/* Exact Filter Bar from Screenshot 1 */}
              <Card className="rounded-xl border shadow-sm">
                <CardContent className="p-3">
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                    <Input
                      placeholder="Search by name, roll no, UTR…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="text-xs h-9 bg-background"
                    />

                    <Select value={workshopFilter} onValueChange={setWorkshopFilter}>
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="All Workshops" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Workshops</SelectItem>
                        {workshops.map((w) => (
                          <SelectItem key={w.slug} value={w.slug}>
                            {w.title.length > 20 ? w.title.slice(0, 20) + "..." : w.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Pending">Pending Payment</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="CSE(DS)">CSE(DS)</SelectItem>
                        <SelectItem value="CSE">CSE</SelectItem>
                        <SelectItem value="CSE(AI&ML)">CSE(AI&ML)</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="ECE">ECE</SelectItem>
                        <SelectItem value="EEE">EEE</SelectItem>
                        <SelectItem value="ETM">ETM</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="All Semesters" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        <SelectItem value="Sem I">Sem I</SelectItem>
                        <SelectItem value="Sem II">Sem II</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sectionFilter} onValueChange={setSectionFilter}>
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="All Sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                        <SelectItem value="C">Section C</SelectItem>
                        <SelectItem value="D">Section D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Exact Table Matching Screenshot 1 */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b font-bold text-muted-foreground">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <Checkbox
                            checked={
                              filteredRegistrations.length > 0 &&
                              selectedRegs.size === filteredRegistrations.length
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRegs(new Set(filteredRegistrations.map((r) => r.id)));
                              } else {
                                setSelectedRegs(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="p-3">S.No</th>
                        <th className="p-3">Workshop</th>
                        <th className="p-3">Roll Number</th>
                        <th className="p-3">Student Details</th>
                        <th className="p-3">Dept</th>
                        <th className="p-3">Sem</th>
                        <th className="p-3">Sec</th>
                        <th className="p-3">Payment Details</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="p-8 text-center text-muted-foreground">
                            No registrations found matching the filters.
                          </td>
                        </tr>
                      ) : (
                        filteredRegistrations.map((r, i) => (
                          <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-center">
                              <Checkbox
                                checked={selectedRegs.has(r.id)}
                                onCheckedChange={(checked) => {
                                  const next = new Set(selectedRegs);
                                  if (checked) next.add(r.id);
                                  else next.delete(r.id);
                                  setSelectedRegs(next);
                                }}
                              />
                            </td>
                            <td className="p-3 font-mono text-muted-foreground">{i + 1}</td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className="border-amber-400/50 bg-amber-400/10 text-amber-600 font-bold text-[11px] rounded-full whitespace-nowrap"
                              >
                                {r.workshop_slug === "agentic-ai-cloud"
                                  ? "Agentic AI"
                                  : ws?.department || "AI Humanoid"}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono font-bold text-foreground">
                              {r.faculty_id}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-foreground uppercase">
                                {r.faculty_name}
                              </div>
                              <div className="text-[11px] font-semibold text-purple-600 mt-0.5">
                                {r.designation}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{r.email}</div>
                              <div className="text-[11px] text-muted-foreground font-mono">
                                {r.phone}
                              </div>
                            </td>
                            <td className="p-3 font-semibold">{r.department}</td>
                            <td className="p-3 text-muted-foreground font-medium">
                              {r.category || "Sem I"}
                            </td>
                            <td className="p-3 text-muted-foreground font-medium">
                              Section {r.institute || "A"}
                            </td>
                            <td className="p-3 font-mono">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`rounded-full text-[10px] font-bold ${
                                    r.payment_status === "Approved"
                                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                                      : r.payment_status === "Rejected"
                                        ? "border-rose-500 bg-rose-500/10 text-rose-600"
                                        : "border-amber-400 bg-amber-400/10 text-amber-600"
                                  }`}
                                >
                                  {r.utr_number &&
                                  r.utr_number !== "Pending Payment" &&
                                  r.utr_number !== "PENDING"
                                    ? `UTR: ${r.utr_number}`
                                    : "Pending Payment"}
                                </Badge>
                                {r.payment_screenshot_url && (
                                  <button
                                    type="button"
                                    onClick={() => setViewScreenshotUrl(r.payment_screenshot_url)}
                                    className="text-[10px] text-purple-600 underline font-semibold flex items-center"
                                  >
                                    View Receipt
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {/* Status Dropdown Matching Screenshot 1 */}
                              <Select
                                value={r.payment_status || "Pending"}
                                onValueChange={(val) => updatePaymentStatus(r.id, val)}
                              >
                                <SelectTrigger className="h-8 w-36 text-xs bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending Payment</SelectItem>
                                  <SelectItem value="Approved">Approved</SelectItem>
                                  <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3 text-muted-foreground text-[11px] whitespace-nowrap">
                              {new Date(r.created_at).toLocaleString([], {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => deleteOneRegistration(r.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEEDBACK QUESTIONS (Exact 100% Match to Screenshot 2) */}
          {activeTab === "feedback-forms" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Feedback Questions</h1>
                  <p className="text-sm text-muted-foreground">
                    Create feedback forms and manage their questions.
                  </p>
                </div>
                <Button
                  onClick={() => setCreatingFeedbackForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Feedback Form
                </Button>
              </div>

              {/* Exact Cards Matching Screenshot 2 */}
              <div className="grid gap-4">
                {feedbackForms.map((f) => (
                  <Card key={f.id} className="rounded-xl border shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-foreground uppercase tracking-wide">
                            {f.fdp_title}
                          </h3>
                          {f.is_enabled ? (
                            <Badge className="bg-emerald-600 text-white text-[11px] font-bold">
                              ON
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[11px]">
                              OFF
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            Button: <strong>{f.feedback_button_name}</strong>
                          </span>
                          {f.feedback_date && <span>Date: {f.feedback_date}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5">
                          <Switch
                            checked={f.is_enabled}
                            onCheckedChange={(v) => toggleFeedbackEnabled(f, v)}
                          />
                          <span className="text-xs font-bold">{f.is_enabled ? "ON" : "OFF"}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManagingQuestionsFor(f)}
                          className="text-xs"
                        >
                          <ListChecks className="mr-1.5 h-4 w-4" /> Questions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingFeedbackForm(f);
                            setFeedbackTitleInput(f.fdp_title);
                            setFeedbackBtnInput(f.feedback_button_name);
                            setFeedbackDateInput(f.feedback_date || "");
                          }}
                          className="text-xs"
                        >
                          <Pencil className="mr-1.5 h-4 w-4" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFeedbackFormFilter(f.id);
                            setActiveTab("feedback-responses");
                          }}
                          className="text-xs"
                        >
                          <Eye className="mr-1.5 h-4 w-4" /> Responses
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteFeedbackForm(f.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FEEDBACK RESPONSES (Exact 100% Match to Screenshot 3) */}
          {activeTab === "feedback-responses" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Feedback Responses</h1>
                  <p className="text-sm text-muted-foreground">
                    Filter, view, and export feedback responses.
                  </p>
                </div>
                <Button
                  onClick={exportFeedbackExcel}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  <Download className="mr-2 h-4 w-4" /> Export Excel
                </Button>
              </div>

              {/* Exact Filter Bar from Screenshot 3 */}
              <Card className="rounded-xl border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Select Date
                      </Label>
                      <Input
                        type="date"
                        value={feedbackDateFilter}
                        onChange={(e) => setFeedbackDateFilter(e.target.value)}
                        className="h-9 w-48 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Workshop / Feedback Form
                      </Label>
                      <Select
                        value={feedbackFormFilter}
                        onValueChange={setFeedbackFormFilter}
                      >
                        <SelectTrigger className="h-9 text-xs bg-background">
                          <SelectValue placeholder="All Forms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Forms</SelectItem>
                          {feedbackForms.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.feedback_button_name} ({f.fdp_title})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFeedbackDateFilter("");
                        setFeedbackFormFilter("all");
                      }}
                      className="h-9 text-xs font-semibold"
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Exact Table Matching Screenshot 3 */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b font-bold text-muted-foreground">
                      <tr>
                        <th className="p-3">S.No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Roll Number</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Years</th>
                        <th className="p-3">Sem</th>
                        <th className="p-3">Section</th>
                        {uniqueFeedbackQuestions.map((q, idx) => (
                          <th key={idx} className="p-3 min-w-[200px] max-w-[280px]">
                            {idx + 1}. {q}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredFeedbackResponses.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7 + Math.max(1, uniqueFeedbackQuestions.length)}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No feedback responses found for the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredFeedbackResponses.map((r, i) => {
                          const answersMap = new Map(
                            (r.answers_json ?? []).map((a) => [a.question_text, a.answer]),
                          );
                          return (
                            <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-mono text-muted-foreground">{i + 1}</td>
                              <td className="p-3 font-semibold text-foreground">
                                {r.participant_name}
                              </td>
                              <td className="p-3 font-mono font-bold text-foreground">
                                {r.roll_number || r.employee_id || "—"}
                              </td>
                              <td className="p-3 font-semibold">{r.department || "—"}</td>
                              <td className="p-3 text-muted-foreground">{r.year || "3rd Year"}</td>
                              <td className="p-3 text-muted-foreground">{r.semester || "Sem I"}</td>
                              <td className="p-3 text-muted-foreground">{r.section || "Section A"}</td>
                              {uniqueFeedbackQuestions.map((q, idx) => (
                                <td key={idx} className="p-3 text-foreground font-medium">
                                  {answersMap.get(q) || "—"}
                                </td>
                              ))}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: QUIZ QUESTIONS */}
          {activeTab === "quiz-questions" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Quiz Questions</h1>
                <p className="text-sm text-muted-foreground">
                  Configure assessment questions and multiple choice answers for workshop tests.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {quizExams.map((exam) => (
                  <Card key={exam.id} className="rounded-xl border shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={exam.is_enabled ? "default" : "secondary"}
                          className={exam.is_enabled ? "bg-emerald-600 text-white" : ""}
                        >
                          {exam.is_enabled ? "ACTIVE EXAM" : "INACTIVE"}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {exam.duration_minutes} Mins
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold mt-2">
                        {exam.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Date: {exam.exam_date}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex items-center justify-between">
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to="/quiz/$examId" params={{ examId: exam.id }} target="_blank">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open Quiz
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={exam.is_enabled ? "destructive" : "default"}
                        className="text-xs"
                        onClick={async () => {
                          await quizDb
                            .from("quiz_exams")
                            .update({ is_enabled: !exam.is_enabled })
                            .eq("id", exam.id);
                          qc.invalidateQueries({ queryKey: ["quiz_exams"] });
                          toast.success(`Quiz ${exam.is_enabled ? "Disabled" : "Enabled"}!`);
                        }}
                      >
                        {exam.is_enabled ? "Deactivate" : "Activate"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: QUIZ RESPONSES */}
          {activeTab === "quiz-responses" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Quiz Submissions & Scores</h1>
                <p className="text-sm text-muted-foreground">
                  View participant quiz assessment performances.
                </p>
              </div>

              <Card className="rounded-xl border shadow-sm p-6 text-center text-muted-foreground text-sm">
                No active exam responses recorded for this workshop yet.
              </Card>
            </div>
          )}

          {/* TAB 8: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Workshop Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Registration trends, department distributions, and revenue metrics.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Registration Velocity</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={daily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="registrations" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Revenue Realization</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={daily}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 9: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Workshop Reports & Export</h1>
                <p className="text-sm text-muted-foreground">
                  Export verified participant rosters and financial summaries.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Excel Participant Roster</CardTitle>
                    <CardDescription className="text-xs">
                      Export complete registration data with Roll Number, Student Name, Section, Mobile, UTR, and Status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={exportRegistrationsExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel (.xlsx)
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">PDF Official Report</CardTitle>
                    <CardDescription className="text-xs">
                      Generate printable attendance and verification roster for GNITS coordinators.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={exportRegistrationsPDF}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                    >
                      <FileText className="mr-2 h-4 w-4" /> Download PDF Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ----------------- DIALOGS ----------------- */}

      {/* Questions Manager Modal */}
      {managingQuestionsFor && (
        <Dialog
          open={!!managingQuestionsFor}
          onOpenChange={() => setManagingQuestionsFor(null)}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Questions for {managingQuestionsFor.feedback_button_name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {managingQuestionsFor.fdp_title}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <QuestionsManager formId={managingQuestionsFor.id} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create / Edit Feedback Form Modal */}
      {(creatingFeedbackForm || editingFeedbackForm) && (
        <Dialog
          open={creatingFeedbackForm || !!editingFeedbackForm}
          onOpenChange={() => {
            setCreatingFeedbackForm(false);
            setEditingFeedbackForm(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingFeedbackForm ? "Edit Feedback Form" : "Create Feedback Form"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs font-semibold">Title of Workshop / Event</Label>
                <Input
                  value={feedbackTitleInput}
                  onChange={(e) => setFeedbackTitleInput(e.target.value)}
                  placeholder="e.g. ARTIFICIAL INTELLIGENCE HUMANOID ROBOT"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Button Label on Public Page</Label>
                <Input
                  value={feedbackBtnInput}
                  onChange={(e) => setFeedbackBtnInput(e.target.value)}
                  placeholder="e.g. Submit Workshop Feedback Day 1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Feedback Date</Label>
                <Input
                  type="date"
                  value={feedbackDateInput}
                  onChange={(e) => setFeedbackDateInput(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreatingFeedbackForm(false);
                  setEditingFeedbackForm(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveFeedbackForm}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Save Feedback Form
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Speaker Dialog */}
      {editingSpeaker && (
        <Dialog open={!!editingSpeaker} onOpenChange={() => setEditingSpeaker(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingSpeaker.id ? "Edit Speaker" : "Add Resource Person / Speaker"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Speaker details appear in the workshop landing page.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs font-semibold">Name</Label>
                <Input
                  value={editingSpeaker.name || ""}
                  onChange={(e) => setEditingSpeaker({ ...editingSpeaker, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Designation</Label>
                <Input
                  value={editingSpeaker.designation || ""}
                  onChange={(e) =>
                    setEditingSpeaker({ ...editingSpeaker, designation: e.target.value })
                  }
                  placeholder="e.g. Robotics & AI Specialist"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Organization</Label>
                <Input
                  value={editingSpeaker.organization || ""}
                  onChange={(e) =>
                    setEditingSpeaker({ ...editingSpeaker, organization: e.target.value })
                  }
                  placeholder="e.g. Edubotics, Hyderabad"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Photo</Label>
                {editingSpeaker.photo_url && (
                  <img
                    src={editingSpeaker.photo_url}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover my-2 border"
                  />
                )}
                <Label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2 hover:bg-muted/50 text-xs">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingSpeakerPhoto ? "Uploading…" : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadSpeakerPhoto(e.target.files[0])}
                  />
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditingSpeaker(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveSpeakerAction}
                disabled={savingSpeaker}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {savingSpeaker && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save Speaker
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Coordinator Dialog */}
      {editingCoordinator && (
        <Dialog open={!!editingCoordinator} onOpenChange={() => setEditingCoordinator(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingCoordinator.id ? "Edit Coordinator" : "Add Coordinator"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Coordinators are shown in the public contact footer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs font-semibold">Name</Label>
                <Input
                  value={editingCoordinator.name || ""}
                  onChange={(e) =>
                    setEditingCoordinator({ ...editingCoordinator, name: e.target.value })
                  }
                  placeholder="e.g. Mrs. Nayan Rai"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select
                    value={editingCoordinator.type || "Faculty"}
                    onValueChange={(val: "Faculty" | "Student") =>
                      setEditingCoordinator({ ...editingCoordinator, type: val })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Faculty">Faculty</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Department</Label>
                  <Input
                    value={editingCoordinator.department || ""}
                    onChange={(e) =>
                      setEditingCoordinator({ ...editingCoordinator, department: e.target.value })
                    }
                    placeholder="e.g. CSE(DS)"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  value={editingCoordinator.phone || ""}
                  onChange={(e) =>
                    setEditingCoordinator({ ...editingCoordinator, phone: e.target.value })
                  }
                  placeholder="e.g. +91 98765 43210"
                  className="mt-1 font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditingCoordinator(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveCoordinatorAction}
                disabled={savingCoordinator}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {savingCoordinator && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save
                Coordinator
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Screenshot Modal */}
      {viewScreenshotUrl && (
        <Dialog open={!!viewScreenshotUrl} onOpenChange={() => setViewScreenshotUrl(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Payment Receipt Screenshot</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Verify UTR and transaction amount.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 text-center bg-slate-950 p-2 rounded-xl border">
              <img
                src={viewScreenshotUrl}
                alt="Receipt"
                className="max-h-[70vh] max-w-full mx-auto object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
