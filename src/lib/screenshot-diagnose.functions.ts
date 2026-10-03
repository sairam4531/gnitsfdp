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

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");

    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const text = [
      data.pageUrl ? `Page URL: ${data.pageUrl}` : "",
      data.note ? `Admin note: ${data.note}` : "",
      "Diagnose this mobile screenshot.",
    ]
      .filter(Boolean)
      .join("\n");

    let failure: string | null = null;
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: SYSTEM,
      maxRetries: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
      onError: ({ error }) => {
        const e = error as { statusCode?: number; message?: string };
        if (e?.statusCode === 402) failure = "AI credits are used up. Please add credits in workspace billing.";
        else if (e?.statusCode === 429) failure = "Too many requests. Please wait a minute and try again.";
        else if (e?.statusCode === 403) failure = e.message || "AI access was denied.";
        else failure = e?.message || "AI analysis failed.";
        console.error("diagnoseScreenshot error", error);
      },
    });

    let out = "";
    try {
      out = await result.text;
    } catch {
      /* handled via onError */
    }
    if (failure) return { ok: false as const, error: failure };
    if (!out.trim()) return { ok: false as const, error: "The AI returned no analysis. Try another screenshot." };
    return { ok: true as const, analysis: out };
  });
