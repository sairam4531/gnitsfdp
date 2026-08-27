import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Terminal,
  Sliders,
  Eye,
  Target,
  Brain,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useWebsiteSettings, useSpeakers } from "@/lib/queries";
import { useEnabledFeedbackForms } from "@/lib/feedback";
import { useEnabledQuizExam } from "@/lib/quiz";
import { MessageSquare, GraduationCap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Two Days Hands-On Workathon on 'ARTIFICIAL INTELLIGENCE HUMANOID ROBOT' — GNITS" },
      {
        name: "description",
        content:
          "Department of CSE (Data Science) is organizing a Two Days Hands-On Workathon on 'ARTIFICIAL INTELLIGENCE HUMANOID ROBOT' under GNITS CSI Student Chapter.",
      },
    ],
  }),
  component: Home,
});

const outcomes = [
  {
    icon: Cpu,
    title: "BionicBot Hardware Setup",
    desc: "Gain hands-on understanding of humanoid robot components and setup configuration.",
  },
  {
    icon: Terminal,
    title: "Python SDK Programming",
    desc: "Program humanoid robots using Python and block coding languages.",
  },
  {
    icon: Sliders,
    title: "Servo & Movement Control",
    desc: "Configure motor controls for wheels, arms, and head movements.",
  },
  {
    icon: Eye,
    title: "Computer Vision Integration",
    desc: "Implement object tracking and detection algorithms on humanoid hardware.",
  },
  {
    icon: Brain,
    title: "AI Concepts in Robotics",
    desc: "Apply advanced AI decision-making concepts to humanoid robots.",
  },
  {
    icon: Target,
    title: "YOLO Simulation & Projects",
    desc: "Develop YOLO tracking simulations in custom robotics projects.",
  },
];

function Home() {
  const { data: settings } = useWebsiteSettings();
  const { data: speakers = [] } = useSpeakers();
  const { data: enabledFeedback = [] } = useEnabledFeedbackForms();
  const { data: enabledQuiz } = useEnabledQuizExam();
  const feedbackForm = enabledFeedback[0];
  const open = settings?.registration_open ?? true;

  const defaultTitle = "Two Days Hands-On Workathon on 'ARTIFICIAL INTELLIGENCE HUMANOID ROBOT'";
  const defaultSubtitle =
    "under GNITS CSI Student Chapter — Gain hands-on experience in AI-powered humanoid robot technologies with BionicBot Hardware, Python SDK programming, Servo Control, and Computer Vision.";
  const defaultDates = "10 September 2026 – 11 September 2026";
  const defaultVenue = "CL-12 & 13, 4th Floor, Admin Block, GNITS, Hyderabad";
  const defaultDescription =
    "The Department of CSE (Data Science), GNITS, Hyderabad is organizing a Two Days Hands-On Workathon on 'ARTIFICIAL INTELLIGENCE HUMANOID ROBOT' under GNITS CSI Student Chapter. III B.Tech. I-Sem students of CSE, CSE(DS), and IT are encouraged to actively participate and utilize this opportunity to gain hands-on experience in AI-powered humanoid robot technologies, thereby enhancing their technical skills for future academic and professional endeavors.";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-screen"
        />
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
                <Badge className="border-0 bg-gradient-gold text-gold-foreground">
                  ● Registration Open
                </Badge>
              ) : (
                <Badge variant="destructive">Registration Closed</Badge>
              )}
              <Badge variant="outline" className="border-gold/50 text-gold">
                {settings?.seat_limit ?? 500} Seats Available
              </Badge>
            </div>
            <h1 className="bg-gradient-to-r from-white via-white to-gold bg-clip-text text-4xl font-black leading-tight text-transparent md:text-5xl">
              {settings?.fdp_title || defaultTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-white/90 md:text-xl">
              {settings?.fdp_subtitle || defaultSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" />
                <span className="font-medium">{settings?.fdp_dates || defaultDates}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold" />
                <span className="font-medium">{settings?.venue || defaultVenue}</span>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-gold text-gold-foreground font-bold shadow-glow hover:opacity-90 animate-pulse-gentle"
              >
                <Link to="/register">Register Now</Link>
              </Button>
              {enabledQuiz && (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-glow hover:opacity-90 border-0"
                >
                  <Link to="/quiz/$examId" params={{ examId: enabledQuiz.id }}>
                    <GraduationCap className="mr-2 h-4 w-4" /> Quiz Exam
                  </Link>
                </Button>
              )}
              {feedbackForm && (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-feedback text-white font-bold shadow-glow hover:opacity-90 border-0"
                >
                  <Link to="/feedback/$formId" params={{ formId: feedbackForm.id }}>
                    <MessageSquare className="mr-2 h-4 w-4" /> {feedbackForm.feedback_button_name}
                  </Link>
                </Button>
              )}
              {settings?.brochure_url && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
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
          <Badge variant="outline" className="border-secondary/30 text-secondary">
            About the Workshop
          </Badge>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Two Days Hands-on Workathon in Humanoid Robotics & AI
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {settings?.description || defaultDescription}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              "AI Humanoid Robot",
              "BionicBot Hardware",
              "Python SDK Programming",
              "Block Coding",
              "Servo & Movement Control",
              "Computer Vision",
              "YOLO Model Simulation",
              "Object Tracking",
            ].map((t) => (
              <Badge key={t} variant="secondary" className="px-3 py-1 text-sm">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section id="outcomes" className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="border-secondary/30 text-secondary">
              Learning Outcomes
            </Badge>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">What you'll take away</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
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
                      <o.icon className="h-5 w-5 animate-pulse-gentle" />
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
          <Badge variant="outline" className="border-gold/40 text-gold">
            Resource Persons
          </Badge>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Distinguished Speakers</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {speakers.map((s) => (
            <Card
              key={s.id}
              className="overflow-hidden border-border/60 transition hover:shadow-elegant"
            >
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
                {s.organization && (
                  <p className="mt-1 text-xs text-muted-foreground">{s.organization}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-hero py-16 text-navy-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Reserve your seat today</h2>
          <p className="mt-3 text-white/80">
            Limited seats. Open to III B.Tech. students of CSE, CSE(DS), and IT at GNITS.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gradient-gold text-gold-foreground font-bold shadow-glow"
            >
              <Link to="/register">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Register Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter
        footerText={settings?.footer_text}
        email={settings?.contact_email}
        phone={settings?.contact_phone}
      />
    </div>
  );
}
