import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useWorkshops, useRegistrations } from "@/lib/queries";

export const Route = createFileRoute("/register/success")({
  validateSearch: z.object({
    id: z.string().optional(),
    workshop: z.string().optional(),
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id, workshop } = Route.useSearch();
  const { data: workshops = [] } = useWorkshops();
  const { data: registrations = [] } = useRegistrations();

  const reg = id ? registrations.find((r) => r.registration_id === id || r.id === id) : null;

  // Resolve target workshop slug: explicit param -> registration record -> ID prefix -> default web-development
  let targetSlug = workshop || reg?.workshop_slug || "";
  if (!targetSlug && id) {
    const upperId = id.toUpperCase();
    if (upperId.includes("WEBD")) targetSlug = "web-development";
    else if (upperId.includes("AIHU")) targetSlug = "ai-humanoid-robot";
    else if (upperId.includes("AGEN")) targetSlug = "agentic-ai-cloud";
  }
  if (!targetSlug) {
    targetSlug = "web-development";
  }

  const ws = workshops.find((w) => w.slug.toLowerCase() === targetSlug.toLowerCase());

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader department={ws?.department} />
      <div className="container mx-auto max-w-2xl px-4 py-20 flex-1 flex items-center justify-center">
        <Card className="border-secondary/40 shadow-elegant w-full">
          <CardContent className="p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-3xl font-bold">Successfully registered for the Workshop!</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you. Your registration has been received successfully.
            </p>
            <Button asChild className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8">
              <Link to={`/${targetSlug}` as any}>Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <SiteFooter department={ws?.department} workshopSlug={targetSlug} />
    </div>
  );
}
