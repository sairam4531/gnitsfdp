import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Smartphone, Upload } from "lucide-react";
import { toast } from "sonner";
import { diagnoseScreenshot } from "@/lib/screenshot-diagnose.functions";

export const Route = createFileRoute("/admin/diagnose")({
  head: () => ({
    meta: [
      { title: "Screenshot Diagnosis — GNITS Workshop Admin" },
      { name: "description", content: "AI-powered diagnosis of mobile display and outdated-version issues." },
      { property: "og:title", content: "Screenshot Diagnosis — GNITS Workshop Admin" },
      { property: "og:description", content: "AI-powered diagnosis of mobile display and outdated-version issues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiagnosePage,
});

function renderMarkdown(md: string) {
  return md.split("\n").map((line, i) => {
    const t = line.trim();
    if (t.startsWith("## ")) return <h3 key={i} className="mt-5 text-base font-bold text-foreground">{t.slice(3)}</h3>;
    if (t.startsWith("# ")) return <h2 key={i} className="mt-5 text-lg font-bold">{t.slice(2)}</h2>;
    if (/^[-*] /.test(t)) return <li key={i} className="ml-5 list-disc">{t.slice(2).replace(/\*\*/g, "")}</li>;
    if (/^\d+\. /.test(t)) return <li key={i} className="ml-5 list-decimal">{t.replace(/^\d+\. /, "").replace(/\*\*/g, "")}</li>;
    if (!t) return <div key={i} className="h-2" />;
    return <p key={i}>{t.replace(/\*\*/g, "")}</p>;
  });
}

function DiagnosePage() {
  const run = useServerFn(diagnoseScreenshot);
  const [image, setImage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  function onFile(f?: File) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return toast.error("Upload a PNG, JPG or WEBP image.");
    if (f.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB.");
    const r = new FileReader();
    r.onload = () => setImage(r.result as string);
    r.readAsDataURL(f);
    setAnalysis("");
  }

  async function analyze() {
    if (!image) return;
    setLoading(true);
    setAnalysis("");
    try {
      const res = await run({ data: { imageDataUrl: image, note: note || undefined, pageUrl: pageUrl || undefined } });
      if (res.ok) setAnalysis(res.analysis);
      else toast.error(res.error);
    } catch (e: any) {
      toast.error(e?.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Smartphone className="h-6 w-6" /> Screenshot Diagnosis</h1>
        <p className="text-sm text-muted-foreground">Upload a phone screenshot. AI will spot display problems or signs of an outdated version and suggest fixes.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription>PNG, JPG or WEBP, up to 8 MB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground hover:border-primary">
              <Upload className="h-6 w-6" />
              {image ? "Change screenshot" : "Choose screenshot"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {image && <img src={image} alt="Uploaded screenshot" className="mx-auto max-h-96 rounded-md border" />}
            <div className="space-y-1.5">
              <Label>Page link (optional)</Label>
              <Input value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="https://gnitsworkshop.vercel.app/..." />
            </div>
            <div className="space-y-1.5">
              <Label>What's wrong? (optional)</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Changes show on laptop but not on phone" />
            </div>
            <Button className="w-full" disabled={!image || loading} onClick={analyze}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</> : "Analyze Screenshot"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Diagnosis</CardTitle></CardHeader>
          <CardContent className="text-sm leading-relaxed">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> This can take up to a minute…</div>
            ) : analysis ? (
              <div>{renderMarkdown(analysis)}</div>
            ) : (
              <p className="text-muted-foreground">Results will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
