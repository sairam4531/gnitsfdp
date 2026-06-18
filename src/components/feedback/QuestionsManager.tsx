import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFeedbackQuestions, feedbackDb, type FeedbackQuestion } from "@/lib/feedback";

export function QuestionsManager({ formId }: { formId: string }) {
  const { data: questions = [], isLoading } = useFeedbackQuestions(formId);
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["feedback_questions", formId] });
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    const { error } = await feedbackDb.from("feedback_questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Question deleted");
    invalidate();
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                {editingId === q.id ? (
                  <QuestionEditor
                    formId={formId}
                    initial={q}
                    onDone={() => {
                      setEditingId(null);
                      invalidate();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                        <Badge variant="outline">
                          {q.question_type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}
                        </Badge>
                      </div>
                      <p className="mt-2 font-medium">{q.question_text}</p>
                      {q.question_type === "multiple_choice" && (
                        <ul className="mt-2 list-disc pl-6 text-sm text-muted-foreground">
                          {(q.options_json ?? []).map((opt, j) => (
                            <li key={j}>{opt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(q.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {adding ? (
        <Card>
          <CardContent className="p-4">
            <QuestionEditor
              formId={formId}
              nextOrder={questions.length}
              onDone={() => {
                setAdding(false);
                invalidate();
              }}
              onCancel={() => setAdding(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setAdding(true)} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add Question
        </Button>
      )}
    </div>
  );
}

function QuestionEditor({
  formId,
  initial,
  nextOrder,
  onDone,
  onCancel,
}: {
  formId: string;
  initial?: FeedbackQuestion;
  nextOrder?: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial?.question_text ?? "");
  const [type, setType] = useState<"multiple_choice" | "short_answer">(initial?.question_type ?? "multiple_choice");
  const [options, setOptions] = useState<string[]>(
    initial?.options_json && initial.options_json.length > 0 ? initial.options_json : ["", ""]
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!text.trim()) return toast.error("Question text is required");
    let opts: string[] = [];
    if (type === "multiple_choice") {
      opts = options.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) return toast.error("Add at least 2 options");
    }
    setSaving(true);
    const payload = {
      feedback_form_id: formId,
      question_text: text.trim(),
      question_type: type,
      options_json: opts,
      question_order: initial?.question_order ?? nextOrder ?? 0,
    };
    const { error } = initial
      ? await feedbackDb.from("feedback_questions").update(payload).eq("id", initial.id)
      : await feedbackDb.from("feedback_questions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Question saved");
    onDone();
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Question Text</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
      </div>
      <div>
        <Label>Question Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
            <SelectItem value="short_answer">Short Answer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {type === "multiple_choice" && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                  disabled={options.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])}>
              <Plus className="mr-1 h-4 w-4" /> Add Option
            </Button>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}><X className="mr-1 h-4 w-4" /> Cancel</Button>
        <Button onClick={save} disabled={saving}><Save className="mr-1 h-4 w-4" /> Save</Button>
      </div>
    </div>
  );
}
