import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Brain,
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  LineChart,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
  Workflow,
  Database,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useWebsiteSettings, useSpeakers } from "@/lib/queries";
import { useEnabledFeedbackForms } from "@/lib/feedback";
import { MessageSquare } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FDP on Smart Data Visualization using Power BI — GNITS" },
      { name: "description", content: "One Week Faculty Development Program on Power BI, Prompt Engineering & Generative AI at GNITS, Hyderabad. 22–27 June 2026." },
      { property: "og:title", content: "FDP on Smart Data Visualization — GNITS" },
      { property: "og:description", content: "One Week FDP at GNITS Hyderabad. Register now." },
    ],
  }),
  component: Home,
});

const outcomes = [
  { icon: BarChart3, title: "Power BI Dashboard Design", desc: "Build production-grade dashboards." },
  { icon: LineChart, title: "Data Visualization Techniques", desc: "Visual storytelling with data." },
  { icon: Wand2, title: "Prompt Engineering", desc: "Get more from LLMs effectively." },
  { icon: Sparkles, title: "Generative AI", desc: "Apply GenAI to analytics workflows." },
  { icon: Brain, title: "AI-Assisted Analytics", desc: "Augment analysis with AI copilots." },
  { icon: Database, title: "Data Engineering", desc: "Model and prepare data at scale." },
  { icon: TrendingUp, title: "Business Intelligence", desc: "Drive decisions with BI." },
  { icon: Workflow, title: "Real-World Use Cases", desc: "Industry applications across domains." },
];

function Home() {
  const { data: settings } = useWebsiteSettings();
  const { data: speakers = [] } = useSpeakers();
  const { data: enabledFeedback = [] } = useEnabledFeedbackForms();
  const feedbackForm = enabledFeedback[0];
  const open = settings?.registration_open ?? true;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <img src={heroBg} alt="" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center text-navy-foreground"
          >
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {open ? (
                <Badge className="border-0 bg-gradient-gold text-gold-foreground">● Registration Open</Badge>
              ) : (
                <Badge variant="destructive">Registration Closed</Badge>
              )}
              <Badge variant="outline" className="border-gold/50 text-gold">
                {settings?.seat_limit ?? 500} Seats Available
              </Badge>
            </div>
            <h1 className="bg-gradient-to-r from-white via-white to-gold bg-clip-text text-4xl font-black leading-tight text-transparent md:text-6xl">
              {settings?.fdp_title ?? "One Week Faculty Development Program (FDP)"}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-white/90 md:text-xl">
              {settings?.fdp_subtitle ?? "Smart Data Visualization using Power BI with Prompt Engineering and Generative AI"}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" />
                <span className="font-medium">{settings?.fdp_dates ?? "22 June 2026 – 27 June 2026"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold" />
                <span className="font-medium">{settings?.venue ?? "CL-11, CSE Block, GNITS, Hyderabad"}</span>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-gold text-gold-foreground font-bold shadow-glow hover:opacity-90">
                <Link to="/register">Register Now</Link>
              </Button>
              {feedbackForm && (
                <Button asChild size="lg" className="bg-gradient-feedback text-white font-bold shadow-glow hover:opacity-90 border-0">
                  <Link to="/feedback/$formId" params={{ formId: feedbackForm.id }}>
                    <MessageSquare className="mr-2 h-4 w-4" /> {feedbackForm.feedback_button_name}
                  </Link>
                </Button>
              )}
              {settings?.brochure_url && (
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
                  <a href={settings.brochure_url} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download Brochure
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="border-secondary/30 text-secondary">About the FDP</Badge>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">A week of immersive learning in modern analytics & AI</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {settings?.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["Power BI", "Data Visualization", "Prompt Engineering", "Generative AI", "AI Tools", "Data Engineering", "Business Intelligence", "Industry Applications"].map((t) => (
              <Badge key={t} variant="secondary" className="px-3 py-1 text-sm">{t}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section id="outcomes" className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="border-secondary/30 text-secondary">Learning Outcomes</Badge>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">What you'll take away</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((o, i) => (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group h-full border-border/60 transition hover:-translate-y-1 hover:border-secondary/50 hover:shadow-elegant">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                      <o.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{o.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{o.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SPEAKERS */}
      <section id="speakers" className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <Badge variant="outline" className="border-gold/40 text-gold">Resource Persons</Badge>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Distinguished Speakers</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {speakers.map((s) => (
            <Card key={s.id} className="overflow-hidden border-border/60 transition hover:shadow-elegant">
              <div className="aspect-square bg-gradient-primary">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Users className="h-16 w-16 text-white/40" />
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold">{s.name}</h3>
                <p className="mt-1 text-sm text-secondary">{s.designation}</p>
                {s.organization && <p className="mt-1 text-xs text-muted-foreground">{s.organization}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-hero py-16 text-navy-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Reserve your seat today</h2>
          <p className="mt-3 text-white/80">Limited seats. Open to faculty across institutions.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-gold text-gold-foreground font-bold shadow-glow">
              <Link to="/register"><CheckCircle2 className="mr-2 h-4 w-4" /> Register Now</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter footerText={settings?.footer_text} email={settings?.contact_email} phone={settings?.contact_phone} />
    </div>
  );
}
