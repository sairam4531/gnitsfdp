import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWebsiteSettings, useRegistrations } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/workshop")({
  component: WorkshopPage,
});

function WorkshopPage() {
  const qc = useQueryClient();
  const { data: settings } = useWebsiteSettings();
  const { data: regs = [] } = useRegistrations();
  const [open, setOpen] = useState(true);
  const [seatLimit, setSeatLimit] = useState(500);

  useEffect(() => {
    if (settings) { setOpen(settings.registration_open); setSeatLimit(settings.seat_limit); }
  }, [settings]);

  async function save() {
    const { error } = await supabase.from("website_settings").update({ registration_open: open, seat_limit: seatLimit, updated_at: new Date().toISOString() }).eq("id", settings!.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["website_settings"] }); }
  }

  const left = Math.max(0, seatLimit - regs.length);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Workshop Registration</h1><p className="text-sm text-muted-foreground">Open/close registrations and manage capacity.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Status</div><div className={`mt-1 text-2xl font-bold ${open ? "text-emerald-600" : "text-destructive"}`}>{open ? "OPEN" : "CLOSED"}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Seats Available</div><div className="mt-1 text-2xl font-bold">{left} / {seatLimit}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Registered</div><div className="mt-1 text-2xl font-bold">{regs.length}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Controls</CardTitle><CardDescription>Changes apply instantly to the public site.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div><Label>Registration Open</Label><p className="text-xs text-muted-foreground">Toggle to close registrations.</p></div>
            <Switch checked={open} onCheckedChange={setOpen} />
          </div>
          <div><Label>Seat Limit</Label><Input type="number" value={seatLimit} onChange={(e) => setSeatLimit(parseInt(e.target.value) || 0)} /></div>
          <Button onClick={save} className="bg-gradient-primary">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
