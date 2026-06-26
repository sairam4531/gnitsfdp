import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useWebsiteSettings } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/website-settings")({
  component: WebsiteSettingsPage,
});

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

function WebsiteSettingsPage() {
  const qc = useQueryClient();
  const { data: ws } = useWebsiteSettings();
  const [s, setS] = useState<WS>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ws) setS(ws as WS);
  }, [ws]);
  function up<K extends keyof WS>(k: K, v: WS[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  async function uploadAsset(file: File, field: "hero_banner_url" | "brochure_url") {
    const path = `${field}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("website-assets")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("website-assets").getPublicUrl(path);
    up(field, data.publicUrl);
    toast.success("Uploaded. Save to persist.");
  }

  async function save() {
    setSaving(true);
    const { id: _id, ...payload } = s;
    void _id;
    const { error } = await supabase
      .from("website_settings")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", ws!.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["website_settings"] });
    }
  }

  if (!ws) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Website Settings</h1>
        <p className="text-sm text-muted-foreground">Manage public site content.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>FDP Details</CardTitle>
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
              <Input value={String(s.venue ?? "")} onChange={(e) => up("venue", e.target.value)} />
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
        <Card>
          <CardHeader>
            <CardTitle>Registration & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Registration Open</Label>
              <Switch
                checked={!!s.registration_open}
                onCheckedChange={(v) => up("registration_open", v)}
              />
            </div>
            <div>
              <Label>Seat Limit</Label>
              <Input
                type="number"
                value={Number(s.seat_limit ?? 0)}
                onChange={(e) => up("seat_limit", parseInt(e.target.value) || 0)}
              />
            </div>
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Hero Banner</Label>
              {s.hero_banner_url ? (
                <img
                  src={String(s.hero_banner_url)}
                  alt=""
                  className="mt-2 h-32 w-full rounded object-cover"
                />
              ) : null}
              <Label className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 hover:bg-muted/50">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload banner image</span>
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
                <a
                  href={String(s.brochure_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-secondary underline"
                >
                  View current
                </a>
              )}
              <Label className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 hover:bg-muted/50">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload brochure PDF</span>
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
      <Button onClick={save} disabled={saving} className="bg-gradient-primary">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save All Changes
      </Button>
    </div>
  );
}
