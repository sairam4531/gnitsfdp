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
  Clock,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useWebsiteSettings, useSpeakers, useRegistrationCount } from "@/lib/queries";
import { useEnabledFeedbackForms } from "@/lib/feedback";
import { useEnabledQuizExam } from "@/lib/quiz";
import { MessageSquare, GraduationCap } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import heroVideo from "@/assets/second_AI_Powered_Humanoid.mp4";

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
  const { data: regCount = 0 } = useRegistrationCount();
  const feedbackForm = enabledFeedback[0];
  const open = settings?.registration_open ?? true;
  const remainingSeats = Math.max(0, (settings?.seat_limit ?? 500) - regCount);

  const defaultTitle = "Two Days Hands-On Workathon on 'ARTIFICIAL INTELLIGENCE HUMANOID ROBOT'";
  const defaultSubtitle =
    "under GNITS CSI Student Chapter — Gain hands-on experience in AI-powered humanoid robot technologies with BionicBot Hardware, Python SDK programming, Servo Control, and Computer Vision.";
  const defaultDates = "10 September 2026 – 11 September 2026";
  const defaultTimings = "9:00 AM to 4:00 PM";
  const defaultVenue = "CL-12 & 13, 4th Floor, Admin Block, GNITS, Hyderabad";
  const defaultDescription =
    "The Department of CSE (Data Science), GNITS, Hyderabad is organizing a Two Days Hands-On Workathon on 'ARTIFICIAL INTELLIGENCE HUMANOID ROBOT' under GNITS CSI Student Chapter. III B.Tech. I-Sem students of CSE, CSE(DS), and IT are encouraged to actively participate and utilize this opportunity to gain hands-on experience in AI-powered humanoid robot technologies, thereby enhancing their technical skills for future academic and professional endeavors.";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-navy/90 to-purple-950/80" />
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={heroBg}
          className="absolute inset-0 h-full w-full object-cover opacity-40 filter contrast-125 brightness-90 pointer-events-none"
        >
          <source src={heroVideo} type="video/mp4" />
          <img
            src={heroBg}
            alt=""
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover opacity-25 filter contrast-125 brightness-75"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/65 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.55)_100%)] pointer-events-none" />

        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {open ? (
                <Badge className="border-0 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-4 py-1.5 text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20">
                  ● Registration Open
                </Badge>
              ) : (
                <Badge variant="destructive" className="font-bold px-4 py-1.5">
                  Registration Closed
                </Badge>
              )}
              <Badge variant="outline" className="border-amber-400/60 bg-slate-900/80 text-amber-300 font-bold px-4 py-1.5 text-xs md:text-sm backdrop-blur-md shadow-lg">
                {remainingSeats} Seats Left
              </Badge>
            </div>

            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                {settings?.fdp_title || defaultTitle}
              </span>
            </h1>

            <div className="mx-auto mt-6 max-w-3xl rounded-2xl bg-slate-950/75 border border-amber-400/30 p-5 md:p-6 backdrop-blur-md shadow-2xl">
              <p className="text-base md:text-lg leading-relaxed text-slate-100 font-medium drop-shadow-sm">
                {settings?.fdp_subtitle || defaultSubtitle}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-4">
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/90 border border-amber-400/40 px-4 py-2.5 text-amber-200 shadow-xl backdrop-blur-sm font-semibold text-sm md:text-base">
                <Calendar className="h-5 w-5 text-amber-400" />
                <span>{settings?.fdp_dates || defaultDates}</span>
              </div>
              {(settings?.timings || defaultTimings) && (
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/90 border border-cyan-400/40 px-4 py-2.5 text-cyan-200 shadow-xl backdrop-blur-sm font-semibold text-sm md:text-base">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  <span>{settings?.timings || defaultTimings}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/90 border border-emerald-400/40 px-4 py-2.5 text-emerald-200 shadow-xl backdrop-blur-sm font-semibold text-sm md:text-base">
                <MapPin className="h-5 w-5 text-emerald-400" />
                <span>{settings?.venue || defaultVenue}</span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base px-8 py-6 shadow-xl shadow-amber-500/25 hover:scale-105 transition-all"
              >
                <Link to="/register">Register Now</Link>
              </Button>
              {enabledQuiz && (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base px-6 py-6 shadow-xl shadow-indigo-600/25 hover:scale-105 transition-all border-0"
                >
                  <Link to="/quiz/$examId" params={{ examId: enabledQuiz.id }}>
                    <GraduationCap className="mr-2 h-5 w-5 text-indigo-200" /> Quiz Exam
                  </Link>
                </Button>
              )}
              {feedbackForm && (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-base px-6 py-6 shadow-xl shadow-purple-600/25 hover:scale-105 transition-all border-0"
                >
                  <Link to="/feedback/$formId" params={{ formId: feedbackForm.id }}>
                    <MessageSquare className="mr-2 h-5 w-5 text-pink-200" /> {feedbackForm.feedback_button_name}
                  </Link>
                </Button>
              )}
              {settings?.brochure_url && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-amber-400/40 bg-slate-900/80 text-amber-200 backdrop-blur-md hover:bg-amber-400/20 hover:text-white text-base px-6 py-6 transition-all"
                >
                  <a href={settings.brochure_url} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-5 w-5 text-amber-400" /> Download Brochure
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="border-amber-400/40 bg-amber-400/10 text-amber-500 font-extrabold px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
            About the Workshop
          </Badge>
          <h2 className="mt-4 text-3xl font-black md:text-5xl tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 dark:from-amber-300 dark:via-yellow-200 dark:to-cyan-300 bg-clip-text text-transparent">
              Two Days Hands-on Workathon in Humanoid Robotics & AI
            </span>
          </h2>
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-6 md:p-8 backdrop-blur-md shadow-xl text-left md:text-center">
            <p className="text-base md:text-lg leading-relaxed text-foreground/90 font-medium">
              {settings?.description || defaultDescription}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {[
              { name: "AI Humanoid Robot", color: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300" },
              { name: "BionicBot Hardware", color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300" },
              { name: "Python SDK Programming", color: "border-indigo-400/40 bg-indigo-400/10 text-indigo-600 dark:text-indigo-300" },
              { name: "Block Coding", color: "border-purple-400/40 bg-purple-400/10 text-purple-600 dark:text-purple-300" },
              { name: "Servo & Movement Control", color: "border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300" },
              { name: "Computer Vision", color: "border-pink-400/40 bg-pink-400/10 text-pink-600 dark:text-pink-300" },
              { name: "YOLO Model Simulation", color: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300" },
              { name: "Object Tracking", color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300" },
            ].map((t) => (
              <Badge key={t.name} variant="outline" className={`px-4 py-1.5 text-xs font-bold rounded-full border shadow-sm ${t.color}`}>
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section id="outcomes" className="bg-slate-950/5 dark:bg-slate-900/40 py-24 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <Badge className="border-indigo-400/40 bg-indigo-400/10 text-indigo-500 font-extrabold px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
              Learning Outcomes
            </Badge>
            <h2 className="mt-4 text-3xl font-black md:text-5xl tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-300 dark:via-purple-200 dark:to-pink-300 bg-clip-text text-transparent">
                What You'll Gain & Master
              </span>
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {outcomes.map((o, i) => (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group h-full rounded-2xl border-amber-400/20 bg-card/80 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/10">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                      <o.icon className="h-6 w-6 font-bold" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-amber-500 transition-colors">{o.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">{o.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SPEAKERS */}
      <section id="speakers" className="container mx-auto px-4 py-24">
        <div className="mb-14 text-center">
          <Badge className="border-amber-400/40 bg-amber-400/10 text-amber-500 font-extrabold px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
            Resource Persons
          </Badge>
          <h2 className="mt-4 text-3xl font-black md:text-5xl tracking-tight">
            <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-300 dark:to-yellow-200 bg-clip-text text-transparent">
              Distinguished Speakers & Experts
            </span>
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {speakers.map((s) => (
            <Card
              key={s.id}
              className="overflow-hidden rounded-2xl border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-amber-400/40"
            >
              <div className="aspect-square bg-gradient-to-br from-slate-900 via-navy to-purple-950 relative overflow-hidden">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Users className="h-16 w-16 text-amber-400/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-base text-foreground">{s.name}</h3>
                <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">{s.designation}</p>
                {s.organization && (
                  <p className="mt-1 text-xs text-muted-foreground font-medium">{s.organization}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-navy to-purple-950 py-16 px-6 md:px-12 text-center text-white border border-amber-400/30 shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black md:text-5xl tracking-tight text-white drop-shadow-md">
              Reserve Your Seat Today
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-200 font-medium leading-relaxed">
              Limited seats available. Open to all III B.Tech. students of CSE, CSE(AI&ML), CSE(DS), and IT at GNITS.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base px-8 py-6 shadow-xl shadow-amber-500/25 hover:scale-105 transition-all"
              >
                <Link to="/register">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-slate-950" /> Register Now
                </Link>
              </Button>
            </div>
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
