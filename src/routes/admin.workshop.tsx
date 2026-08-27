import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useWebsiteSettings,
  useRegistrations,
  usePaymentSettings,
  useSpeakers,
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
};

function WorkshopPage() {
  const qc = useQueryClient();
  const { data: settings } = useWebsiteSettings();
  const { data: regs = [] } = useRegistrations();
  const { data: ps } = usePaymentSettings();
  const { data: speakers = [] } = useSpeakers();

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

      <Tabs defaultValue="registration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
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
        </TabsList>

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
      </Tabs>
    </div>
  );
}
