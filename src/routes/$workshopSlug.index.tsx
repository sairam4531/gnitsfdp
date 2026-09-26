import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  useWorkshops,
  useSpeakers,
  useCoordinators,
  useWebsiteSettings,
  useRegistrationCount,
  Workshop,
} from "@/lib/queries";
import { useEnabledFeedbackForms } from "@/lib/feedback";
import { useEnabledQuizExam } from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  MessageSquare,
  GraduationCap,
  Cpu,
  Terminal,
  Sliders,
  Eye,
  Brain,
  Target,
  IndianRupee,
  Loader2,
  AlertCircle,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import heroVideo from "@/assets/second_AI_Powered_Humanoid.mp4";

export const Route = createFileRoute("/$workshopSlug/")({
  head: () => ({
    meta: [
      { title: "Technical Workshop — GNITS" },
      {
        name: "viewport",
        content: "width=1024, initial-scale=0.38, maximum-scale=3.0, user-scalable=yes",
      },
    ],
  }),
  component: WorkshopUserPage,
});

interface WorkshopTopic {
  name: string;
  color: string;
}

interface WorkshopOutcome {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

interface WorkshopContent {
  aboutTitle: string;
  tags: WorkshopTopic[];
  outcomes: WorkshopOutcome[];
  ctaText: string;
}

function getWorkshopContent(ws: Workshop): WorkshopContent {
  const slug = ws.slug.toLowerCase();
  const isHumanoid = slug.includes("humanoid") || slug.includes("robot");
  const isAgentic = slug.includes("agentic") || slug.includes("cloud");

  if (isHumanoid) {
    return {
      aboutTitle: "Two Days Hands-on Workathon in Humanoid Robotics & AI",
      tags: [
        {
          name: "AI Humanoid Robot",
          color: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300",
        },
        {
          name: "BionicBot Hardware",
          color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300",
        },
        {
          name: "Python SDK Programming",
          color: "border-indigo-400/40 bg-indigo-400/10 text-indigo-600 dark:text-indigo-300",
        },
        {
          name: "Block Coding",
          color: "border-purple-400/40 bg-purple-400/10 text-purple-600 dark:text-purple-300",
        },
        {
          name: "Servo & Movement Control",
          color: "border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
        },
        {
          name: "Computer Vision",
          color: "border-pink-400/40 bg-pink-400/10 text-pink-600 dark:text-pink-300",
        },
        {
          name: "YOLO Model Simulation",
          color: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300",
        },
        {
          name: "Object Tracking",
          color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300",
        },
      ],
      outcomes: [
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
      ],
      ctaText:
        "Limited seats available. Open to all III B.Tech. students of CSE, CSE(AI&ML), CSE(DS), and IT at GNITS.",
    };
  }

  if (isAgentic) {
    return {
      aboutTitle: "Two Days Hands-on Workshop in Agentic AI & Cloud-Native Systems",
      tags: [
        {
          name: "Autonomous AI Agents",
          color: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300",
        },
        {
          name: "LangChain & LlamaIndex",
          color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300",
        },
        {
          name: "Cloud-Native Systems",
          color: "border-indigo-400/40 bg-indigo-400/10 text-indigo-600 dark:text-indigo-300",
        },
        {
          name: "Docker & Kubernetes",
          color: "border-purple-400/40 bg-purple-400/10 text-purple-600 dark:text-purple-300",
        },
        {
          name: "Multi-Agent Workflows",
          color: "border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
        },
        {
          name: "Vector Databases",
          color: "border-pink-400/40 bg-pink-400/10 text-pink-600 dark:text-pink-300",
        },
        {
          name: "Microservices Architecture",
          color: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300",
        },
        {
          name: "API Orchestration",
          color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300",
        },
      ],
      outcomes: [
        {
          icon: Brain,
          title: "Autonomous Agent Architectures",
          desc: "Design and implement autonomous agents using state-of-the-art frameworks.",
        },
        {
          icon: Terminal,
          title: "LangChain & LlamaIndex Mastery",
          desc: "Build complex RAG pipelines and tool-augmented reasoning workflows.",
        },
        {
          icon: Cpu,
          title: "Cloud-Native Microservices",
          desc: "Package, containerize, and orchestrate scalable services using Docker & Kubernetes.",
        },
        {
          icon: Eye,
          title: "Vector DB & Semantic Search",
          desc: "Integrate high-performance vector databases for enterprise semantic discovery.",
        },
        {
          icon: Sliders,
          title: "API Orchestration & Security",
          desc: "Secure and streamline multi-agent communication and cloud endpoints.",
        },
        {
          icon: Target,
          title: "End-to-End Capstone Project",
          desc: "Build and deploy an enterprise-ready agentic cloud system from scratch.",
        },
      ],
      ctaText: `Limited seats available. Open to all engineering students of ${ws.department || "GNITS"} at GNITS.`,
    };
  }

  // Dynamic fallback for any other workshop
  return {
    aboutTitle: ws.title,
    tags: [
      {
        name: "Hands-On Practical Labs",
        color: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300",
      },
      {
        name: "Industry Toolchains",
        color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300",
      },
      {
        name: "System Architecture",
        color: "border-indigo-400/40 bg-indigo-400/10 text-indigo-600 dark:text-indigo-300",
      },
      {
        name: "Engineering Best Practices",
        color: "border-purple-400/40 bg-purple-400/10 text-purple-600 dark:text-purple-300",
      },
      {
        name: "Real-World Case Studies",
        color: "border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
      },
      {
        name: "Expert Mentorship",
        color: "border-pink-400/40 bg-pink-400/10 text-pink-600 dark:text-pink-300",
      },
      {
        name: "Capstone Project",
        color: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300",
      },
      {
        name: "Official Certificate",
        color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300",
      },
    ],
    outcomes: [
      {
        icon: Cpu,
        title: "Core Architecture & Foundations",
        desc: "Gain in-depth practical understanding of modern tools, hardware, and runtime platforms.",
      },
      {
        icon: Terminal,
        title: "Applied Programming & Development",
        desc: "Build functional solutions, scripts, and workflows following industry standards.",
      },
      {
        icon: Sliders,
        title: "Control, Optimization & Performance",
        desc: "Learn precision parameter tuning, efficiency enhancement, and debugging techniques.",
      },
      {
        icon: Eye,
        title: "Integration & System Design",
        desc: "Connect diverse toolkits, APIs, and modern frameworks into cohesive workflows.",
      },
      {
        icon: Brain,
        title: "Advanced Problem Solving",
        desc: "Apply intelligent logic, algorithms, and real-time decision making to complex challenges.",
      },
      {
        icon: Target,
        title: "Capstone Project Deployment",
        desc: "Build and test an end-to-end practical project ready for your technical portfolio.",
      },
    ],
    ctaText: `Limited seats available for ${ws.title}. Reserve your spot today to receive official certification from GNITS.`,
  };
}

function WorkshopUserPage() {
  const { workshopSlug } = useParams({ from: "/$workshopSlug/" });
  const { data: workshops = [], isLoading } = useWorkshops();
  const { data: speakers = [] } = useSpeakers();
  const { data: settings } = useWebsiteSettings();
  const { data: enabledFeedback = [] } = useEnabledFeedbackForms();
  const { data: enabledQuiz } = useEnabledQuizExam();
  const { data: regCount = 0 } = useRegistrationCount(workshopSlug);

  const ws = workshops.find(
    (w) => w.slug.toLowerCase() === workshopSlug.toLowerCase(),
  );

  // Set desktop viewport scale for consistency
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute("content");
    meta.setAttribute(
      "content",
      "width=1024, initial-scale=0.38, maximum-scale=3.0, user-scalable=yes",
    );
    return () => {
      if (prevContent) meta.setAttribute("content", prevContent);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <span className="ml-3 font-medium">Loading workshop details…</span>
      </div>
    );
  }

  if (!ws) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100">
        <SiteHeader />
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <div className="h-16 w-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Workshop Not Found</h1>
          <p className="text-sm text-slate-400 mt-2">
            The workshop with identifier{" "}
            <code className="text-amber-400 font-mono">/{workshopSlug}</code> could not be found.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="bg-amber-500 text-slate-950 font-bold">
              <Link to="/">View All Programs</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-700">
              <Link to="/it-admin">IT Admin</Link>
            </Button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const content = getWorkshopContent(ws);
  const remainingSeats = Math.max(0, ws.seat_limit - regCount);
  const feedbackForm = enabledFeedback[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader department={ws.department} />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-navy/90 to-purple-950/80" />
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={ws.hero_banner_url || heroBg}
          className="absolute inset-0 h-full w-full object-cover opacity-40 filter contrast-125 brightness-90 pointer-events-none"
        >
          <source src={heroVideo} type="video/mp4" />
          <img
            src={ws.hero_banner_url || heroBg}
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
            {/* Badges */}
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {ws.registration_open ? (
                <Badge className="border-0 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-4 py-1.5 text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20">
                  ● Registration Open
                </Badge>
              ) : (
                <Badge variant="destructive" className="font-bold px-4 py-1.5">
                  Registration Closed
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-amber-400/60 bg-slate-900/80 text-amber-300 font-bold px-4 py-1.5 text-xs md:text-sm backdrop-blur-md shadow-lg"
              >
                {remainingSeats} Seats Left
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                {ws.title}
              </span>
            </h1>

            {/* Subtitle */}
            {ws.subtitle && (
              <div className="mx-auto mt-6 max-w-3xl rounded-2xl bg-slate-950/75 border border-amber-400/30 p-5 md:p-6 backdrop-blur-md shadow-2xl">
                <p className="text-base md:text-lg leading-relaxed text-slate-100 font-medium drop-shadow-sm">
                  {ws.subtitle}
                </p>
              </div>
            )}

            {/* Info Chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-4">
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/90 border border-amber-400/40 px-4 py-2.5 text-amber-200 shadow-xl backdrop-blur-sm font-semibold text-sm md:text-base">
                <Calendar className="h-5 w-5 text-amber-400" />
                <span>{ws.dates}</span>
              </div>
              {ws.timings && (
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/90 border border-cyan-400/40 px-4 py-2.5 text-cyan-200 shadow-xl backdrop-blur-sm font-semibold text-sm md:text-base">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  <span>{ws.timings}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/90 border border-emerald-400/40 px-4 py-2.5 text-emerald-200 shadow-xl backdrop-blur-sm font-semibold text-sm md:text-base">
                <MapPin className="h-5 w-5 text-emerald-400" />
                <span>{ws.venue}</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/90 border border-yellow-400/40 px-4 py-2.5 text-yellow-200 shadow-xl backdrop-blur-sm font-semibold text-sm md:text-base">
                <IndianRupee className="h-5 w-5 text-yellow-400" />
                <span>₹{ws.registration_fee} Fee</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {ws.registration_open ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base px-8 py-6 shadow-xl shadow-amber-500/25 hover:scale-105 transition-all"
                >
                  <Link to="/register" search={{ workshop: ws.slug }}>
                    Register Now
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="bg-slate-800 text-slate-400 font-bold text-base px-8 py-6 cursor-not-allowed"
                >
                  Registration Closed
                </Button>
              )}

              {feedbackForm && (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-base px-6 py-6 shadow-xl shadow-purple-600/25 hover:scale-105 transition-all border-0"
                >
                  <Link to="/feedback/$formId" params={{ formId: feedbackForm.id }}>
                    <MessageSquare className="mr-2 h-5 w-5 text-pink-200" />{" "}
                    {feedbackForm.feedback_button_name}
                  </Link>
                </Button>
              )}

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

              {ws.brochure_url && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-amber-400/40 bg-slate-900/80 text-amber-200 backdrop-blur-md hover:bg-amber-400/20 hover:text-white text-base px-6 py-6 transition-all"
                >
                  <a href={ws.brochure_url} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-5 w-5 text-amber-400" /> Download Brochure
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. ABOUT THE WORKSHOP SECTION */}
      <section id="about" className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="border-amber-400/40 bg-amber-400/10 text-amber-500 font-extrabold px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
            About the Workshop
          </Badge>
          <h2 className="mt-4 text-3xl font-black md:text-5xl tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 dark:from-amber-300 dark:via-yellow-200 dark:to-cyan-300 bg-clip-text text-transparent">
              {content.aboutTitle}
            </span>
          </h2>
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-6 md:p-8 backdrop-blur-md shadow-xl text-left md:text-center">
            <p className="text-base md:text-lg leading-relaxed text-foreground/90 font-medium whitespace-pre-line">
              {ws.description ||
                `${ws.title} organized by Department of ${ws.department || "GNITS"}. Gain hands-on exposure, industry insights, and real-world project skills during this intensive training program.`}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {content.tags.map((t) => (
              <Badge
                key={t.name}
                variant="outline"
                className={`px-4 py-1.5 text-xs font-bold rounded-full border shadow-sm ${t.color}`}
              >
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LEARNING OUTCOMES SECTION */}
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
            {content.outcomes.map((o, i) => (
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
                    <h3 className="font-bold text-lg text-foreground group-hover:text-amber-500 transition-colors">
                      {o.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                      {o.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RESOURCE PERSONS / SPEAKERS SECTION */}
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
                  <img
                    src={s.photo_url}
                    alt={s.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Users className="h-16 w-16 text-amber-400/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-base text-foreground">{s.name}</h3>
                <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {s.designation}
                </p>
                {s.organization && (
                  <p className="mt-1 text-xs text-muted-foreground font-medium">
                    {s.organization}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-navy to-purple-950 py-16 px-6 md:px-12 text-center text-white border border-amber-400/30 shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black md:text-5xl tracking-tight text-white drop-shadow-md">
              Reserve Your Seat Today
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-200 font-medium leading-relaxed">
              {content.ctaText}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {ws.registration_open ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base px-8 py-6 shadow-xl shadow-amber-500/25 hover:scale-105 transition-all"
                >
                  <Link to="/register" search={{ workshop: ws.slug }}>
                    <CheckCircle2 className="mr-2 h-5 w-5 text-slate-950" /> Register Now
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="bg-slate-800 text-slate-400 px-8 py-6 cursor-not-allowed"
                >
                  Registration Closed
                </Button>
              )}
            </div>

            <div className="mt-6 text-center">
              <Link
                to={`/${ws.slug}/admin`}
                className="text-xs text-amber-300/60 hover:text-amber-300 transition inline-flex items-center gap-1 font-mono"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Coordinator / Workshop Admin Login →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <SiteFooter
        footerText={settings?.footer_text}
        email={settings?.contact_email}
        phone={settings?.contact_phone}
        department={ws.department}
        workshopSlug={ws.slug}
      />
    </div>
  );
}
