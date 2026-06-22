import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Eye, Trash2, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFeedbackForms, useFeedbackResponses, feedbackDb } from "@/lib/feedback";

export const Route = createFileRoute("/admin/feedback/responses")({
  component: ResponsesPage,
});

function ResponsesPage() {
  const { data: responses = [], isLoading } = useFeedbackResponses();
  const { data: forms = [] } = useFeedbackForms();
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [formId, setFormId] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return responses.filter((r) => {
      if (formId !== "all" && r.feedback_form_id !== formId) return false;
      if (date) {
        const d = new Date(r.submitted_at).toISOString().slice(0, 10);
        if (d !== date) return false;
      }
      return true;
    });
  }, [responses, formId, date]);

  const uniqueQuestions = useMemo(() => {
    const qTexts = new Set<string>();
    filtered.forEach((r) => {
      (r.answers_json ?? []).forEach((a) => {
        if (a.question_text) {
          qTexts.add(a.question_text);
        }
      });
    });
    return Array.from(qTexts);
  }, [filtered]);

  async function confirmDelete() {
    if (!deletingId) return;
    const { error } = await feedbackDb.from("feedback_responses").delete().eq("id", deletingId);
    if (error) return toast.error(error.message);
    toast.success("Response deleted");
    setDeletingId(null);
    qc.invalidateQueries({ queryKey: ["feedback_responses"] });
  }

  function exportExcel() {
    const rows = filtered.map((r, i) => {
      const rowData: any = {
        "S.No": i + 1,
        Name: r.participant_name,
        "Employee ID": r.employee_id ?? "",
        Department: r.department ?? "",
        "Institute Name": r.institution_name ?? "",
      };

      const answersMap = new Map(
        (r.answers_json ?? []).map((a) => [a.question_text, a.answer])
      );

      uniqueQuestions.forEach((q, idx) => {
        rowData[`${idx + 1}. ${q}`] = answersMap.get(q) || "";
      });

      rowData["Submitted"] = new Date(r.submitted_at).toLocaleString();
      return rowData;
    });

    if (rows.length === 0) return toast.error("No responses to export");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Feedback Responses");
    XLSX.writeFile(wb, `feedback-responses-${Date.now()}.xlsx`);
  }

  function exportSingle(id: string) {
    const r = responses.find((x) => x.id === id);
    if (!r) return;
    const rowData: any = {
      Name: r.participant_name,
      "Employee ID": r.employee_id ?? "",
      Department: r.department ?? "",
      "Institute Name": r.institution_name ?? "",
    };

    (r.answers_json ?? []).forEach((a, idx) => {
      rowData[`${idx + 1}. ${a.question_text}`] = a.answer;
    });

    rowData["Submitted"] = new Date(r.submitted_at).toLocaleString();

    const ws = XLSX.utils.json_to_sheet([rowData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Feedback");
    XLSX.writeFile(wb, `feedback-${r.participant_email}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Feedback Responses</h1>
          <p className="text-sm text-muted-foreground">Filter, view, and export feedback responses.</p>
        </div>
        <Button onClick={exportExcel}><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div>
            <Label className="flex items-center gap-1"><Filter className="h-3 w-3" /> Select Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>FDP / Feedback Form</Label>
            <Select value={formId} onValueChange={setFormId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.fdp_title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={() => { setDate(""); setFormId("all"); }}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">S.No</TableHead>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Employee ID</TableHead>
                <TableHead className="whitespace-nowrap">Department</TableHead>
                <TableHead className="whitespace-nowrap">Institute Name</TableHead>
                {uniqueQuestions.map((q, idx) => (
                  <TableHead key={idx} className="min-w-[150px] max-w-[300px] truncate" title={q}>
                    {idx + 1}. {q}
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap">Submitted</TableHead>
                <TableHead className="whitespace-nowrap text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7 + uniqueQuestions.length} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7 + uniqueQuestions.length} className="py-8 text-center text-muted-foreground">
                    No responses found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, i) => {
                  const answersMap = new Map(
                    (r.answers_json ?? []).map((a) => [a.question_text, a.answer])
                  );
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{r.participant_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.employee_id || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.department || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.institution_name || "—"}</TableCell>
                      {uniqueQuestions.map((q, idx) => (
                        <TableCell key={idx} className="max-w-[300px] truncate" title={answersMap.get(q) || "—"}>
                          {answersMap.get(q) || "—"}
                        </TableCell>
                      ))}
                      <TableCell className="whitespace-nowrap">{new Date(r.submitted_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/admin/feedback/view/$formId" params={{ formId: r.feedback_form_id }}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => exportSingle(r.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeletingId(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete response?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
