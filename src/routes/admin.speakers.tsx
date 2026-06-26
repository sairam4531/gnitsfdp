import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSpeakers } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Upload, Users } from "lucide-react";

export const Route = createFileRoute("/admin/speakers")({
  component: SpeakersPage,
});

type SpeakerRow = {
  id: string;
  name: string;
  designation: string;
  organization: string | null;
  photo_url: string | null;
  sort_order: number;
};

function SpeakersPage() {
  const qc = useQueryClient();
  const { data: speakers = [] } = useSpeakers();
  const [editing, setEditing] = useState<Partial<SpeakerRow> | null>(null);

  async function uploadPhoto(file: File): Promise<string | null> {
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
  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name!,
      designation: editing.designation!,
      organization: editing.organization || null,
      photo_url: editing.photo_url || null,
      sort_order: editing.sort_order || 0,
    };
    const { error } = editing.id
      ? await supabase.from("speakers").update(payload).eq("id", editing.id)
      : await supabase.from("speakers").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["speakers"] });
    }
  }
  async function del(id: string) {
    if (!confirm("Delete speaker?")) return;
    const { error } = await supabase.from("speakers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["speakers"] });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Speakers</h1>
          <p className="text-sm text-muted-foreground">{speakers.length} resource persons</p>
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({})} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Speaker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit" : "Add"} Speaker</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={editing?.name || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Designation</Label>
                <Input
                  value={editing?.designation || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, designation: e.target.value }))}
                />
              </div>
              <div>
                <Label>Organization</Label>
                <Input
                  value={editing?.organization || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, organization: e.target.value }))}
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={editing?.sort_order || 0}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <Label>Photo</Label>
                {editing?.photo_url && (
                  <img
                    src={editing.photo_url}
                    alt=""
                    className="mt-2 h-24 w-24 rounded object-cover"
                  />
                )}
                <Label className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadPhoto(f);
                      if (url) setEditing((p) => ({ ...p, photo_url: url }));
                    }}
                  />
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save} className="bg-gradient-primary">
                Save
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
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-primary">
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Users className="h-8 w-8 text-white/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold">{s.name}</h3>
                  <p className="text-sm text-secondary">{s.designation}</p>
                  <p className="text-xs text-muted-foreground">{s.organization}</p>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
