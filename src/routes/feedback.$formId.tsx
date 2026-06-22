import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  useFeedbackForm, useFeedbackQuestions, useEnabledFeedbackForms, feedbackDb,
} from "@/lib/feedback";

export const Route = createFileRoute("/feedback/$formId")({
  component: FeedbackFormPage,
  head: () => ({ meta: [{ title: "Submit Feedback — GNITS FDP" }] }),
});

function FeedbackFormPage() {
  const { formId } = Route.useParams();
  const { data: form, isLoading: loadingForm } = useFeedbackForm(formId);
  const { data: questions = [], isLoading: loadingQ } = useFeedbackQuestions(formId);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [deptSelect, setDeptSelect] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [instSelect, setInstSelect] = useState("");
  const [customInst, setCustomInst] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  if (loadingForm || loadingQ) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!form || !form.is_enabled) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold">Feedback not available</h1>
              <p className="mt-2 text-muted-foreground">This feedback form is not currently open.</p>
              <Button asChild className="mt-4"><Link to="/">Back to Home</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
              <h1 className="mt-4 text-3xl font-bold">Thank You</h1>
              <p className="mt-2 text-muted-foreground">Your feedback has been submitted successfully.</p>
              <Button asChild className="mt-6"><Link to="/">Back to Home</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold">Already Submitted</h1>
              <p className="mt-2 text-muted-foreground">You have already submitted feedback for this FDP.</p>
              <Button asChild className="mt-6"><Link to="/">Back to Home</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  async function submit() {
    if (!name.trim()) return toast.error("Name is required");
    if (!employeeId.trim()) return toast.error("Employee ID is required");
    if (!deptSelect) return toast.error("Department is required");
    if (deptSelect === "Others" && !customDept.trim()) return toast.error("Please enter your department name");
    if (!instSelect) return toast.error("Institution Name is required");
    if (instSelect === "Others" && !customInst.trim()) return toast.error("Please enter your institution name");

    for (const q of questions) {
      if (!answers[q.id] || !answers[q.id].trim()) {
        return toast.error(`Please answer: ${q.question_text}`);
      }
    }

    const payload = {
      feedback_form_id: formId,
      participant_name: name.trim(),
      participant_email: `${employeeId.trim().toLowerCase()}@feedback.temp`,
      employee_id: employeeId.trim(),
      department: deptSelect === "Others" ? customDept.trim() : deptSelect,
      institution_name: instSelect === "Others" ? customInst.trim() : instSelect,
      answers_json: questions.map((q) => ({
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        answer: answers[q.id],
      })),
    };

    setSubmitting(true);
    const { error } = await feedbackDb.from("feedback_responses").insert(payload);
    setSubmitting(false);

    if (error) {
      if (error.code === "23505" || /duplicate/i.test(error.message)) {
        setAlreadySubmitted(true);
        return;
      }
      return toast.error(error.message);
    }
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader className="border-b">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{form.fdp_title}</CardTitle>
              <p className="text-sm font-medium text-secondary">{form.feedback_button_name}</p>
              {form.feedback_date && (
                <p className="text-xs text-muted-foreground">Feedback Date: {form.feedback_date}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <Label>Employee ID *</Label>
                <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
              </div>
              <div>
                <Label>Department *</Label>
                <Select value={deptSelect} onValueChange={setDeptSelect}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {["CSE", "CSE (AI & ML)", "CSE (Data Science)", "IT", "ECE", "EEE", "Others"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {deptSelect === "Others" && (
                <div>
                  <Label>Department Name *</Label>
                  <Input value={customDept} onChange={(e) => setCustomDept(e.target.value)} placeholder="Enter department name" required />
                </div>
              )}
              <div>
                <Label>Institute / Organization *</Label>
                <Select value={instSelect} onValueChange={setInstSelect}>
                  <SelectTrigger><SelectValue placeholder="Select institute" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G. Narayanamma Institute of Technology and Science">
                      G. Narayanamma Institute of Technology and Science
                    </SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {instSelect === "Others" && (
                <div className="md:col-span-2">
                  <Label>Institute Name *</Label>
                  <Input value={customInst} onChange={(e) => setCustomInst(e.target.value)} placeholder="Enter institute name" required />
                </div>
              )}
            </div>

            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-base">
                    {i + 1}. {q.question_text}
                  </Label>
                  {q.question_type === "multiple_choice" ? (
                    <RadioGroup
                      value={answers[q.id] ?? ""}
                      onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                    >
                      {(q.options_json ?? []).map((opt) => (
                        <div key={opt} className="flex items-center gap-2">
                          <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                          <Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Textarea
                      rows={3}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-feedback text-white font-bold shadow-glow hover:opacity-90 border-0" size="lg">
              {submitting ? "Submitting…" : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
