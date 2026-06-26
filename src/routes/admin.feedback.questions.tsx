import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ListChecks, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useFeedbackForms, feedbackDb, type FeedbackForm } from "@/lib/feedback";
import { QuestionsManager } from "@/components/feedback/QuestionsManager";

export const Route = createFileRoute("/admin/feedback/questions")({
  component: FeedbackFormsPage,
});

function FeedbackFormsPage() {
  const { data: forms = [], isLoading } = useFeedbackForms();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FeedbackForm | null>(null);
  const [creating, setCreating] = useState(false);
  const [managingQuestionsFor, setManagingQuestionsFor] = useState<FeedbackForm | null>(null);
  const [deleting, setDeleting] = useState<FeedbackForm | null>(null);

  async function toggleEnabled(form: FeedbackForm, enabled: boolean) {
    const { error } = await feedbackDb
      .from("feedback_forms")
      .update({ is_enabled: enabled })
      .eq("id", form.id);
    if (error) return toast.error(error.message);
    toast.success(enabled ? "Feedback enabled" : "Feedback disabled");
    qc.invalidateQueries({ queryKey: ["feedback_forms"] });
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await feedbackDb.from("feedback_forms").delete().eq("id", deleting.id);
    if (error) return toast.error(error.message);
    toast.success("Feedback form deleted");
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ["feedback_forms"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback Questions</h1>
          <p className="text-sm text-muted-foreground">
            Create feedback forms and manage their questions.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Feedback Form
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No feedback forms yet. Click "New Feedback Form" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{f.fdp_title}</h3>
                    {f.is_enabled ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">ON</Badge>
                    ) : (
                      <Badge variant="secondary">OFF</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      Button: <strong>{f.feedback_button_name}</strong>
                    </span>
                    {f.feedback_date && <span>Date: {f.feedback_date}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
                    <Switch checked={f.is_enabled} onCheckedChange={(v) => toggleEnabled(f, v)} />
                    <span className="text-xs font-medium">{f.is_enabled ? "ON" : "OFF"}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setManagingQuestionsFor(f)}>
                    <ListChecks className="mr-1 h-4 w-4" /> Questions
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(f)}>
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/feedback/responses">
                      <Eye className="mr-1 h-4 w-4" /> Responses
                    </Link>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleting(f)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormDialog
        open={creating || !!editing}
        form={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => qc.invalidateQueries({ queryKey: ["feedback_forms"] })}
      />

      <Dialog
        open={!!managingQuestionsFor}
        onOpenChange={(o) => !o && setManagingQuestionsFor(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Questions — {managingQuestionsFor?.fdp_title}</DialogTitle>
          </DialogHeader>
          {managingQuestionsFor && <QuestionsManager formId={managingQuestionsFor.id} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this feedback form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form, its questions and all responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FormDialog({
  open,
  form,
  onClose,
  onSaved,
}: {
  open: boolean;
  form: FeedbackForm | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fdpTitle, setFdpTitle] = useState(form?.fdp_title ?? "");
  const [btnName, setBtnName] = useState(form?.feedback_button_name ?? "Submit FDP Feedback");
  const [date, setDate] = useState(form?.feedback_date ?? "");
  const [enabled, setEnabled] = useState(form?.is_enabled ?? false);
  const [saving, setSaving] = useState(false);

  // Reset on open
  useState(() => {
    setFdpTitle(form?.fdp_title ?? "");
    setBtnName(form?.feedback_button_name ?? "Submit FDP Feedback");
    setDate(form?.feedback_date ?? "");
    setEnabled(form?.is_enabled ?? false);
  });

  async function save() {
    if (!fdpTitle.trim()) return toast.error("FDP Title is required");
    if (!btnName.trim()) return toast.error("Button name is required");
    setSaving(true);
    const payload = {
      fdp_title: fdpTitle.trim(),
      feedback_button_name: btnName.trim(),
      feedback_date: date || null,
      is_enabled: enabled,
    };
    const { error } = form
      ? await feedbackDb.from("feedback_forms").update(payload).eq("id", form.id)
      : await feedbackDb.from("feedback_forms").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form ? "Form updated" : "Form created");
    onSaved();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else {
          setFdpTitle(form?.fdp_title ?? "");
          setBtnName(form?.feedback_button_name ?? "Submit FDP Feedback");
          setDate(form?.feedback_date ?? "");
          setEnabled(form?.is_enabled ?? false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form ? "Edit Feedback Form" : "Create Feedback Form"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>FDP Title</Label>
            <Input
              value={fdpTitle}
              onChange={(e) => setFdpTitle(e.target.value)}
              placeholder="e.g. Smart Data Visualization using Power BI…"
            />
          </div>
          <div>
            <Label>Feedback Button Name</Label>
            <Input
              value={btnName}
              onChange={(e) => setBtnName(e.target.value)}
              placeholder="Submit FDP Feedback"
            />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date ?? ""} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Enable Feedback</Label>
              <p className="text-xs text-muted-foreground">
                If ON, the feedback button is shown on the user side.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
