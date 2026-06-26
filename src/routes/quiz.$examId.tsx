import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuizQuestions, quizDb, type QuizExam, type QuizQuestion } from "@/lib/quiz";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/quiz/$examId")({
  component: QuizPage,
});

const DEPARTMENTS = ["CSE", "CSE(AI&ML)", "H&M", "CSE(Data Science)", "ECE", "IT", "EEE", "Others"];
const COLLEGES = ["GNITS", "Others"];

type Stage = "register" | "exam" | "done";

function QuizPage() {
  const { examId } = Route.useParams();
  const navigate = useNavigate();
  const { data: exam } = useQuery({
    queryKey: ["quiz_exam", examId],
    queryFn: async () => {
      const { data, error } = await quizDb.from("quiz_exams").select("*").eq("id", examId).maybeSingle();
      if (error) throw error;
      return data as QuizExam | null;
    },
  });
  const { data: questions = [] } = useQuizQuestions(examId);

  const [stage, setStage] = useState<Stage>("register");
  const [facultyName, setFacultyName] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [department, setDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [college, setCollege] = useState("");
  const [customCollege, setCustomCollege] = useState("");

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [startedAt, setStartedAt] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; time: number } | null>(null);

  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [showWarningScreen, setShowWarningScreen] = useState(false);
  const [checkingId, setCheckingId] = useState(false);

  const submittedRef = useRef(false);
  const stageRef = useRef<Stage>("register");
  const violationsRef = useRef(0);
  const showWarningScreenRef = useRef(false);

  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { violationsRef.current = fullscreenViolations; }, [fullscreenViolations]);
  useEffect(() => { showWarningScreenRef.current = showWarningScreen; }, [showWarningScreen]);

  // Timer
  useEffect(() => {
    if (stage !== "exam") return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          autoSubmit("Time up");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Anti-tab-switch
  useEffect(() => {
    if (stage !== "exam") return;
    function onVis() {
      if (document.hidden && stageRef.current === "exam" && !showWarningScreenRef.current) {
        autoSubmit("Tab switched");
      }
    }
    function onBlur() {
      // window blur (alt-tab)
      if (stageRef.current === "exam" && !showWarningScreenRef.current) {
        autoSubmit("Window left focus");
      }
    }
    function onFsChange() {
      if (!document.fullscreenElement && stageRef.current === "exam") {
        const nextViolations = violationsRef.current + 1;
        setFullscreenViolations(nextViolations);
        if (nextViolations >= 2) {
          autoSubmit("Exited fullscreen second time");
        } else {
          setShowWarningScreen(true);
        }
      }
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Disable copy-paste & text selection during exam
  useEffect(() => {
    if (stage !== "exam") return;
    function preventDefault(e: Event) {
      e.preventDefault();
      toast.error("Copying, pasting, and right-clicking are disabled during the exam.");
    }
    document.addEventListener("copy", preventDefault);
    document.addEventListener("paste", preventDefault);
    document.addEventListener("cut", preventDefault);
    document.addEventListener("contextmenu", preventDefault);
    return () => {
      document.removeEventListener("copy", preventDefault);
      document.removeEventListener("paste", preventDefault);
      document.removeEventListener("cut", preventDefault);
      document.removeEventListener("contextmenu", preventDefault);
    };
  }, [stage]);

  async function resumeFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      setShowWarningScreen(false);
    } catch {
      toast.error("Please enable fullscreen to continue the exam");
    }
  }

  function validateRegister() {
    if (!facultyName.trim()) return "Faculty Name is required";
    if (!facultyId.trim()) return "Faculty ID is required";
    if (!department) return "Department is required";
    if (department === "Others" && !customDepartment.trim()) return "Enter your department";
    if (!college) return "College Name is required";
    if (college === "Others" && !customCollege.trim()) return "Enter your college";
    return null;
  }

  async function startExam() {
    const err = validateRegister();
    if (err) return toast.error(err);
    if (!exam) return toast.error("Exam not loaded");
    if (!exam.is_enabled) return toast.error("This exam is not enabled");
    if (questions.length === 0) return toast.error("No questions available");

    setCheckingId(true);
    try {
      const { data: isDuplicate, error: checkError } = await quizDb
        .rpc("check_duplicate_quiz_response", {
          _exam_id: examId,
          _faculty_id: facultyId.trim(),
        });

      if (checkError) {
        console.error("Error checking duplicate response:", checkError);
        toast.error("Unable to verify exam eligibility. Please try again.");
        setCheckingId(false);
        return;
      }

      if (isDuplicate) {
        toast.error("You have already submitted this exam. Multiple attempts are not allowed.");
        setCheckingId(false);
        return;
      }
    } catch (e) {
      console.error(e);
      toast.error("Error checking registration status.");
      setCheckingId(false);
      return;
    }
    setCheckingId(false);

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      toast.warning("Could not enter fullscreen — please enable fullscreen permission");
    }
    setStartedAt(Date.now());
    setRemaining(exam.duration_minutes * 60);
    setCurrentIdx(0);
    setAnswers({});
    setFullscreenViolations(0);
    setShowWarningScreen(false);
    submittedRef.current = false;
    setStage("exam");
  }

  function selectAnswer(qid: string, opt: "A" | "B" | "C" | "D") {
    setAnswers((a) => ({ ...a, [qid]: opt }));
  }

  function next() {
    if (currentIdx < questions.length - 1) setCurrentIdx((i) => i + 1);
  }

  async function submit(auto: boolean, reason?: string) {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const total = questions.length;
    let score = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correct_option) score++;
    }
    const timeTaken = Math.floor((Date.now() - startedAt) / 1000);

    const payload = {
      exam_id: examId,
      faculty_name: facultyName.trim(),
      faculty_id: facultyId.trim(),
      department,
      custom_department: department === "Others" ? customDepartment.trim() : null,
      college_name: college,
      custom_college: college === "Others" ? customCollege.trim() : null,
      score,
      total_questions: total,
      time_taken_seconds: timeTaken,
      answers_json: answers,
      auto_submitted: auto,
    };

    const { error } = await quizDb.from("quiz_responses").insert(payload);
    if (error) {
      submittedRef.current = false;
      toast.error(error.message);
      return;
    }
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }
    setShowWarningScreen(false);
    setResult({ score, total, time: timeTaken });
    setStage("done");
    if (auto) toast.warning(`Exam auto-submitted: ${reason ?? ""}`);
    else toast.success("Exam submitted");
  }

  function autoSubmit(reason: string) {
    if (stageRef.current !== "exam") return;
    submit(true, reason);
  }

  if (!exam) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (stage === "done" && result) {
    const dept = department === "Others" ? customDepartment : department;
    const coll = college === "Others" ? customCollege : college;
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" /> Exam Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-6 text-center text-primary-foreground">
              <div className="text-sm opacity-80">Your Score</div>
              <div className="mt-1 text-5xl font-black">{result.score} / {result.total}</div>
              <div className="mt-2 text-xs opacity-80">Time taken: {Math.floor(result.time / 60)}m {result.time % 60}s</div>
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <strong>{facultyName}</strong></div>
              <div><span className="text-muted-foreground">Faculty ID:</span> <strong>{facultyId}</strong></div>
              <div><span className="text-muted-foreground">Department:</span> <strong>{dept}</strong></div>
              <div><span className="text-muted-foreground">College:</span> <strong>{coll}</strong></div>
            </div>
            <Button className="w-full" onClick={() => navigate({ to: "/" })}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "exam") {
    const q = questions[currentIdx];
    const isLast = currentIdx === questions.length - 1;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return (
      <div className="min-h-screen bg-slate-50 p-4 select-none">
        {showWarningScreen && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-600 text-white p-6 text-center select-none animate-fade-in">
            <div className="max-w-md space-y-6">
              <AlertTriangle className="mx-auto h-20 w-20 text-white animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tight">Warning: Fullscreen Exited!</h1>
              <p className="text-lg opacity-90">
                Exiting fullscreen is a violation of the exam rules. This is your **first and ONLY warning**.
              </p>
              <p className="text-sm bg-red-700/50 p-3 rounded-md border border-red-500">
                If you exit fullscreen again, your exam will be <strong>automatically submitted immediately</strong>.
              </p>
              <Button 
                onClick={resumeFullscreen} 
                className="w-full bg-white text-red-600 hover:bg-white/90 font-bold text-base py-6 shadow-lg transition-transform active:scale-95"
              >
                Resume Exam (Enter Fullscreen)
              </Button>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="text-sm font-medium">Question {currentIdx + 1} of {questions.length}</div>
            <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 font-mono text-sm font-bold text-primary">
              <Clock className="h-4 w-4" /> {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
          </div>

          <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Do not switch tabs, open new windows, or exit fullscreen. Your exam will be auto-submitted. (1 Warning allowed for fullscreen exit)
          </div>

          {q && <QuestionCard q={q} selected={answers[q.id]} onSelect={(o) => selectAnswer(q.id, o)} index={currentIdx + 1} />}

          <div className="mt-4 flex justify-between">
            <div className="text-xs text-muted-foreground self-center">
              Answered: {Object.keys(answers).length} / {questions.length}
            </div>
            {isLast ? (
              <Button onClick={() => setConfirmSubmit(true)} className="bg-gradient-gold text-gold-foreground font-bold">
                Submit Exam
              </Button>
            ) : (
              <Button onClick={next}>Next Question</Button>
            )}
          </div>
        </div>

        <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Exam?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Do you want to submit the exam? You have answered {Object.keys(answers).length} out of {questions.length} questions.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmSubmit(false)}>Cancel</Button>
              <Button onClick={() => { setConfirmSubmit(false); submit(false); }}>Yes, Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // register stage
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{exam.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {exam.exam_date} · Duration: {exam.duration_minutes} minutes · {questions.length} questions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Faculty Name</Label>
            <Input value={facultyName} onChange={(e) => setFacultyName(e.target.value)} />
          </div>
          <div>
            <Label>Faculty ID</Label>
            <Input value={facultyId} onChange={(e) => setFacultyId(e.target.value)} />
          </div>
          <div>
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {department === "Others" && (
              <Input className="mt-2" placeholder="Enter Department" value={customDepartment} onChange={(e) => setCustomDepartment(e.target.value)} />
            )}
          </div>
          <div>
            <Label>College Name</Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
              <SelectContent>
                {COLLEGES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {college === "Others" && (
              <Input className="mt-2" placeholder="Enter College Name" value={customCollege} onChange={(e) => setCustomCollege(e.target.value)} />
            )}
          </div>
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <strong>Important:</strong> The exam runs in fullscreen. Switching tabs, opening new windows, or exiting fullscreen will auto-submit your exam.
          </div>
          <Button 
            className="w-full bg-gradient-gold text-gold-foreground font-bold disabled:opacity-70 disabled:cursor-not-allowed" 
            onClick={startExam}
            disabled={checkingId}
          >
            {checkingId ? "Verifying eligibility..." : "Start Exam"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionCard({
  q, selected, onSelect, index,
}: {
  q: QuizQuestion;
  selected: "A" | "B" | "C" | "D" | undefined;
  onSelect: (o: "A" | "B" | "C" | "D") => void;
  index: number;
}) {
  const options: Array<{ k: "A" | "B" | "C" | "D"; v: string }> = [
    { k: "A", v: q.option_a }, { k: "B", v: q.option_b },
    { k: "C", v: q.option_c }, { k: "D", v: q.option_d },
  ];
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-base font-semibold">{index}. {q.question_text}</h3>
        <div className="grid gap-2">
          {options.map((o) => (
            <button
              key={o.k}
              onClick={() => onSelect(o.k)}
              className={`flex items-start gap-3 rounded-md border p-3 text-left text-sm transition hover:border-primary/60 ${
                selected === o.k ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                selected === o.k ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}>{o.k}</span>
              <span>{o.v}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
