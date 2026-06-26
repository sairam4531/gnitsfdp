import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFeedbackForm, useFeedbackQuestions, useFeedbackResponses } from "@/lib/feedback";

export const Route = createFileRoute("/admin/feedback/view/$formId")({
  component: ViewFeedbackPage,
});

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#6366f1",
];

function ViewFeedbackPage() {
  const { formId } = Route.useParams();
  const { data: form } = useFeedbackForm(formId);
  const { data: questions = [] } = useFeedbackQuestions(formId);
  const { data: allResponses = [] } = useFeedbackResponses();

  const responses = useMemo(
    () => allResponses.filter((r) => r.feedback_form_id === formId),
    [allResponses, formId],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/feedback/responses">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">{form?.fdp_title ?? "Feedback"}</h1>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              Button: <strong>{form?.feedback_button_name}</strong>
            </span>
            {form?.feedback_date && <span>Date: {form.feedback_date}</span>}
            <span>
              Total Responses: <strong>{responses.length}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {questions.map((q, qi) => {
          if (q.question_type === "multiple_choice") {
            const counts = (q.options_json ?? []).map((opt) => ({
              name: opt,
              value: responses.reduce(
                (acc, r) =>
                  acc +
                  ((r.answers_json ?? []).some((a) => a.question_id === q.id && a.answer === opt)
                    ? 1
                    : 0),
                0,
              ),
            }));
            return (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Q{qi + 1}. {q.question_text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-3">
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Option</TableHead>
                          <TableHead className="text-right">Responses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {counts.map((c) => (
                          <TableRow key={c.name}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell className="text-right font-mono">{c.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={counts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={counts} dataKey="value" nameKey="name" outerRadius={80} label>
                          {counts.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          }
          // Short answer
          return <ShortAnswerCard key={q.id} qi={qi} q={q} responses={responses} />;
        })}
      </div>
    </div>
  );
}

function ShortAnswerCard({ qi, q, responses }: any) {
  const [search, setSearch] = useState("");
  const answers = responses
    .map((r: any) => {
      const a = (r.answers_json ?? []).find((x: any) => x.question_id === q.id);
      return a ? { name: r.participant_name, email: r.participant_email, answer: a.answer } : null;
    })
    .filter(Boolean)
    .filter(
      (a: any) =>
        !search ||
        a.answer.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Q{qi + 1}. {q.question_text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search answers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              <TableHead>Answer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {answers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No answers.
                </TableCell>
              </TableRow>
            ) : (
              answers.map((a: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>
                    {a.name}
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </TableCell>
                  <TableCell className="whitespace-pre-wrap">{a.answer}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
