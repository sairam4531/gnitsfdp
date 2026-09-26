import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  useWorkshops,
  useRegistrations,
  useCoordinators,
  saveLocalWorkshopCredentials,
  Workshop,
  RegistrationRecord,
} from "@/lib/queries";
import {
  useFeedbackForms,
  useFeedbackResponses,
  feedbackDb,
} from "@/lib/feedback";
import {
  useQuizExams,
  useQuizQuestions,
  quizDb,
} from "@/lib/quiz";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  | "settings"
  | "registrations"
  | "feedback-forms"
  | "feedback-responses"
  | "quiz-questions"
  | "quiz-responses"
  | "analytics"
  | "reports";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "settings", label: "Workshops", icon: CalendarCheck },
  { id: "registrations", label: "Responses", icon: Users },
  { id: "feedback-forms", label: "Feedback Forms", icon: MessageSquare },
  { id: "feedback-responses", label: "Feedback Responses", icon: ClipboardList },
  { id: "quiz-questions", label: "Quiz Questions", icon: GraduationCap },
  { id: "quiz-responses", label: "Quiz Responses", icon: ListChecks },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: FileText },
];

function WorkshopAdminPage() {
  const { workshopSlug } = useParams({ from: "/$workshopSlug/admin" });
  const qc = useQueryClient();

  const { data: workshops = [], isLoading: loadingWorkshops } = useWorkshops();
  const { data: allRegistrations = [], isLoading: loadingRegs } = useRegistrations();
  const { data: feedbackForms = [] } = useFeedbackForms();
  const { data: feedbackResponses = [] } = useFeedbackResponses();
  const { data: quizExams = [] } = useQuizExams();

  const ws = workshops.find(
    (w) => w.slug.toLowerCase() === workshopSlug.toLowerCase(),
  );

  // Authentication State
  const isMasterAdmin =
    typeof window !== "undefined" &&
    sessionStorage.getItem("gnits_it_admin") === "sairohit45";

  const [isWsAuth, setIsWsAuth] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem("gnits_it_admin") === "sairohit45") return true;
    return sessionStorage.getItem(`gnits_ws_admin_${workshopSlug}`) === "true";
  });

  const [activeTab, setActiveTab] = useState<AdminNavTab>("dashboard");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Filters & Search for Registrations
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<Workshop> | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);

  // Initialize settings form when ws loads
  useMemo(() => {
    if (ws && !settingsForm) {
      setSettingsForm({ ...ws });
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

  // Filter registrations for THIS workshop
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

  const filteredRegistrations = useMemo(() => {
    return workshopRegistrations.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.faculty_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.faculty_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery) ||
        r.utr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        r.payment_status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [workshopRegistrations, searchQuery, statusFilter]);

  // Statistics
  const today = startOfDay(new Date());
  const todayCount = workshopRegistrations.filter(
    (r) => new Date(r.created_at) >= today,
  ).length;
  const approvedRegistrations = workshopRegistrations.filter(
    (r) => r.payment_status?.toLowerCase() === "approved",
  );
  const pendingRegistrations = workshopRegistrations.filter(
    (r) => r.payment_status?.toLowerCase() === "pending",
  );
  const approvedCount = approvedRegistrations.length;
  const pendingCount = pendingRegistrations.length;
  const totalRevenue = approvedRegistrations.reduce(
    (s, r) => s + (r.registration_fee || ws?.registration_fee || 0),
    0,
  );
  const remainingSeats = ws ? Math.max(0, ws.seat_limit - workshopRegistrations.length) : 0;

  // 14 days chart data
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

  // Status updates
  async function updatePaymentStatus(id: string, newStatus: "approved" | "rejected" | "pending") {
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

  async function toggleRegistrationOpen(newVal: boolean) {
    if (!ws) return;
    try {
      const { error } = await supabase
        .from("workshops" as never)
        .update({ registration_open: newVal } as never)
        .eq("id", ws.id);
      if (error) throw error;
      toast.success(`Registration ${newVal ? "Opened" : "Closed"}!`);
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle status.");
    }
  }

  // Export Handlers
  function exportToExcel() {
    if (workshopRegistrations.length === 0) {
      toast.error("No registrations to export.");
      return;
    }
    const data = workshopRegistrations.map((r, i) => ({
      "S.No": i + 1,
      "Registration ID": r.registration_id,
      "Student Name": r.faculty_name,
      "Roll Number": r.faculty_id,
      Year: r.designation,
      Department: r.department,
      Semester: r.category,
      Section: r.institute,
      Email: r.email,
      Mobile: r.phone,
      "UTR Number": r.utr_number,
      "Fee (₹)": r.registration_fee,
      "Payment Status": r.payment_status,
      "Registration Time": new Date(r.created_at).toLocaleString(),
    }));

    const wsSheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSheet, "Registrations");
    XLSX.writeFile(wb, `${ws?.slug || "workshop"}-registrations.xlsx`);
    toast.success("Excel sheet downloaded.");
  }

  function exportToPDF() {
    if (workshopRegistrations.length === 0) {
      toast.error("No registrations to export.");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`${ws?.title || "Workshop"} — Registrations`, 14, 15);
    doc.setFontSize(9);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Total: ${workshopRegistrations.length}`,
      14,
      21,
    );

    const headers = [
      ["#", "Roll No", "Student Name", "Year", "Dept", "Sec", "Mobile", "UTR", "Fee", "Status"],
    ];
    const rows = workshopRegistrations.map((r, i) => [
      i + 1,
      r.faculty_id,
      r.faculty_name,
      r.designation,
      r.department,
      r.institute,
      r.phone,
      r.utr_number,
      `Rs.${r.registration_fee}`,
      (r.payment_status || "PENDING").toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 26,
      head: headers,
      body: rows,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237] },
    });

    doc.save(`${ws?.slug || "workshop"}-registrations.pdf`);
    toast.success("PDF downloaded.");
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settingsForm || !ws) return;
    setSavingSettings(true);
    try {
      saveLocalWorkshopCredentials(
        ws.slug,
        settingsForm.admin_username,
        settingsForm.admin_password,
      );

      const payload: any = {
        title: settingsForm.title,
        subtitle: settingsForm.subtitle,
        description: settingsForm.description,
        department: settingsForm.department,
        dates: settingsForm.dates,
        timings: settingsForm.timings,
        venue: settingsForm.venue,
        registration_fee: Number(settingsForm.registration_fee ?? 250),
        seat_limit: Number(settingsForm.seat_limit ?? 500),
        registration_open: settingsForm.registration_open,
        upi_id: settingsForm.upi_id || null,
        account_name: settingsForm.account_name || null,
        qr_code_url: settingsForm.qr_code_url || null,
        admin_username: settingsForm.admin_username || null,
        admin_password: settingsForm.admin_password || null,
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

      toast.success("Workshop settings updated successfully!");
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function uploadQR(file: File) {
    if (!ws) return;
    setUploadingQR(true);
    const ext = file.name.split(".").pop();
    const path = `workshops/${ws.slug}-qr-${Date.now()}.${ext}`;
    try {
      const { error } = await supabase.storage.from("receipts").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      setSettingsForm((p) => ({ ...p, qr_code_url: data.publicUrl }));
      toast.success("QR Code uploaded!");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploadingQR(false);
    }
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
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <a href={`/${ws.slug}`} target="_blank" rel="noreferrer">
                <Globe className="mr-1.5 h-3.5 w-3.5 text-cyan-500" /> View Page
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* TAB 1: DASHBOARD (Matching user's screenshot exactly!) */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Live overview of Workshop registrations.
                </p>
              </div>

              {/* 6 Metric Cards matching screenshot */}
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

              {/* Charts row matching screenshot */}
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

          {/* TAB 2: WORKSHOPS / SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Workshop Configuration</h1>
                <p className="text-sm text-muted-foreground">
                  Update title, dates, venue, registration fees, UPI QR code, and admin credentials.
                </p>
              </div>

              {settingsForm && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <Card className="rounded-xl border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Workshop Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs font-semibold">Workshop Title</Label>
                        <Input
                          value={settingsForm.title || ""}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, title: e.target.value })
                          }
                          required
                          className="mt-1 font-semibold"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Department</Label>
                          <Input
                            value={settingsForm.department || ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, department: e.target.value })
                            }
                            placeholder="e.g. CSE (Data Science)"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Registration Status</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Switch
                              checked={settingsForm.registration_open ?? true}
                              onCheckedChange={(val) =>
                                setSettingsForm({ ...settingsForm, registration_open: val })
                              }
                            />
                            <span className="text-xs font-bold">
                              {settingsForm.registration_open ? "OPEN" : "CLOSED"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Subtitle / Theme</Label>
                        <Input
                          value={settingsForm.subtitle || ""}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, subtitle: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Full Description</Label>
                        <Textarea
                          rows={4}
                          value={settingsForm.description || ""}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, description: e.target.value })
                          }
                          className="mt-1 text-xs leading-relaxed"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Dates</Label>
                          <Input
                            value={settingsForm.dates || ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, dates: e.target.value })
                            }
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Timings</Label>
                          <Input
                            value={settingsForm.timings || ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, timings: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Venue</Label>
                          <Input
                            value={settingsForm.venue || ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, venue: e.target.value })
                            }
                            required
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Registration Fee (₹)</Label>
                          <Input
                            type="number"
                            value={settingsForm.registration_fee ?? 250}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                registration_fee: Number(e.target.value),
                              })
                            }
                            required
                            className="mt-1 font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Seat Limit</Label>
                          <Input
                            type="number"
                            value={settingsForm.seat_limit ?? 500}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                seat_limit: Number(e.target.value),
                              })
                            }
                            required
                            className="mt-1 font-bold"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold">
                        Payment & UPI Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">UPI ID</Label>
                          <Input
                            value={settingsForm.upi_id || ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, upi_id: e.target.value })
                            }
                            placeholder="e.g. 9876543210@upi"
                            className="mt-1 font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Payee Account Name</Label>
                          <Input
                            value={settingsForm.account_name || ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, account_name: e.target.value })
                            }
                            placeholder="e.g. GNITS CSE Department"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Payment QR Code</Label>
                        <div className="mt-2 flex items-center gap-4">
                          {settingsForm.qr_code_url ? (
                            <img
                              src={settingsForm.qr_code_url}
                              alt="QR Code"
                              className="h-24 w-24 object-contain rounded-lg border p-1 bg-white"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                              No QR
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              id="qr-upload"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadQR(f);
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadingQR}
                              onClick={() => document.getElementById("qr-upload")?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {uploadingQR ? "Uploading…" : "Upload QR Image"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-bold">
                        Coordinator Login Credentials
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Admin Username</Label>
                          <Input
                            value={settingsForm.admin_username || ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, admin_username: e.target.value })
                            }
                            placeholder={`e.g. ${ws.slug}_admin`}
                            className="mt-1 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Admin Password</Label>
                          <Input
                            type="text"
                            value={settingsForm.admin_password || ""}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, admin_password: e.target.value })
                            }
                            placeholder="Enter password"
                            className="mt-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-5 shadow-md"
                  >
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Workshop Settings
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: RESPONSES / REGISTRATIONS */}
          {activeTab === "registrations" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Responses & Registrations</h1>
                  <p className="text-sm text-muted-foreground">
                    Total {workshopRegistrations.length} students registered for {ws.title}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToExcel}
                    className="text-xs font-semibold"
                  >
                    <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" /> Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    className="text-xs font-semibold"
                  >
                    <FileText className="mr-1.5 h-4 w-4 text-rose-600" /> PDF
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name, roll number, mobile, email, UTR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={statusFilter === "all" ? "default" : "outline"}
                    onClick={() => setStatusFilter("all")}
                    className="text-xs h-9"
                  >
                    All ({workshopRegistrations.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === "approved" ? "default" : "outline"}
                    onClick={() => setStatusFilter("approved")}
                    className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Approved ({approvedCount})
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    onClick={() => setStatusFilter("pending")}
                    className="text-xs h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  >
                    Pending ({pendingCount})
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b font-bold text-muted-foreground">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Dept & Year</th>
                        <th className="p-3">Mobile & Email</th>
                        <th className="p-3">UTR / Fee</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3">Receipt</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-muted-foreground">
                            No registrations found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRegistrations.map((r, i) => (
                          <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground">{i + 1}</td>
                            <td className="p-3 font-mono font-bold text-foreground">
                              {r.faculty_id}
                            </td>
                            <td className="p-3 font-semibold text-foreground">
                              {r.faculty_name}
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-foreground">
                                {r.department}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                {r.designation} {r.institute ? `· Sec ${r.institute}` : ""}
                              </span>
                            </td>
                            <td className="p-3 font-mono">
                              <div>{r.phone}</div>
                              <div className="text-[10px] text-muted-foreground">{r.email}</div>
                            </td>
                            <td className="p-3 font-mono">
                              <div className="font-bold text-foreground">{r.utr_number}</div>
                              <div className="text-[10px] text-amber-500 font-semibold">
                                ₹{r.registration_fee}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  r.payment_status === "approved"
                                    ? "default"
                                    : r.payment_status === "rejected"
                                      ? "destructive"
                                      : "outline"
                                }
                                className={`text-[10px] uppercase font-bold ${
                                  r.payment_status === "approved"
                                    ? "bg-emerald-600 text-white"
                                    : r.payment_status === "pending"
                                      ? "border-amber-400 bg-amber-400/10 text-amber-600"
                                      : ""
                                }`}
                              >
                                {r.payment_status || "pending"}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {r.payment_screenshot_url ? (
                                <button
                                  type="button"
                                  onClick={() => setViewScreenshotUrl(r.payment_screenshot_url)}
                                  className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 text-[11px]"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View
                                </button>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">None</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {r.payment_status !== "approved" && (
                                  <Button
                                    size="sm"
                                    onClick={() => updatePaymentStatus(r.id, "approved")}
                                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                                  >
                                    Approve
                                  </Button>
                                )}
                                {r.payment_status !== "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updatePaymentStatus(r.id, "rejected")}
                                    className="h-7 px-2 text-rose-600 hover:text-rose-700 text-[11px]"
                                  >
                                    Reject
                                  </Button>
                                )}
                              </div>
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

          {/* TAB 4: FEEDBACK FORMS */}
          {activeTab === "feedback-forms" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Feedback Forms</h1>
                <p className="text-sm text-muted-foreground">
                  Manage workshop feedback surveys and active status.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {feedbackForms.map((form) => (
                  <Card key={form.id} className="rounded-xl border shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={form.is_enabled ? "default" : "secondary"}
                          className={form.is_enabled ? "bg-emerald-600 text-white" : ""}
                        >
                          {form.is_enabled ? "ACTIVE" : "DISABLED"}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {form.feedback_date || "No date set"}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold mt-2">
                        {form.feedback_button_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {form.fdp_title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex items-center justify-between">
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to="/feedback/$formId" params={{ formId: form.id }} target="_blank">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Preview Form
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={form.is_enabled ? "destructive" : "default"}
                        className="text-xs"
                        onClick={async () => {
                          await feedbackDb
                            .from("feedback_forms")
                            .update({ is_enabled: !form.is_enabled })
                            .eq("id", form.id);
                          qc.invalidateQueries({ queryKey: ["feedback_forms"] });
                          toast.success(`Form ${form.is_enabled ? "Disabled" : "Enabled"}!`);
                        }}
                      >
                        {form.is_enabled ? "Deactivate" : "Activate"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FEEDBACK RESPONSES */}
          {activeTab === "feedback-responses" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Feedback Responses</h1>
                <p className="text-sm text-muted-foreground">
                  Submitted participant reviews and survey responses.
                </p>
              </div>

              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b font-bold text-muted-foreground">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Participant Name</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Survey Title</th>
                        <th className="p-3">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {feedbackResponses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No feedback responses submitted yet.
                          </td>
                        </tr>
                      ) : (
                        feedbackResponses.map((r, i) => (
                          <tr key={r.id} className="hover:bg-muted/30">
                            <td className="p-3 font-mono text-muted-foreground">{i + 1}</td>
                            <td className="p-3 font-mono font-bold text-foreground">
                              {r.roll_number || "—"}
                            </td>
                            <td className="p-3 font-semibold text-foreground">
                              {r.participant_name}
                            </td>
                            <td className="p-3">{r.department || "—"}</td>
                            <td className="p-3 font-medium text-purple-600">
                              {r.feedback_forms?.feedback_button_name || "Feedback"}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(r.submitted_at).toLocaleString()}
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
                      onClick={exportToExcel}
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
                      onClick={exportToPDF}
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
