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
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ShieldCheck,
  Users,
  Search,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  Calendar,
  MapPin,
  IndianRupee,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  Loader2,
  Lock,
  Globe,
  Upload,
} from "lucide-react";
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

function WorkshopAdminPage() {
  const { workshopSlug } = useParams({ from: "/$workshopSlug/admin" });
  const qc = useQueryClient();

  const { data: workshops = [], isLoading: loadingWorkshops } = useWorkshops();
  const { data: allRegistrations = [], isLoading: loadingRegs } = useRegistrations();
  const { data: coordinators = [] } = useCoordinators();

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

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Filters & Search
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

      // Allow if workshop credentials match OR master IT-Admin credentials match
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
      // Check if registration belongs to this workshop
      return (
        r.workshop_slug === ws.slug ||
        r.workshop_id === ws.id ||
        (r.workshop_title && r.workshop_title.toLowerCase().includes(ws.title.toLowerCase())) ||
        // Fallback for primary workshop if slug is primary
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
        statusFilter === "all" || r.payment_status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [workshopRegistrations, searchQuery, statusFilter]);

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
      "Year": r.designation,
      "Department": r.department,
      "Semester": r.category,
      "Section": r.institute,
      "Email": r.email,
      "Mobile": r.phone,
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
    doc.text(`Generated: ${new Date().toLocaleString()} | Total: ${workshopRegistrations.length}`, 14, 21);

    const headers = [["#", "Roll No", "Student Name", "Year", "Dept", "Sec", "Mobile", "UTR", "Fee", "Status"]];
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
      r.payment_status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 26,
      head: headers,
      body: rows,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] },
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
        dates: settingsForm.dates,
        timings: settingsForm.timings,
        venue: settingsForm.venue,
        registration_fee: Number(settingsForm.registration_fee ?? 250),
        seat_limit: Number(settingsForm.seat_limit ?? 500),
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
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
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
            <Button asChild className="bg-amber-500 text-slate-950 font-bold">
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
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b12_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <Card className="w-full max-w-md border-amber-500/30 bg-slate-900/90 shadow-2xl backdrop-blur-xl relative z-10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <Badge className="mx-auto mt-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[10px] uppercase">
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
                className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:opacity-90 transition-all mt-2 py-5"
              >
                {loginLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Sign In to Workshop
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <Link
                to={`/${ws.slug}`}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                ← View Public Workshop Page
              </Link>
              <Link to="/it-admin" className="text-slate-400 hover:text-white font-mono">
                IT-Admin Portal
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated Workshop Admin Dashboard
  const approvedCount = workshopRegistrations.filter((r) => r.payment_status === "approved").length;
  const pendingCount = workshopRegistrations.filter((r) => r.payment_status === "pending").length;
  const totalRevenue = approvedCount * (ws.registration_fee || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-amber-500/20 bg-slate-900/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="GNITS Logo"
              className="h-9 w-9 rounded-full bg-white p-0.5 object-contain border border-amber-400/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-black tracking-tight text-white truncate max-w-xs md:max-w-md">
                  {ws.title}
                </span>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold">
                  {ws.department || "Admin"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                URL: /{ws.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-cyan-500/40 bg-slate-800 text-xs text-cyan-300 hover:bg-cyan-500/20"
            >
              <a href={`/${ws.slug}`} target="_blank" rel="noreferrer">
                <Globe className="mr-1.5 h-3.5 w-3.5" /> Public Page
              </a>
            </Button>
            {isMasterAdmin && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                <Link to="/it-admin">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-amber-400" /> IT Admin
                </Link>
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="text-xs font-bold"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Registrations</p>
                <p className="text-2xl font-black text-white mt-1">
                  {workshopRegistrations.length} / {ws.seat_limit}
                </p>
              </div>
              <Users className="h-8 w-8 text-amber-400/60" />
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Verified / Approved</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-400/60" />
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Review</p>
                <p className="text-2xl font-black text-yellow-400 mt-1">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400/60" />
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Registration Status</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Switch
                    checked={ws.registration_open}
                    onCheckedChange={(val) => toggleRegistrationOpen(val)}
                  />
                  <span className={`text-xs font-bold ${ws.registration_open ? "text-emerald-400" : "text-rose-400"}`}>
                    {ws.registration_open ? "OPEN" : "CLOSED"}
                  </span>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-indigo-400/60" />
            </CardContent>
          </Card>
        </div>

        {/* TABS NAVIGATION */}
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger
              value="registrations"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold text-xs"
            >
              <Users className="h-4 w-4 mr-1.5" /> Registrations & Responses ({workshopRegistrations.length})
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-bold text-xs"
            >
              <Settings className="h-4 w-4 mr-1.5" /> Workshop Settings & Credentials
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: REGISTRATIONS */}
          <TabsContent value="registrations" className="space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student name, roll number, mobile, email, UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportToExcel}
                  className="h-9 border-slate-700 bg-slate-800 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportToPDF}
                  className="h-9 border-slate-700 bg-slate-800 text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" /> PDF
                </Button>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto shadow-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Student & Roll No</th>
                    <th className="py-3 px-4">Year / Dept / Sec</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">UTR Number</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No registrations found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-slate-500 font-mono">{i + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{r.faculty_name}</div>
                          <div className="text-[11px] font-mono text-amber-400 font-semibold">
                            {r.faculty_id}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200">
                            {r.designation} · {r.department}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Sec: {r.institute} · {r.category}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200">{r.email}</div>
                          <div className="text-[11px] font-mono text-slate-400">{r.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-300 font-bold">
                            {r.utr_number}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {r.payment_screenshot_url ? (
                            <button
                              type="button"
                              onClick={() => setViewScreenshotUrl(r.payment_screenshot_url)}
                              className="text-amber-400 hover:text-amber-300 hover:underline text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" /> View
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`text-[10px] uppercase font-bold ${
                              r.payment_status === "approved"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                : r.payment_status === "rejected"
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                            }`}
                          >
                            {r.payment_status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.payment_status !== "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[10px] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                                onClick={() => updatePaymentStatus(r.id, "approved")}
                              >
                                Approve
                              </Button>
                            )}
                            {r.payment_status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[10px] border-rose-500/40 text-rose-400 hover:bg-rose-500/20"
                                onClick={() => updatePaymentStatus(r.id, "rejected")}
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
          </TabsContent>

          {/* TAB 2: SETTINGS */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-white">
                  Workshop Details & Credentials
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Update workshop operational details, fees, and manage login credentials for this workshop.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-200">Workshop Title</Label>
                    <Input
                      required
                      value={settingsForm?.title || ""}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, title: e.target.value }))
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  {/* Credentials Section */}
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-3">
                    <Label className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                      <Lock className="h-4 w-4" /> Workshop Admin Portal Credentials
                    </Label>
                    <p className="text-[11px] text-slate-400">
                      Use these credentials to sign in directly to /{ws.slug}/admin
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold text-slate-200">Username</Label>
                        <Input
                          required
                          value={settingsForm?.admin_username || ""}
                          onChange={(e) =>
                            setSettingsForm((p) => ({ ...p, admin_username: e.target.value }))
                          }
                          className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-200">Password</Label>
                        <Input
                          required
                          type="text"
                          value={settingsForm?.admin_password || ""}
                          onChange={(e) =>
                            setSettingsForm((p) => ({ ...p, admin_password: e.target.value }))
                          }
                          className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-slate-200">Dates</Label>
                      <Input
                        value={settingsForm?.dates || ""}
                        onChange={(e) =>
                          setSettingsForm((p) => ({ ...p, dates: e.target.value }))
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-200">Timings</Label>
                      <Input
                        value={settingsForm?.timings || ""}
                        onChange={(e) =>
                          setSettingsForm((p) => ({ ...p, timings: e.target.value }))
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-slate-200">Venue</Label>
                      <Input
                        value={settingsForm?.venue || ""}
                        onChange={(e) =>
                          setSettingsForm((p) => ({ ...p, venue: e.target.value }))
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-200">Registration Fee (₹)</Label>
                      <Input
                        type="number"
                        value={settingsForm?.registration_fee ?? 250}
                        onChange={(e) =>
                          setSettingsForm((p) => ({
                            ...p,
                            registration_fee: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-slate-200">UPI ID for Fees</Label>
                      <Input
                        value={settingsForm?.upi_id || ""}
                        onChange={(e) =>
                          setSettingsForm((p) => ({ ...p, upi_id: e.target.value }))
                        }
                        placeholder="e.g. name@upi"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-200">Account Name</Label>
                      <Input
                        value={settingsForm?.account_name || ""}
                        onChange={(e) =>
                          setSettingsForm((p) => ({ ...p, account_name: e.target.value }))
                        }
                        placeholder="e.g. GNITS CSI Chapter"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-200">Payment QR Code</Label>
                    {settingsForm?.qr_code_url && (
                      <img
                        src={settingsForm.qr_code_url}
                        alt="QR preview"
                        className="mt-2 h-24 w-24 object-contain rounded border border-slate-800 bg-white p-1"
                      />
                    )}
                    <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-700 p-2 hover:bg-slate-800 text-xs font-semibold">
                      <Upload className="h-3.5 w-3.5 text-amber-400" />
                      <span>{uploadingQR ? "Uploading…" : "Upload new QR code"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadQR(f);
                        }}
                      />
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Screenshot Modal */}
      <Dialog open={!!viewScreenshotUrl} onOpenChange={(v) => !v && setViewScreenshotUrl(null)}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100 p-4">
          <DialogHeader>
            <DialogTitle className="text-base text-white">Payment Screenshot Verification</DialogTitle>
          </DialogHeader>
          <div className="mt-2 max-h-[70vh] overflow-auto flex items-center justify-center bg-black/50 p-2 rounded-lg">
            {viewScreenshotUrl && (
              <img
                src={viewScreenshotUrl}
                alt="Payment screenshot"
                className="max-h-[65vh] w-auto object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
