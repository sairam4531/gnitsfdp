import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/register/success")({
  validateSearch: z.object({ id: z.string().optional() }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-2xl px-4 py-20">
        <Card className="border-secondary/40 shadow-elegant">
          <CardContent className="p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-3xl font-bold">Successfully registered for FDP!</h1>
            <p className="mt-2 text-muted-foreground">Thank you. Your registration has been received and successfully approved.</p>
            <Button asChild className="mt-8"><Link to="/">Back to home</Link></Button>
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
