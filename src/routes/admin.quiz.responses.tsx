import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuizExams, useQuizResponses, quizDb, type QuizResponse } from "@/lib/quiz";

export const Route = createFileRoute("/admin/quiz/responses")({
  component: QuizResponsesPage,
});

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function QuizResponsesPage() {
  const qc = useQueryClient();
  const { data: exams = [] } = useQuizExams();
  const [filterDate, setFilterDate] = useState<string>("");
  const examForDate = useMemo(() => exams.find((e) => e.exam_date === filterDate) ?? null, [exams, filterDate]);
  const { data: responses = [], isLoading } = useQuizResponses(examForDate?.id);
  const [deleting, setDeleting] = useState<QuizResponse | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await quizDb.from("quiz_responses").delete().eq("id", deleting.id);
    if (error) return toast.error(error.message);
    toast.success("Response deleted");
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ["quiz_responses", examForDate?.id] });
  }

  function exportXlsx() {
    if (responses.length === 0) return;
    const rows = responses.map((r, i) => ({
      "S.No": i + 1,
      "Faculty Name": r.faculty_name,
      "Faculty ID": r.faculty_id,
      "Department": r.department === "Others" ? r.custom_department ?? "Others" : r.department,
      "College Name": r.college_name === "Others" ? r.custom_college ?? "Others" : r.college_name,
      "Score": `${r.score}/${r.total_questions}`,
      "Time Taken": fmtDuration(r.time_taken_seconds),
      "Auto Submitted": r.auto_submitted ? "Yes" : "No",
      "Submitted At": new Date(r.submitted_at).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quiz Responses");
    XLSX.writeFile(wb, `quiz-responses-${examForDate?.exam_date ?? "all"}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quiz Responses</h1>
          <p className="text-sm text-muted-foreground">Filter responses by exam date.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <Label className="text-xs">Exam Date</Label>
            <Select value={filterDate || "__none"} onValueChange={(v) => setFilterDate(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select an exam date" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Select date —</SelectItem>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.exam_date}>{e.exam_date} — {e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={exportXlsx} disabled={responses.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      {!examForDate ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Select an exam date to view responses.</CardContent></Card>
      ) : isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : responses.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No responses yet for this exam.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2">S.No</th>
                  <th className="px-3 py-2">Faculty Name</th>
                  <th className="px-3 py-2">Faculty ID</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">College Name</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Time Taken</th>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r, i) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{r.faculty_name}</td>
                    <td className="px-3 py-2">{r.faculty_id}</td>
                    <td className="px-3 py-2">{r.department === "Others" ? r.custom_department ?? "Others" : r.department}</td>
                    <td className="px-3 py-2">{r.college_name === "Others" ? r.custom_college ?? "Others" : r.college_name}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary">{r.score}/{r.total_questions}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {fmtDuration(r.time_taken_seconds)}
                      {r.auto_submitted && <Badge variant="destructive" className="ml-2 text-[10px]">Auto</Badge>}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="destructive" size="sm" onClick={() => setDeleting(r)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this response?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
