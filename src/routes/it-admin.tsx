import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useWorkshops,
  useRegistrations,
  saveLocalWorkshopCredentials,
  Workshop,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  LogOut,
  Calendar,
  MapPin,
  IndianRupee,
  Users,
  Settings,
  Lock,
  Globe,
  Upload,
  Loader2,
  Layers,
} from "lucide-react";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/it-admin")({
  head: () => ({
    meta: [
      { title: "IT Admin · Master Workshop Command Center — GNITS" },
      { name: "description", content: "Master administration and provisioning for GNITS workshops." },
    ],
  }),
  component: ITAdminPage,
});

function ITAdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: workshops = [], isLoading: loadingWorkshops } = useWorkshops();
  const { data: registrations = [] } = useRegistrations();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("gnits_it_admin") === "sairohit45";
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Workshop Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [editingWs, setEditingWs] = useState<Partial<Workshop> | null>(null);
  const [saving, setSaving] = useState(false);
  const [showWsPassword, setShowWsPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);

  // Password visibility map for workshop list cards
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setTimeout(() => {
      if (
        usernameInput.trim() === "sairohit45" &&
        passwordInput.trim() === "Rohitsharma45"
      ) {
        setIsAuthenticated(true);
        sessionStorage.setItem("gnits_it_admin", "sairohit45");
        toast.success("Welcome back, IT Admin (sairohit45)!");
      } else {
        toast.error("Invalid IT Admin credentials. Please check username & password.");
      }
      setLoginLoading(false);
    }, 400);
  }

  function handleLogout() {
    sessionStorage.removeItem("gnits_it_admin");
    setIsAuthenticated(false);
    toast.info("Signed out of IT Admin.");
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function openCreateModal() {
    setIsNew(true);
    setEditingWs({
      title: "",
      slug: "",
      department: "CSE",
      dates: "24 October 2026 – 25 October 2026",
      timings: "9:00 AM to 4:00 PM",
      venue: "Admin Block / Lab, GNITS, Hyderabad",
      registration_fee: 250,
      seat_limit: 500,
      registration_open: true,
      admin_username: "",
      admin_password: "",
      description: "",
      subtitle: "",
      is_featured: false,
    });
    setDialogOpen(true);
  }

  function openEditModal(ws: Workshop) {
    setIsNew(false);
    setEditingWs({ ...ws });
    setDialogOpen(true);
  }

  async function handleSaveWorkshop(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWs?.title || !editingWs?.slug) {
      toast.error("Workshop Title and URL Slug are required.");
      return;
    }

    const cleanSlug = editingWs.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!cleanSlug) {
      toast.error("Please provide a valid slug (e.g. ai-bootcamp).");
      return;
    }

    setSaving(true);
    try {
      // 1. Save credentials in local storage cache
      saveLocalWorkshopCredentials(
        cleanSlug,
        editingWs.admin_username || `${cleanSlug}_admin`,
        editingWs.admin_password || "gnits@admin2026",
      );

      const payload: any = {
        title: editingWs.title.trim(),
        slug: cleanSlug,
        subtitle: editingWs.subtitle || null,
        description: editingWs.description || null,
        department: editingWs.department || "GNITS",
        dates: editingWs.dates || "TBD",
        timings: editingWs.timings || "9:00 AM to 4:00 PM",
        venue: editingWs.venue || "GNITS Campus",
        registration_fee: Number(editingWs.registration_fee ?? 250),
        seat_limit: Number(editingWs.seat_limit ?? 500),
        registration_open: editingWs.registration_open ?? true,
        hero_banner_url: editingWs.hero_banner_url || null,
        brochure_url: editingWs.brochure_url || null,
        upi_id: editingWs.upi_id || null,
        account_name: editingWs.account_name || null,
        qr_code_url: editingWs.qr_code_url || null,
        admin_username: editingWs.admin_username || `${cleanSlug}_admin`,
        admin_password: editingWs.admin_password || "gnits@admin2026",
        sort_order: Number(editingWs.sort_order ?? 0),
        is_featured: !!editingWs.is_featured,
        updated_at: new Date().toISOString(),
      };

      let errorResult: any = null;
      if (isNew || !editingWs.id || editingWs.id.startsWith("workshop-")) {
        const { error } = await supabase.from("workshops" as never).insert(payload as never);
        if (error && error.message?.includes("admin_username")) {
          delete payload.admin_username;
          delete payload.admin_password;
          const retry = await supabase.from("workshops" as never).insert(payload as never);
          errorResult = retry.error;
        } else {
          errorResult = error;
        }
        if (errorResult) throw errorResult;
        toast.success(`Workshop "${editingWs.title}" created successfully!`);
      } else {
        const { error } = await supabase
          .from("workshops" as never)
          .update(payload as never)
          .eq("id", editingWs.id);
        if (error && error.message?.includes("admin_username")) {
          delete payload.admin_username;
          delete payload.admin_password;
          const retry = await supabase
            .from("workshops" as never)
            .update(payload as never)
            .eq("id", editingWs.id);
          errorResult = retry.error;
        } else {
          errorResult = error;
        }
        if (errorResult) throw errorResult;
        toast.success(`Workshop "${editingWs.title}" updated successfully!`);
      }

      setDialogOpen(false);
      setEditingWs(null);
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err?.message || "Failed to save workshop.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRegistration(ws: Workshop, newOpen: boolean) {
    try {
      const { error } = await supabase
        .from("workshops" as never)
        .update({ registration_open: newOpen } as never)
        .eq("id", ws.id);
      if (error) throw error;
      toast.success(`Registration ${newOpen ? "Opened" : "Closed"} for ${ws.title}`);
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle status.");
    }
  }

  async function handleDelete(ws: Workshop) {
    if (!confirm(`Are you sure you want to delete "${ws.title}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("workshops" as never).delete().eq("id", ws.id);
      if (error) throw error;
      toast.success(`Deleted ${ws.title}`);
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete workshop.");
    }
  }

  async function uploadAsset(file: File, type: "banner" | "qr") {
    const ext = file.name.split(".").pop();
    const path = `workshops/${Date.now()}-${type}.${ext}`;
    if (type === "banner") setUploadingBanner(true);
    else setUploadingQR(true);
    try {
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      if (type === "banner") {
        setEditingWs((p) => ({ ...p, hero_banner_url: data.publicUrl }));
      } else {
        setEditingWs((p) => ({ ...p, qr_code_url: data.publicUrl }));
      }
      toast.success(`${type === "banner" ? "Hero Banner" : "QR Code"} uploaded!`);
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      if (type === "banner") setUploadingBanner(false);
      else setUploadingQR(false);
    }
  }

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://gnitsworkshop.vercel.app";

  // Login view
  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 p-4 text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <Card className="w-full max-w-md border-amber-400/30 bg-slate-900/90 shadow-2xl backdrop-blur-xl relative z-10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30">
              <ShieldCheck className="h-9 w-9" />
            </div>
            <CardTitle className="mt-4 text-2xl font-black tracking-tight text-white">
              IT Admin Portal
            </CardTitle>
            <CardDescription className="text-xs text-amber-200/70 font-mono">
              GNITS Master Workshop Command Center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-200">IT-Admin Username</Label>
                <Input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="mt-1.5 bg-slate-950/80 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-200">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="bg-slate-950/80 border-slate-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                Access Master IT-Admin
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <Link
                to="/"
                className="text-xs text-amber-400 hover:text-amber-300 transition flex items-center justify-center gap-1 font-semibold"
              >
                ← Back to Public Website
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // IT Admin Authenticated Dashboard
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
                <span className="text-base font-black tracking-tight text-white">GNITS IT Admin</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] uppercase font-bold">
                  Master Portal
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Operator: <span className="text-amber-300 font-bold">sairohit45</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-800 text-xs text-slate-200 hover:text-white"
            >
              <Link to="/admin">
                <Settings className="mr-1.5 h-3.5 w-3.5" /> Standard Admin
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-800 text-xs text-slate-200 hover:text-white"
            >
              <Link to="/">
                <Globe className="mr-1.5 h-3.5 w-3.5" /> View Website
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="text-xs font-bold"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Banner & Action Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-md">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Workshop Central Provisioning
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Create and maintain ongoing workshops. Every workshop gets a dedicated public user URL and its own isolated Admin Portal with custom login credentials.
            </p>
          </div>
          <Button
            size="lg"
            onClick={openCreateModal}
            className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-xl shadow-amber-500/25 hover:scale-105 transition-all text-sm px-6 py-6"
          >
            <Plus className="mr-2 h-5 w-5" /> Create New Workshop
          </Button>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Workshops</p>
                <p className="text-2xl font-black text-white mt-1">{workshops.length}</p>
              </div>
              <Layers className="h-8 w-8 text-amber-400/60" />
            </CardContent>
          </Card>
          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active (Open)</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {workshops.filter((w) => w.registration_open).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-emerald-400/60" />
            </CardContent>
          </Card>
          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Registrations</p>
                <p className="text-2xl font-black text-purple-400 mt-1">{registrations.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400/60" />
            </CardContent>
          </Card>
          <Card className="bg-slate-900/80 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Provisioned Logins</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{workshops.length}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-amber-400/60" />
            </CardContent>
          </Card>
        </div>

        {/* Ongoing Workshops List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Ongoing & Configured Workshops ({workshops.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage live URLs, credentials, and event registration statuses
              </p>
            </div>
          </div>

          {loadingWorkshops ? (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-400" />
              <p className="mt-2 text-sm">Loading workshops...</p>
            </div>
          ) : workshops.length === 0 ? (
            <Card className="bg-slate-900/50 border-dashed border-slate-800 p-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-300">No workshops created yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Click the "Create New Workshop" button above to launch your first workshop with dedicated URLs.
              </p>
              <Button onClick={openCreateModal} className="mt-4 bg-amber-500 text-slate-950 font-bold">
                <Plus className="mr-1.5 h-4 w-4" /> Create First Workshop
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {workshops.map((ws) => {
                const userUrl = `${originUrl}/${ws.slug}`;
                const adminUrl = `${originUrl}/${ws.slug}/admin`;
                const isPassVisible = !!visiblePasswords[ws.slug];
                const wsRegs = registrations.filter(
                  (r) =>
                    (r as any).workshop_slug === ws.slug ||
                    (r as any).workshop_id === ws.id ||
                    (r as any).workshop_title === ws.title,
                );

                return (
                  <Card
                    key={ws.slug}
                    className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition-all"
                  >
                    <div>
                      {ws.hero_banner_url && (
                        <div className="h-32 w-full overflow-hidden bg-slate-950 border-b border-slate-800">
                          <img
                            src={ws.hero_banner_url}
                            alt=""
                            className="w-full h-full object-cover opacity-90"
                          />
                        </div>
                      )}
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className="border-amber-400/40 text-amber-400 bg-amber-400/10 font-bold text-xs"
                          >
                            {ws.department || "GNITS"}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Registration:</span>
                            <Switch
                              checked={ws.registration_open}
                              onCheckedChange={(val) => toggleRegistration(ws, val)}
                            />
                            <Badge
                              className={`text-[10px] font-bold ${
                                ws.registration_open
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                  : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                              }`}
                            >
                              {ws.registration_open ? "LIVE" : "PAUSED"}
                            </Badge>
                          </div>
                        </div>

                        <CardTitle className="text-lg font-black text-white mt-3 leading-snug">
                          {ws.title}
                        </CardTitle>
                        {ws.subtitle && (
                          <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1">
                            {ws.subtitle}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="p-5 pt-0 space-y-4">
                        {/* Event Details snippet */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">DATES</span>
                            <span className="font-semibold">{ws.dates}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">VENUE</span>
                            <span className="font-semibold truncate block">{ws.venue}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-muted-foreground block text-[10px]">FEE</span>
                            <span className="font-bold text-amber-400">₹{ws.registration_fee}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-muted-foreground block text-[10px]">REGISTRATIONS</span>
                            <span className="font-bold text-emerald-400">{wsRegs.length} / {ws.seat_limit}</span>
                          </div>
                        </div>

                        {/* Generated Links Section */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                            Generated Access URLs
                          </Label>

                          {/* Public User Link */}
                          <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-md border border-slate-800">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3 text-cyan-400" /> Public User Landing & Registration
                              </span>
                              <p className="text-xs font-mono text-cyan-300 truncate">
                                /{ws.slug}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs hover:bg-slate-800 text-slate-300"
                                onClick={() => copyToClipboard(userUrl, `user-${ws.slug}`)}
                              >
                                {copiedKey === `user-${ws.slug}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
                                asChild
                              >
                                <a href={`/${ws.slug}`} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </div>
                          </div>

                          {/* Workshop Admin Link */}
                          <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-md border border-slate-800">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-amber-400" /> Workshop Admin Portal
                              </span>
                              <p className="text-xs font-mono text-amber-300 truncate">
                                /{ws.slug}/admin
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs hover:bg-slate-800 text-slate-300"
                                onClick={() => copyToClipboard(adminUrl, `admin-${ws.slug}`)}
                              >
                                {copiedKey === `admin-${ws.slug}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                                asChild
                              >
                                <a href={`/${ws.slug}/admin`} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Admin Credentials Display */}
                        <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                            <span className="flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5" /> Workshop Admin Credentials
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setVisiblePasswords((prev) => ({
                                  ...prev,
                                  [ws.slug]: !prev[ws.slug],
                                }))
                              }
                              className="text-[11px] text-muted-foreground hover:text-white flex items-center gap-1"
                            >
                              {isPassVisible ? (
                                <>
                                  <EyeOff className="h-3 w-3" /> Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" /> Reveal
                                </>
                              )}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
                            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                              <span className="text-[10px] text-muted-foreground block">USERNAME</span>
                              <span className="text-white font-bold">{ws.admin_username || `${ws.slug}_admin`}</span>
                            </div>
                            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                              <span className="text-[10px] text-muted-foreground block">PASSWORD</span>
                              <span className="text-amber-300 font-bold">
                                {isPassVisible
                                  ? ws.admin_password || "gnits@admin2026"
                                  : "••••••••••••"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 text-xs bg-rose-900/40 text-rose-300 border border-rose-800 hover:bg-rose-900"
                        onClick={() => handleDelete(ws)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:text-white"
                          onClick={() => openEditModal(ws)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                          asChild
                        >
                          <a href={`/${ws.slug}/admin`} target="_blank" rel="noreferrer">
                            Open Admin Portal →
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Workshop Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-400" />
              {isNew ? "Create & Provision New Workshop" : `Edit Workshop: ${editingWs?.title}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Set workshop name, URL slug, schedule, and assign administrator credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveWorkshop} className="space-y-4 py-2">
            {/* Workshop Name & Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-bold text-slate-200">Workshop Name *</Label>
                <Input
                  required
                  value={editingWs?.title || ""}
                  onChange={(e) => {
                    const title = e.target.value;
                    const autoSlug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                    setEditingWs((prev) => ({
                      ...prev,
                      title,
                      slug: isNew ? autoSlug : prev?.slug || autoSlug,
                    }));
                  }}
                  placeholder="e.g. AI bootcamp"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-200">URL Identifier / Slug *</Label>
                <Input
                  required
                  value={editingWs?.slug || ""}
                  onChange={(e) =>
                    setEditingWs((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    }))
                  }
                  placeholder="e.g. ai-bootcamp"
                  className="bg-slate-950 border-slate-800 text-white font-mono"
                />
              </div>
            </div>

            {/* Live Generated URLs Preview Card */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-500/30 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                Live URLs Generated for this Workshop
              </span>
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                    <Globe className="h-3.5 w-3.5 text-cyan-400" /> For Users:
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    gnitsworkshop.vercel.app/{editingWs?.slug || "workshop-name"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> For Workshop Admin:
                  </span>
                  <span className="font-mono text-amber-300 font-bold">
                    gnitsworkshop.vercel.app/{editingWs?.slug || "workshop-name"}/admin
                  </span>
                </div>
              </div>
            </div>

            {/* Workshop Admin Credentials Section */}
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-3">
              <div>
                <Label className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <Lock className="h-4 w-4" /> Workshop Admin Access Credentials
                </Label>
                <p className="text-[11px] text-slate-400">
                  Credentials used by the workshop coordinator/admin to log into /{editingWs?.slug || "slug"}/admin
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-200">Admin Username</Label>
                  <Input
                    required
                    value={editingWs?.admin_username || ""}
                    onChange={(e) =>
                      setEditingWs((p) => ({ ...p, admin_username: e.target.value }))
                    }
                    placeholder="e.g. aibootcamp_admin"
                    className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-200">Admin Password</Label>
                  <div className="relative">
                    <Input
                      required
                      type={showWsPassword ? "text" : "password"}
                      value={editingWs?.admin_password || ""}
                      onChange={(e) =>
                        setEditingWs((p) => ({ ...p, admin_password: e.target.value }))
                      }
                      placeholder="e.g. ai@workshop2026"
                      className="bg-slate-950 border-slate-800 text-white font-mono text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWsPassword(!showWsPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-white"
                    >
                      {showWsPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Department & Fee */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold text-slate-200">Department</Label>
                <Input
                  value={editingWs?.department || ""}
                  onChange={(e) =>
                    setEditingWs((p) => ({ ...p, department: e.target.value }))
                  }
                  placeholder="e.g. CSE, IT, CSE (Data Science)"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-200">Registration Fee (₹)</Label>
                <Input
                  type="number"
                  value={editingWs?.registration_fee ?? 250}
                  onChange={(e) =>
                    setEditingWs((p) => ({
                      ...p,
                      registration_fee: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>

            {/* Dates & Timings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold text-slate-200">Dates</Label>
                <Input
                  value={editingWs?.dates || ""}
                  onChange={(e) =>
                    setEditingWs((p) => ({ ...p, dates: e.target.value }))
                  }
                  placeholder="e.g. 24 October 2026 – 25 October 2026"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-200">Timings</Label>
                <Input
                  value={editingWs?.timings || ""}
                  onChange={(e) =>
                    setEditingWs((p) => ({ ...p, timings: e.target.value }))
                  }
                  placeholder="e.g. 9:00 AM to 4:00 PM"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>

            {/* Venue & Seat Limit */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold text-slate-200">Venue</Label>
                <Input
                  value={editingWs?.venue || ""}
                  onChange={(e) =>
                    setEditingWs((p) => ({ ...p, venue: e.target.value }))
                  }
                  placeholder="e.g. CL-12 & 13, Admin Block, GNITS"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-200">Seat Limit</Label>
                <Input
                  type="number"
                  value={editingWs?.seat_limit ?? 500}
                  onChange={(e) =>
                    setEditingWs((p) => ({
                      ...p,
                      seat_limit: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold text-slate-200">UPI ID for Fee Payment</Label>
                <Input
                  value={editingWs?.upi_id || ""}
                  onChange={(e) =>
                    setEditingWs((p) => ({ ...p, upi_id: e.target.value }))
                  }
                  placeholder="e.g. 9849012345@upi"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-200">Account Name</Label>
                <Input
                  value={editingWs?.account_name || ""}
                  onChange={(e) =>
                    setEditingWs((p) => ({ ...p, account_name: e.target.value }))
                  }
                  placeholder="e.g. GNITS CSI Chapter"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>

            {/* Assets */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold text-slate-200">Hero Banner Image</Label>
                {editingWs?.hero_banner_url && (
                  <img
                    src={editingWs.hero_banner_url}
                    alt="Banner preview"
                    className="mt-1 h-20 w-full object-cover rounded border border-slate-800"
                  />
                )}
                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-700 p-2 hover:bg-slate-800 text-xs font-semibold">
                  <Upload className="h-3.5 w-3.5 text-amber-400" />
                  <span>{uploadingBanner ? "Uploading…" : "Upload banner image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAsset(f, "banner");
                    }}
                  />
                </label>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-200">Payment QR Code</Label>
                {editingWs?.qr_code_url && (
                  <img
                    src={editingWs.qr_code_url}
                    alt="QR preview"
                    className="mt-1 h-20 w-20 object-contain rounded border border-slate-800 mx-auto"
                  />
                )}
                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-700 p-2 hover:bg-slate-800 text-xs font-semibold">
                  <Upload className="h-3.5 w-3.5 text-amber-400" />
                  <span>{uploadingQR ? "Uploading…" : "Upload QR code"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAsset(f, "qr");
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs font-semibold text-slate-200">Description</Label>
              <Textarea
                rows={3}
                value={editingWs?.description || ""}
                onChange={(e) =>
                  setEditingWs((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Detailed workshop overview and syllabus..."
                className="bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-slate-700 bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? "Create Workshop & URLs" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
