import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePaymentSettings } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/payment-settings")({
  component: PaymentSettingsPage,
});

function PaymentSettingsPage() {
  const qc = useQueryClient();
  const { data: ps } = usePaymentSettings();
  const [upi, setUpi] = useState("");
  const [acct, setAcct] = useState("");
  const [internalFee, setInternalFee] = useState(250);
  const [externalFee, setExternalFee] = useState(500);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ps) {
      setUpi(ps.upi_id || "");
      setAcct(ps.account_name || "");
      setInternalFee(ps.internal_fee);
      setExternalFee(ps.external_fee);
      setQrUrl(ps.qr_code_url || null);
    }
  }, [ps]);

  async function uploadQR(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `qr-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("qr-codes")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("qr-codes").getPublicUrl(path);
    setQrUrl(data.publicUrl);
    setUploading(false);
    toast.success("QR uploaded. Click Save to persist.");
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("payment_settings")
      .update({
        upi_id: upi,
        account_name: acct,
        qr_code_url: qrUrl,
        internal_fee: internalFee,
        external_fee: externalFee,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ps!.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <p className="text-sm text-muted-foreground">
          Updates reflect instantly on the registration page.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>UPI & Account</CardTitle>
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
                placeholder="GNITS FDP"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Internal Fee (₹)</Label>
                <Input
                  type="number"
                  value={internalFee}
                  onChange={(e) => setInternalFee(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>External Fee (₹)</Label>
                <Input
                  type="number"
                  value={externalFee}
                  onChange={(e) => setExternalFee(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="bg-gradient-primary">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Settings
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex aspect-square w-full max-w-xs items-center justify-center rounded-lg border bg-muted/30">
              {qrUrl ? (
                <img src={qrUrl} alt="QR" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-muted-foreground">No QR uploaded</div>
              )}
            </div>
            <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 hover:bg-muted/50">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{uploading ? "Uploading..." : "Upload QR (JPG, PNG)"}</span>
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
    </div>
  );
}
