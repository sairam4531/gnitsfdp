import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import mammoth from "mammoth";
import { Plus, Pencil, Trash2, FileUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  useQuizExams,
  useQuizQuestions,
  quizDb,
  type QuizExam,
  type QuizQuestion,
} from "@/lib/quiz";

export const Route = createFileRoute("/admin/quiz/questions")({
  component: QuizQuestionsPage,
});

function QuizQuestionsPage() {
  const { data: exams = [], isLoading } = useQuizExams();
  const qc = useQueryClient();
  const [filterDate, setFilterDate] = useState<string>("");
  const [creatingExam, setCreatingExam] = useState(false);
  const [editingExam, setEditingExam] = useState<QuizExam | null>(null);
  const [deletingExam, setDeletingExam] = useState<QuizExam | null>(null);

  const filteredExams = useMemo(
    () => (filterDate ? exams.filter((e) => e.exam_date === filterDate) : exams),
    [exams, filterDate],
  );

  async function toggleEnabled(exam: QuizExam, enabled: boolean) {
    const { error } = await quizDb
      .from("quiz_exams")
      .update({ is_enabled: enabled })
      .eq("id", exam.id);
    if (error) return toast.error(error.message);
    toast.success(enabled ? "Exam enabled" : "Exam disabled");
    qc.invalidateQueries({ queryKey: ["quiz_exams"] });
  }

  async function confirmDeleteExam() {
    if (!deletingExam) return;
    const { error } = await quizDb.from("quiz_exams").delete().eq("id", deletingExam.id);
    if (error) return toast.error(error.message);
    toast.success("Exam deleted");
    setDeletingExam(null);
    qc.invalidateQueries({ queryKey: ["quiz_exams"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quiz Questions</h1>
          <p className="text-sm text-muted-foreground">
            Create exams by date, manage questions and enable them for users.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Filter by Exam Date</Label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          {filterDate && (
            <Button variant="outline" onClick={() => setFilterDate("")}>
              Clear
            </Button>
          )}
          <Button onClick={() => setCreatingExam(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Exam
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filteredExams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {filterDate ? "No exam on this date." : 'No exams yet. Click "New Exam" to create one.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onToggle={(v) => toggleEnabled(exam, v)}
              onEdit={() => setEditingExam(exam)}
              onDelete={() => setDeletingExam(exam)}
            />
          ))}
        </div>
      )}

      <ExamDialog
        open={creatingExam || !!editingExam}
        exam={editingExam}
        onClose={() => {
          setCreatingExam(false);
          setEditingExam(null);
        }}
        onSaved={() => qc.invalidateQueries({ queryKey: ["quiz_exams"] })}
      />

      <AlertDialog open={!!deletingExam} onOpenChange={(o) => !o && setDeletingExam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the exam, all its questions, and all responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteExam}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExamCard({
  exam,
  onToggle,
  onEdit,
  onDelete,
}: {
  exam: QuizExam;
  onToggle: (v: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: questions = [] } = useQuizQuestions(exam.id);
  const [managingQuestions, setManagingQuestions] = useState(false);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{exam.title}</h3>
            {exam.is_enabled ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700">ON</Badge>
            ) : (
              <Badge variant="secondary">OFF</Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              Date: <strong>{exam.exam_date}</strong>
            </span>
            <span>
              Questions: <strong>{questions.length}</strong>
            </span>
            <span>
              Duration: <strong>{exam.duration_minutes} min</strong>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
            <Switch checked={exam.is_enabled} onCheckedChange={onToggle} />
            <span className="text-xs font-medium">{exam.is_enabled ? "ON" : "OFF"}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setManagingQuestions(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Questions
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={managingQuestions} onOpenChange={(o) => !o && setManagingQuestions(false)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Questions — {exam.title} ({exam.exam_date})
            </DialogTitle>
          </DialogHeader>
          <QuestionsManager examId={exam.id} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ExamDialog({
  open,
  exam,
  onClose,
  onSaved,
}: {
  open: boolean;
  exam: QuizExam | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(exam?.title ?? "Quiz Exam");
  const [date, setDate] = useState(exam?.exam_date ?? "");
  const [duration, setDuration] = useState<number>(exam?.duration_minutes ?? 30);
  const [enabled, setEnabled] = useState<boolean>(exam?.is_enabled ?? false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return toast.error("Title is required");
    if (!date) return toast.error("Exam date is required");
    if (!duration || duration < 1) return toast.error("Duration must be at least 1 minute");
    setSaving(true);
    const payload = {
      title: title.trim(),
      exam_date: date,
      duration_minutes: duration,
      is_enabled: enabled,
    };
    const { error } = exam
      ? await quizDb.from("quiz_exams").update(payload).eq("id", exam.id)
      : await quizDb.from("quiz_exams").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(exam ? "Exam updated" : "Exam created");
    onSaved();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else {
          setTitle(exam?.title ?? "Quiz Exam");
          setDate(exam?.exam_date ?? "");
          setDuration(exam?.duration_minutes ?? 30);
          setEnabled(exam?.is_enabled ?? false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{exam ? "Edit Exam" : "Create Exam"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Exam Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Enable Exam</Label>
              <p className="text-xs text-muted-foreground">
                Shows the "Quiz Exam" button on the user side.
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

type QForm = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
};

const emptyQ: QForm = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
};

function QuestionsManager({ examId }: { examId: string }) {
  const { data: questions = [], refetch } = useQuizQuestions(examId);
  const [form, setForm] = useState<QForm>(emptyQ);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<QuizQuestion | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setForm(emptyQ);
    setEditingId(null);
  }

  async function saveAndNext() {
    if (!form.question_text.trim()) return toast.error("Question text is required");
    if (
      !form.option_a.trim() ||
      !form.option_b.trim() ||
      !form.option_c.trim() ||
      !form.option_d.trim()
    )
      return toast.error("All 4 options are required");
    setSaving(true);
    if (editingId) {
      const { error } = await quizDb
        .from("quiz_questions")
        .update({
          question_text: form.question_text.trim(),
          option_a: form.option_a.trim(),
          option_b: form.option_b.trim(),
          option_c: form.option_c.trim(),
          option_d: form.option_d.trim(),
          correct_option: form.correct_option,
        })
        .eq("id", editingId);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Question updated");
    } else {
      const nextOrder =
        questions.length > 0 ? Math.max(...questions.map((q) => q.question_order)) + 1 : 1;
      const { error } = await quizDb.from("quiz_questions").insert({
        exam_id: examId,
        question_text: form.question_text.trim(),
        option_a: form.option_a.trim(),
        option_b: form.option_b.trim(),
        option_c: form.option_c.trim(),
        option_d: form.option_d.trim(),
        correct_option: form.correct_option,
        question_order: nextOrder,
      });
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Question saved. Add next question.");
    }
    reset();
    refetch();
  }

  async function removeQuestion() {
    if (!deleting) return;
    const { error } = await quizDb.from("quiz_questions").delete().eq("id", deleting.id);
    if (error) return toast.error(error.message);
    toast.success("Question deleted");
    setDeleting(null);
    refetch();
  }

  function startEdit(q: QuizQuestion) {
    setEditingId(q.id);
    setForm({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
    });
  }

  async function importFromWord(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: text } = await mammoth.extractRawText({ arrayBuffer });
      const parsed = parseWordQuestions(text);
      if (parsed.length === 0) {
        toast.error(
          "No questions detected. Format: 'Q. ...', 'A) ...', 'B) ...', 'C) ...', 'D) ...', 'Answer: A'",
        );
        return;
      }
      let baseOrder =
        questions.length > 0 ? Math.max(...questions.map((q) => q.question_order)) : 0;
      const rows = parsed.map((p) => ({
        exam_id: examId,
        question_text: p.question_text,
        option_a: p.option_a,
        option_b: p.option_b,
        option_c: p.option_c,
        option_d: p.option_d,
        correct_option: p.correct_option,
        question_order: ++baseOrder,
      }));
      const { error } = await quizDb.from("quiz_questions").insert(rows);
      if (error) return toast.error(error.message);
      toast.success(`Imported ${rows.length} question(s)`);
      refetch();
    } catch (e: any) {
      toast.error("Failed to parse Word file: " + e.message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editingId ? "Edit Question" : "Add Question"}</h3>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && importFromWord(e.target.files[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="mr-1 h-4 w-4" /> Import from Word
              </Button>
            </div>
          </div>
          <div>
            <Label>Question</Label>
            <Textarea
              rows={2}
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Option A</Label>
              <Input
                value={form.option_a}
                onChange={(e) => setForm({ ...form, option_a: e.target.value })}
              />
            </div>
            <div>
              <Label>Option B</Label>
              <Input
                value={form.option_b}
                onChange={(e) => setForm({ ...form, option_b: e.target.value })}
              />
            </div>
            <div>
              <Label>Option C</Label>
              <Input
                value={form.option_c}
                onChange={(e) => setForm({ ...form, option_c: e.target.value })}
              />
            </div>
            <div>
              <Label>Option D</Label>
              <Input
                value={form.option_d}
                onChange={(e) => setForm({ ...form, option_d: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[150px]">
              <Label>Correct Option</Label>
              <Select
                value={form.correct_option}
                onValueChange={(v) => setForm({ ...form, correct_option: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveAndNext} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving…" : editingId ? "Update Question" : "Save & Next Question"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset}>
                Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-2 font-semibold">Existing Questions ({questions.length})</h3>
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No questions yet.</p>
        ) : (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <Card key={q.id}>
                <CardContent className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-medium">
                      {i + 1}. {q.question_text}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span
                        className={q.correct_option === "A" ? "font-bold text-emerald-600" : ""}
                      >
                        A) {q.option_a}
                      </span>
                      <span
                        className={q.correct_option === "B" ? "font-bold text-emerald-600" : ""}
                      >
                        B) {q.option_b}
                      </span>
                      <span
                        className={q.correct_option === "C" ? "font-bold text-emerald-600" : ""}
                      >
                        C) {q.option_c}
                      </span>
                      <span
                        className={q.correct_option === "D" ? "font-bold text-emerald-600" : ""}
                      >
                        D) {q.option_d}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => startEdit(q)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleting(q)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeQuestion}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function parseWordQuestions(text: string): QForm[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: QForm[] = [];
  let cur: Partial<QForm> = {};
  const reQ = /^(?:Q[\d.)]*[.)\s]+|\d+[.)]\s+)(.+)$/i;
  const reOpt = /^([A-D])[).\s-]+(.+)$/i;
  const reAns = /^(?:Answer|Ans|Correct)\s*[:\-]\s*([A-D])/i;
  function flush() {
    if (
      cur.question_text &&
      cur.option_a &&
      cur.option_b &&
      cur.option_c &&
      cur.option_d &&
      cur.correct_option
    ) {
      out.push(cur as QForm);
    }
    cur = {};
  }
  for (const line of lines) {
    const mAns = line.match(reAns);
    if (mAns) {
      cur.correct_option = mAns[1].toUpperCase() as any;
      flush();
      continue;
    }
    const mOpt = line.match(reOpt);
    if (mOpt) {
      const key = `option_${mOpt[1].toLowerCase()}` as "option_a";
      (cur as any)[key] = mOpt[2].trim();
      continue;
    }
    const mQ = line.match(reQ);
    if (mQ) {
      if (cur.question_text) flush();
      cur.question_text = mQ[1].trim();
      continue;
    }
    // continuation
    if (cur.question_text && !cur.option_a) cur.question_text += " " + line;
  }
  flush();
  return out;
}
