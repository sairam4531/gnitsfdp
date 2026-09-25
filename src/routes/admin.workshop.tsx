import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useWebsiteSettings,
  useRegistrations,
  usePaymentSettings,
  useSpeakers,
  useCoordinators,
  useWorkshops,
  Workshop,
  Coordinator,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Upload,
  Plus,
  Edit,
  Trash2,
  Users,
  CalendarCheck,
  Settings,
  CreditCard,
  Mic,
  Layers,
  IndianRupee,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/admin/workshop")({
  component: WorkshopPage,
});

type SpeakerRow = {
  id: string;
  name: string;
  designation: string;
  organization: string | null;
  photo_url: string | null;
  sort_order: number;
};

type WS = {
  id?: string;
  fdp_title?: string;
  fdp_subtitle?: string;
  fdp_dates?: string;
  venue?: string;
  description?: string;
  registration_open?: boolean;
  seat_limit?: number;
  hero_banner_url?: string | null;
  brochure_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  footer_text?: string | null;
  timings?: string | null;
};

function WorkshopPage() {
  const qc = useQueryClient();
  const { data: settings } = useWebsiteSettings();
  const { data: regs = [] } = useRegistrations();
  const { data: ps } = usePaymentSettings();
  const { data: speakers = [] } = useSpeakers();
  const { data: coords = [] } = useCoordinators();

  // Registration states
  const [open, setOpen] = useState(true);
  const [seatLimit, setSeatLimit] = useState(500);
  const [savingReg, setSavingReg] = useState(false);

  // Details states
  const [s, setS] = useState<WS>({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  // Payment states
  const [upi, setUpi] = useState("");
  const [acct, setAcct] = useState("");
  const [internalFee, setInternalFee] = useState(250);
  const [externalFee, setExternalFee] = useState(500);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Speakers states
  const [editingSpeaker, setEditingSpeaker] = useState<Partial<SpeakerRow> | null>(null);
  const [editingCoordinator, setEditingCoordinator] = useState<Partial<Coordinator> | null>(null);

  // Multi-Workshop states
  const { data: workshops = [] } = useWorkshops();
  const [editingWorkshop, setEditingWorkshop] = useState<Partial<Workshop> | null>(null);
  const [isNewWorkshop, setIsNewWorkshop] = useState(false);
  const [savingWorkshop, setSavingWorkshop] = useState(false);
  const [uploadingWorkshopBanner, setUploadingWorkshopBanner] = useState(false);
  const [uploadingWorkshopQR, setUploadingWorkshopQR] = useState(false);

  async function uploadWorkshopAsset(file: File, type: "banner" | "qr") {
    if (type === "banner") setUploadingWorkshopBanner(true);
    else setUploadingWorkshopQR(true);

    try {
      const bucket = type === "banner" ? "website-assets" : "payment-screenshots";
      const path = `workshop-${type}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      if (type === "banner") {
        setEditingWorkshop((prev) => ({ ...prev, hero_banner_url: data.publicUrl }));
      } else {
        setEditingWorkshop((prev) => ({ ...prev, qr_code_url: data.publicUrl }));
      }
      toast.success("Asset uploaded successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      if (type === "banner") setUploadingWorkshopBanner(false);
      else setUploadingWorkshopQR(false);
    }
  }

  async function saveWorkshopItem() {
    if (!editingWorkshop || !editingWorkshop.title || !editingWorkshop.slug) {
      toast.error("Workshop Title and Slug are required.");
      return;
    }
    setSavingWorkshop(true);
    try {
      const payload = {
        title: editingWorkshop.title,
        slug: editingWorkshop.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        subtitle: editingWorkshop.subtitle || null,
        description: editingWorkshop.description || null,
        department: editingWorkshop.department || "CSE",
        dates: editingWorkshop.dates || "TBD",
        timings: editingWorkshop.timings || "9:00 AM to 4:00 PM",
        venue: editingWorkshop.venue || "GNITS Campus",
        registration_fee: Number(editingWorkshop.registration_fee ?? 250),
        seat_limit: Number(editingWorkshop.seat_limit ?? 500),
        registration_open: editingWorkshop.registration_open ?? true,
        hero_banner_url: editingWorkshop.hero_banner_url || null,
        brochure_url: editingWorkshop.brochure_url || null,
        upi_id: editingWorkshop.upi_id || null,
        account_name: editingWorkshop.account_name || null,
        qr_code_url: editingWorkshop.qr_code_url || null,
        sort_order: Number(editingWorkshop.sort_order ?? 0),
        is_featured: !!editingWorkshop.is_featured,
        updated_at: new Date().toISOString(),
      };

      if (isNewWorkshop || !editingWorkshop.id || editingWorkshop.id.startsWith("workshop-")) {
        const { error } = await supabase.from("workshops" as never).insert(payload as never);
        if (error) throw error;
        toast.success("Workshop created successfully!");
      } else {
        const { error } = await supabase
          .from("workshops" as never)
          .update(payload as never)
          .eq("id", editingWorkshop.id);
        if (error) throw error;
        toast.success("Workshop updated successfully!");
      }
      setEditingWorkshop(null);
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      console.error("Save workshop error:", err);
      toast.error(err?.message || "Failed to save workshop. Please ensure database migration is applied.");
    } finally {
      setSavingWorkshop(false);
    }
  }

  async function deleteWorkshopItem(id: string, title: string) {
    if (!confirm(`Delete workshop "${title}"?`)) return;
    try {
      const { error } = await supabase.from("workshops" as never).delete().eq("id", id);
      if (error) throw error;
      toast.success("Workshop deleted.");
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete workshop.");
    }
  }

  async function toggleWorkshopRegistration(ws: Workshop, newOpen: boolean) {
    try {
      const { error } = await supabase
        .from("workshops" as never)
        .update({ registration_open: newOpen } as never)
        .eq("id", ws.id);
      if (error) throw error;
      toast.success(`Registration ${newOpen ? "opened" : "closed"} for ${ws.title}`);
      qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle registration.");
    }
  }

  // Sync settings
  useEffect(() => {
    if (settings) {
      setOpen(settings.registration_open);
      setSeatLimit(settings.seat_limit);
      setS(settings as WS);
    }
  }, [settings]);

  // Sync payment
  useEffect(() => {
    if (ps) {
      setUpi(ps.upi_id || "");
      setAcct(ps.account_name || "");
      setInternalFee(ps.internal_fee);
      setExternalFee(ps.external_fee);
      setQrUrl(ps.qr_code_url || null);
    }
  }, [ps]);

  // Helper for Details fields
  function up<K extends keyof WS>(k: K, v: WS[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  // --- Website details actions ---
  async function uploadAsset(file: File, field: "hero_banner_url" | "brochure_url") {
    setUploadingAsset(field);
    const path = `${field}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("website-assets")
      .upload(path, file, { contentType: file.type, upsert: true });
    setUploadingAsset(null);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("website-assets").getPublicUrl(path);
    up(field, data.publicUrl);
    toast.success("Uploaded. Save Changes to persist.");
  }

  async function saveDetails() {
    if (!settings) return;
    setSavingDetails(true);
    const { id: _id, ...payload } = s;
    void _id;
    const { error } = await supabase
      .from("website_settings")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", settings.id);
    setSavingDetails(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Workshop Details Saved");
      qc.invalidateQueries({ queryKey: ["website_settings"] });
    }
  }

  // --- Registration controls actions ---
  async function saveRegistration() {
    if (!settings) return;
    setSavingReg(true);
    const { error } = await supabase
      .from("website_settings")
      .update({
        registration_open: open,
        seat_limit: seatLimit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);
    setSavingReg(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Registration Controls Saved");
      qc.invalidateQueries({ queryKey: ["website_settings"] });
    }
  }

  // --- Payment settings actions ---
  async function uploadQR(file: File) {
    setUploadingQR(true);
    const ext = file.name.split(".").pop();
    const path = `qr-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("qr-codes")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) {
      toast.error(error.message);
      setUploadingQR(false);
      return;
    }
    const { data } = supabase.storage.from("qr-codes").getPublicUrl(path);
    setQrUrl(data.publicUrl);
    setUploadingQR(false);
    toast.success("QR uploaded. Click Save Payment to persist.");
  }

  async function savePayment() {
    if (!ps) return;
    setSavingPayment(true);
    const { error } = await supabase
      .from("payment_settings")
      .update({
        upi_id: upi,
        account_name: acct,
        qr_code_url: qrUrl,
        internal_fee: internalFee,
        external_fee: internalFee,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ps.id);
    setSavingPayment(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Payment Settings Saved");
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    }
  }

  // --- Speakers actions ---
  async function uploadSpeakerPhoto(file: File): Promise<string | null> {
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("speaker-images")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("speaker-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveSpeaker() {
    if (!editingSpeaker) return;
    const payload = {
      name: editingSpeaker.name!,
      designation: editingSpeaker.designation!,
      organization: editingSpeaker.organization || null,
      photo_url: editingSpeaker.photo_url || null,
      sort_order: editingSpeaker.sort_order || 0,
    };
    const { error } = editingSpeaker.id
      ? await supabase.from("speakers").update(payload).eq("id", editingSpeaker.id)
      : await supabase.from("speakers").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Speaker Saved");
      setEditingSpeaker(null);
      qc.invalidateQueries({ queryKey: ["speakers"] });
    }
  }

  async function deleteSpeaker(id: string) {
    if (!confirm("Delete speaker?")) return;
    const { error } = await supabase.from("speakers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Speaker Deleted");
      qc.invalidateQueries({ queryKey: ["speakers"] });
    }
  }

  // --- Coordinators actions ---
  async function saveCoordinator() {
    if (!editingCoordinator) return;
    const { name, department, phone, type, sort_order } = editingCoordinator;
    if (!name || !department || !phone || !type) {
      toast.error("Please fill Name, Department, Mobile, and Category");
      return;
    }
    const payload = {
      name,
      department,
      phone,
      type,
      sort_order: sort_order || 0,
    };

    const isEdit = !!editingCoordinator.id;
    const { error } = isEdit
      ? await supabase
          .from("coordinators" as never)
          .update(payload)
          .eq("id", editingCoordinator.id)
      : await supabase.from("coordinators" as never).insert(payload);

    if (error) toast.error(error.message);
    else {
      toast.success("Coordinator saved");
      setEditingCoordinator(null);
      qc.invalidateQueries({ queryKey: ["coordinators"] });
    }
  }

  async function deleteCoordinator(id: string) {
    if (!confirm("Delete this coordinator?")) return;
    const { error } = await supabase
      .from("coordinators" as never)
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["coordinators"] });
    }
  }

  const left = Math.max(0, seatLimit - regs.length);

  if (!settings || !ps) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workshop Management</h1>
        <p className="text-sm text-muted-foreground">
          Configure registration status, landing page details, payment metrics, and speakers.
        </p>
      </div>

      <Tabs defaultValue="workshops" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 max-w-3xl">
          <TabsTrigger value="workshops" className="flex items-center gap-1.5 font-bold">
            <Layers className="h-4 w-4" /> Workshops
          </TabsTrigger>
          <TabsTrigger value="registration" className="flex items-center gap-1.5">
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

        {/* --- ALL WORKSHOPS TAB --- */}
        <TabsContent value="workshops" className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Active Workshops & Workathons</h2>
              <p className="text-sm text-muted-foreground">
                Manage, add, and configure independent workshops, dates, fees, and registration status.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingWorkshop({
                  title: "",
                  slug: "",
                  department: "CSE",
                  dates: "",
                  timings: "9:00 AM to 4:00 PM",
                  venue: "GNITS Campus",
                  registration_fee: 250,
                  seat_limit: 500,
                  registration_open: true,
                  sort_order: workshops.length + 1,
                });
                setIsNewWorkshop(true);
              }}
              className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Workshop
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {workshops.map((ws) => (
              <Card
                key={ws.slug}
                className="overflow-hidden border-border/70 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {ws.hero_banner_url && (
                    <div className="h-36 w-full overflow-hidden bg-slate-900 border-b">
                      <img src={ws.hero_banner_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="border-amber-400/40 text-amber-500 font-bold text-[11px]"
                      >
                        {ws.department || "GNITS"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Registration:</span>
                        <Switch
                          checked={ws.registration_open}
                          onCheckedChange={(val) => toggleWorkshopRegistration(ws, val)}
                        />
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold leading-tight mt-2 text-foreground">
                      {ws.title}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-muted-foreground mt-1">
                      URL: /register?workshop={ws.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-2 text-xs text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Dates:</strong> {ws.dates}
                    </div>
                    <div>
                      <strong className="text-foreground">Venue:</strong> {ws.venue}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                      <span>
                        Fee:{" "}
                        <strong className="text-foreground font-bold">₹{ws.registration_fee}</strong>
                      </span>
                      <span>
                        Seats:{" "}
                        <strong className="text-foreground font-bold">{ws.seat_limit}</strong>
                      </span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                  <a
                    href={`/register?workshop=${ws.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Public Form <ExternalLink className="h-3 w-3" />
                  </a>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingWorkshop({ ...ws });
                        setIsNewWorkshop(false);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteWorkshopItem(ws.id, ws.title)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- REGISTRATION TAB --- */}
        <TabsContent value="registration" className="space-y-6 animate-fade-in">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-muted-foreground">Status</div>
                <div
                  className={`mt-1 text-2xl font-bold ${open ? "text-emerald-600" : "text-destructive"}`}
                >
                  {open ? "OPEN" : "CLOSED"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-muted-foreground">Seats Available</div>
                <div className="mt-1 text-2xl font-bold">
                  {left} / {seatLimit}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-xs text-muted-foreground">Registered</div>
                <div className="mt-1 text-2xl font-bold">{regs.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Changes apply instantly to the public site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Registration Open</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle to open or close registrations.
                  </p>
                </div>
                <Switch checked={open} onCheckedChange={setOpen} />
              </div>
              <div>
                <Label>Seat Limit</Label>
                <Input
                  type="number"
                  value={seatLimit}
                  onChange={(e) => setSeatLimit(parseInt(e.target.value) || 0)}
                />
              </div>
              <Button
                onClick={saveRegistration}
                disabled={savingReg}
                className="bg-gradient-primary"
              >
                {savingReg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Registration
                Controls
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- DETAILS TAB --- */}
        <TabsContent value="details" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workshop Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={String(s.fdp_title ?? "")}
                    onChange={(e) => up("fdp_title", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={String(s.fdp_subtitle ?? "")}
                    onChange={(e) => up("fdp_subtitle", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Dates</Label>
                  <Input
                    value={String(s.fdp_dates ?? "")}
                    onChange={(e) => up("fdp_dates", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Timings</Label>
                  <Input
                    value={String(s.timings ?? "")}
                    onChange={(e) => up("timings", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={String(s.venue ?? "")}
                    onChange={(e) => up("venue", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={5}
                    value={String(s.description ?? "")}
                    onChange={(e) => up("description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Footer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      value={String(s.contact_email ?? "")}
                      onChange={(e) => up("contact_email", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={String(s.contact_phone ?? "")}
                      onChange={(e) => up("contact_phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Footer Text</Label>
                    <Input
                      value={String(s.footer_text ?? "")}
                      onChange={(e) => up("footer_text", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assets</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Hero Banner</Label>
                    {s.hero_banner_url && (
                      <img
                        src={String(s.hero_banner_url)}
                        alt=""
                        className="mt-2 h-24 w-full rounded object-cover border"
                      />
                    )}
                    <Label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2.5 hover:bg-muted/50 text-xs">
                      <Upload className="h-3.5 w-3.5" />
                      <span>
                        {uploadingAsset === "hero_banner_url" ? "Uploading..." : "Upload banner"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && uploadAsset(e.target.files[0], "hero_banner_url")
                        }
                      />
                    </Label>
                  </div>
                  <div>
                    <Label>Brochure (PDF)</Label>
                    {s.brochure_url && (
                      <div className="mt-2 h-24 flex items-center justify-center border rounded bg-muted/20">
                        <a
                          href={String(s.brochure_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-secondary underline font-semibold"
                        >
                          View Current Brochure
                        </a>
                      </div>
                    )}
                    <Label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2.5 hover:bg-muted/50 text-xs">
                      <Upload className="h-3.5 w-3.5" />
                      <span>
                        {uploadingAsset === "brochure_url" ? "Uploading..." : "Upload PDF brochure"}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] && uploadAsset(e.target.files[0], "brochure_url")
                        }
                      />
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <Button
            onClick={saveDetails}
            disabled={savingDetails}
            className="bg-gradient-primary mt-6"
          >
            {savingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Details &
            Assets
          </Button>
        </TabsContent>

        {/* --- PAYMENT TAB --- */}
        <TabsContent value="payment" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>UPI & Account Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>UPI ID</Label>
                  <Input
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                    placeholder="example@upi"
                  />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={acct}
                    onChange={(e) => setAcct(e.target.value)}
                    placeholder="GNITS Workshop"
                  />
                </div>
                <div>
                  <Label>Registration Fee (₹)</Label>
                  <Input
                    type="number"
                    value={internalFee}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setInternalFee(val);
                      setExternalFee(val);
                    }}
                  />
                </div>
                <Button
                  onClick={savePayment}
                  disabled={savingPayment}
                  className="bg-gradient-primary"
                >
                  {savingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Payment
                  Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment QR Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex aspect-square w-full max-w-[200px] items-center justify-center rounded-lg border bg-muted/10 mx-auto">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="QR"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">No QR uploaded</div>
                  )}
                </div>
                <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 hover:bg-muted/50 text-sm max-w-xs mx-auto">
                  <Upload className="h-4 w-4" />
                  <span>{uploadingQR ? "Uploading..." : "Upload QR Code (JPG, PNG)"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadQR(e.target.files[0])}
                  />
                </Label>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- SPEAKERS TAB --- */}
        <TabsContent value="speakers" className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg">Resource Persons</CardTitle>
              <p className="text-xs text-muted-foreground">{speakers.length} speakers registered</p>
            </div>
            <Dialog open={!!editingSpeaker} onOpenChange={(o) => !o && setEditingSpeaker(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingSpeaker({})} className="bg-gradient-primary">
                  <Plus className="mr-2 h-4 w-4" /> Add Speaker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSpeaker?.id ? "Edit" : "Add"} Speaker</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editingSpeaker?.name || ""}
                      onChange={(e) => setEditingSpeaker((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Designation</Label>
                    <Input
                      value={editingSpeaker?.designation || ""}
                      onChange={(e) =>
                        setEditingSpeaker((p) => ({ ...p, designation: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Organization</Label>
                    <Input
                      value={editingSpeaker?.organization || ""}
                      onChange={(e) =>
                        setEditingSpeaker((p) => ({ ...p, organization: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={editingSpeaker?.sort_order || 0}
                      onChange={(e) =>
                        setEditingSpeaker((p) => ({
                          ...p,
                          sort_order: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Photo</Label>
                    {editingSpeaker?.photo_url && (
                      <img
                        src={editingSpeaker.photo_url}
                        alt=""
                        className="mt-2 h-20 w-20 rounded-full object-cover border"
                      />
                    )}
                    <Label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2.5 hover:bg-muted/50 text-xs">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const url = await uploadSpeakerPhoto(f);
                          if (url) setEditingSpeaker((p) => ({ ...p, photo_url: url }));
                        }}
                      />
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingSpeaker(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveSpeaker} className="bg-gradient-primary">
                    Save Speaker
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {speakers.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-primary border">
                      {s.photo_url ? (
                        <img
                          src={s.photo_url}
                          alt={s.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-8 w-8 text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-sm">{s.name}</h3>
                      <p className="text-xs text-secondary leading-normal">{s.designation}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{s.organization}</p>
                      <div className="mt-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingSpeaker(s)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => deleteSpeaker(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- COORDINATORS TAB --- */}
        <TabsContent value="coordinators" className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg">Co-ordinators</CardTitle>
              <p className="text-xs text-muted-foreground">
                {coords.length} co-ordinators registered
              </p>
            </div>
            <Dialog
              open={!!editingCoordinator}
              onOpenChange={(o) => !o && setEditingCoordinator(null)}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCoordinator({})} className="bg-gradient-primary">
                  <Plus className="mr-2 h-4 w-4" /> Add Co-ordinator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCoordinator?.id ? "Edit" : "Add"} Co-ordinator</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editingCoordinator?.name || ""}
                      onChange={(e) =>
                        setEditingCoordinator((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g. Dr. A. Faculty"
                    />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select
                      onValueChange={(v) => setEditingCoordinator((p) => ({ ...p, department: v }))}
                      value={editingCoordinator?.department || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {["CSE", "CSE(AI&ML)", "CSE(DS)", "IT", "ECE", "EEE"].map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mobile Number</Label>
                    <Input
                      value={editingCoordinator?.phone || ""}
                      onChange={(e) =>
                        setEditingCoordinator((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div>
                    <Label>Co-ordinator Category</Label>
                    <Select
                      onValueChange={(v) =>
                        setEditingCoordinator((p) => ({ ...p, type: v as Coordinator["type"] }))
                      }
                      value={editingCoordinator?.type || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Faculty">Faculty Co-ordinator</SelectItem>
                        <SelectItem value="Student">Student Co-ordinator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={editingCoordinator?.sort_order || 0}
                      onChange={(e) =>
                        setEditingCoordinator((p) => ({
                          ...p,
                          sort_order: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingCoordinator(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveCoordinator} className="bg-gradient-primary">
                    Save Co-ordinator
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-md font-bold mb-3 text-secondary">Faculty Co-ordinators</h3>
              {coords.filter((c) => c.type === "Faculty").length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No faculty co-ordinators added yet.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {coords
                    .filter((c) => c.type === "Faculty")
                    .map((c) => (
                      <Card key={c.id}>
                        <CardContent className="p-4 flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-base text-foreground">{c.name}</h4>
                            <p className="text-xs text-secondary mt-0.5 font-medium">
                              {c.department} Department
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              {c.phone}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingCoordinator(c)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => deleteCoordinator(c.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-md font-bold mb-3 text-secondary">Student Co-ordinators</h3>
              {coords.filter((c) => c.type === "Student").length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No student co-ordinators added yet.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {coords
                    .filter((c) => c.type === "Student")
                    .map((c) => (
                      <Card key={c.id}>
                        <CardContent className="p-4 flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-base text-foreground">{c.name}</h4>
                            <p className="text-xs text-secondary mt-0.5 font-medium">
                              {c.department} Department
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              {c.phone}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingCoordinator(c)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => deleteCoordinator(c.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Workshop Create/Edit Dialog */}
      <Dialog
        open={!!editingWorkshop}
        onOpenChange={(v) => {
          if (!v) setEditingWorkshop(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewWorkshop ? "Add New Technical Workshop" : "Edit Workshop"}
            </DialogTitle>
            <DialogDescription>
              Configure the workshop title, registration URL slug, dates, venue, pricing, and assets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Workshop Title *</Label>
                <Input
                  value={editingWorkshop?.title || ""}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({
                      ...p,
                      title: e.target.value,
                      slug: isNewWorkshop
                        ? e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "")
                        : (p?.slug || ""),
                    }))
                  }
                  placeholder="e.g. Agentic AI & Cloud Workshop"
                />
              </div>

              <div>
                <Label>URL Slug (identifier) *</Label>
                <Input
                  value={editingWorkshop?.slug || ""}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({
                      ...p,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    }))
                  }
                  placeholder="e.g. agentic-ai-cloud"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Public Link: /register?workshop={editingWorkshop?.slug || "slug"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Organizing Department</Label>
                <Input
                  value={editingWorkshop?.department || ""}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({ ...p, department: e.target.value }))
                  }
                  placeholder="e.g. CSE (Data Science) or CSE"
                />
              </div>

              <div>
                <Label>Registration Fee (₹)</Label>
                <Input
                  type="number"
                  value={editingWorkshop?.registration_fee ?? 250}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({
                      ...p,
                      registration_fee: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Dates</Label>
                <Input
                  value={editingWorkshop?.dates || ""}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({ ...p, dates: e.target.value }))
                  }
                  placeholder="e.g. 18 September 2026 – 19 September 2026"
                />
              </div>

              <div>
                <Label>Timings</Label>
                <Input
                  value={editingWorkshop?.timings || ""}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({ ...p, timings: e.target.value }))
                  }
                  placeholder="e.g. 9:00 AM to 4:00 PM"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Venue</Label>
                <Input
                  value={editingWorkshop?.venue || ""}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({ ...p, venue: e.target.value }))
                  }
                  placeholder="e.g. Main Seminar Hall, Admin Block, GNITS"
                />
              </div>

              <div>
                <Label>Seat Limit</Label>
                <Input
                  type="number"
                  value={editingWorkshop?.seat_limit ?? 500}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({
                      ...p,
                      seat_limit: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Subtitle / Short Summary</Label>
              <Input
                value={editingWorkshop?.subtitle || ""}
                onChange={(e) =>
                  setEditingWorkshop((p) => ({ ...p, subtitle: e.target.value }))
                }
                placeholder="Brief high-impact tagline for cards and banners"
              />
            </div>

            <div>
              <Label>Full Description</Label>
              <Textarea
                rows={3}
                value={editingWorkshop?.description || ""}
                onChange={(e) =>
                  setEditingWorkshop((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Detailed workshop description and learning outcomes"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t pt-3">
              <div>
                <Label>Workshop Specific UPI ID (optional)</Label>
                <Input
                  value={editingWorkshop?.upi_id || ""}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({ ...p, upi_id: e.target.value }))
                  }
                  placeholder="Leaves blank to use global UPI"
                />
              </div>

              <div>
                <Label>Account Name (optional)</Label>
                <Input
                  value={editingWorkshop?.account_name || ""}
                  onChange={(e) =>
                    setEditingWorkshop((p) => ({ ...p, account_name: e.target.value }))
                  }
                  placeholder="Leaves blank to use global Account"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t pt-3">
              <div>
                <Label>Hero Banner Image</Label>
                {editingWorkshop?.hero_banner_url && (
                  <img
                    src={editingWorkshop.hero_banner_url}
                    alt="Banner preview"
                    className="mt-2 h-20 w-full object-cover rounded border"
                  />
                )}
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2 hover:bg-muted/50 text-xs font-semibold">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingWorkshopBanner ? "Uploading…" : "Upload banner"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadWorkshopAsset(f, "banner");
                    }}
                  />
                </label>
              </div>

              <div>
                <Label>Payment QR Code</Label>
                {editingWorkshop?.qr_code_url && (
                  <img
                    src={editingWorkshop.qr_code_url}
                    alt="QR preview"
                    className="mt-2 h-20 w-20 object-contain rounded border mx-auto"
                  />
                )}
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-2 hover:bg-muted/50 text-xs font-semibold">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingWorkshopQR ? "Uploading…" : "Upload QR code"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadWorkshopAsset(f, "qr");
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <div>
                <Label>Registration Open</Label>
                <p className="text-xs text-muted-foreground">
                  Allow students to register for this workshop
                </p>
              </div>
              <Switch
                checked={editingWorkshop?.registration_open ?? true}
                onCheckedChange={(v) =>
                  setEditingWorkshop((p) => ({ ...p, registration_open: v }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWorkshop(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveWorkshopItem}
              disabled={savingWorkshop}
              className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold"
            >
              {savingWorkshop && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNewWorkshop ? "Create Workshop" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
