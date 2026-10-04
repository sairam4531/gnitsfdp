import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  imageDataUrl: z
    .string()
    .max(12_000_000)
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/),
  note: z.string().max(1000).optional(),
  pageUrl: z.string().max(500).optional(),
});

const SYSTEM = `You are a web QA expert diagnosing a mobile screenshot of a website (built with React, deployed to Vercel and a Lovable preview).
Identify likely problems in these categories:
1. Stale / cached version (old UI, missing new buttons/features, old service worker, wrong deployment URL, Vercel not redeployed).
2. Display / layout issues (overflow, clipped text, overlapping elements, unreadable contrast, broken responsive layout, hidden nav on mobile).
3. Errors shown on screen (toasts, error messages, blank screens, failed logins) and their likely cause.
Respond in Markdown with sections: "## What I see", "## Likely issues" (bulleted, each with a confidence: High/Medium/Low), "## Recommended fixes" (numbered, concrete steps for a non-technical admin first, then developer notes). Be concise.`;

export const diagnoseScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Admin access required.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const text = [
      data.pageUrl ? `Page URL: ${data.pageUrl}` : "",
      data.note ? `Admin note: ${data.note}` : "",
      "Diagnose this mobile screenshot.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text },
                {
                  type: "image_url",
                  image_url: { url: data.imageDataUrl },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 402) return { ok: false as const, error: "AI credits are used up. Please add credits in workspace billing." };
        if (response.status === 429) return { ok: false as const, error: "Too many requests. Please wait a minute and try again." };
        return { ok: false as const, error: `AI service error (${response.status})` };
      }

      const resJson = (await response.json()) as any;
      const out = resJson.choices?.[0]?.message?.content || "";
      if (!out.trim()) return { ok: false as const, error: "The AI returned no analysis. Try another screenshot." };
      return { ok: true as const, analysis: out };
    } catch (err: any) {
      return { ok: false as const, error: err?.message || "AI analysis failed." };
    }
  });
