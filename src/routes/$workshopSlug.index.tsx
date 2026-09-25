import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useWorkshops, useCoordinators, useWebsiteSettings } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  Users,
  CheckCircle2,
  Download,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  QrCode,
  Loader2,
  AlertCircle,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

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

function WorkshopUserPage() {
  const { workshopSlug } = useParams({ from: "/$workshopSlug/" });
  const { data: workshops = [], isLoading } = useWorkshops();
  const { data: coordinators = [] } = useCoordinators();
  const { data: settings } = useWebsiteSettings();

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
            The workshop with identifier <code className="text-amber-400 font-mono">/{workshopSlug}</code> could not be found.
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-amber-500/20 py-16 md:py-24">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-xs"
            style={{ backgroundImage: `url(${ws.hero_banner_url || heroBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/90 to-slate-950" />

          <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
            {/* Department Badge & Status */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <Badge className="border-0 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-4 py-1.5 text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20">
                {ws.department || "GNITS"}
              </Badge>
              {ws.registration_open ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold px-3 py-1 text-xs uppercase tracking-wider">
                  ● Registration Open
                </Badge>
              ) : (
                <Badge variant="destructive" className="font-bold px-3 py-1 text-xs uppercase tracking-wider">
                  Registration Closed
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                {ws.title}
              </span>
            </h1>

            {/* Subtitle */}
            {ws.subtitle && (
              <p className="mt-4 text-base md:text-lg text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
                {ws.subtitle}
              </p>
            )}

            {/* Metadata Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-amber-400/30 px-4 py-2.5 text-amber-200 shadow-xl backdrop-blur-sm font-semibold text-xs md:text-sm">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>{ws.dates}</span>
              </div>
              {ws.timings && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-indigo-400/30 px-4 py-2.5 text-indigo-200 shadow-xl backdrop-blur-sm font-semibold text-xs md:text-sm">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>{ws.timings}</span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-emerald-400/30 px-4 py-2.5 text-emerald-200 shadow-xl backdrop-blur-sm font-semibold text-xs md:text-sm">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>{ws.venue}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-yellow-400/30 px-4 py-2.5 text-yellow-200 shadow-xl backdrop-blur-sm font-semibold text-xs md:text-sm">
                <IndianRupee className="h-4 w-4 text-yellow-400" />
                <span>₹{ws.registration_fee} per student</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {ws.registration_open ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base px-10 py-6 shadow-xl shadow-amber-500/30 hover:scale-105 transition-all"
                >
                  <Link to="/register" search={{ workshop: ws.slug }}>
                    Register for this Workshop <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" disabled className="bg-slate-800 text-slate-400 py-6 px-8">
                  Registrations Currently Closed
                </Button>
              )}

              {ws.brochure_url && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-amber-400/40 bg-slate-900/80 text-amber-200 backdrop-blur-md hover:bg-amber-400/20 text-base px-6 py-6"
                >
                  <a href={ws.brochure_url} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-5 w-5 text-amber-400" /> Download Brochure
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* WORKSHOP DETAILS SECTION */}
        <section className="container mx-auto px-4 py-16 max-w-5xl space-y-12">
          {/* Overview & Description */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-amber-400" /> About the Workshop
                </h2>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                  {ws.description ||
                    `${ws.title} organized by Department of ${ws.department || "GNITS"}. Gain hands-on exposure, industry insights, and real-world project skills during this intensive training program.`}
                </p>

                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                      Target Audience
                    </span>
                    <span className="text-sm text-slate-200 font-semibold mt-1 block">
                      B.Tech Engineering Students
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                      Certification
                    </span>
                    <span className="text-sm text-slate-200 font-semibold mt-1 block">
                      Official GNITS Certificate
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Registration & Payment Card */}
            <div className="space-y-6">
              <Card className="bg-slate-900/90 border-amber-500/30 shadow-2xl">
                <CardContent className="p-6 space-y-5">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-amber-400" /> Registration Fee
                  </h3>

                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-xs text-amber-300 font-bold block uppercase tracking-wider">
                      Fee per participant
                    </span>
                    <span className="text-3xl font-black text-white mt-1 block">
                      ₹{ws.registration_fee}
                    </span>
                  </div>

                  {ws.upi_id && (
                    <div className="text-xs space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UPI ID:</span>
                        <span className="font-mono font-bold text-amber-300">{ws.upi_id}</span>
                      </div>
                      {ws.account_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payee:</span>
                          <span className="text-slate-200 font-medium">{ws.account_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {ws.qr_code_url && (
                    <div className="text-center p-3 rounded-lg bg-white/5 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-2 font-semibold">
                        Scan to Pay Registration Fee
                      </span>
                      <img
                        src={ws.qr_code_url}
                        alt="Payment QR"
                        className="h-36 w-36 mx-auto rounded-lg object-contain bg-white p-2 shadow-md"
                      />
                    </div>
                  )}

                  {ws.registration_open ? (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black py-5 shadow-lg shadow-amber-500/25"
                    >
                      <Link to="/register" search={{ workshop: ws.slug }}>
                        Proceed to Register
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full bg-slate-800 text-slate-500">
                      Registration Closed
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Workshop Admin Link */}
              <div className="text-center">
                <Link
                  to={`/${ws.slug}/admin`}
                  className="text-xs text-slate-400 hover:text-amber-400 transition inline-flex items-center gap-1 font-mono"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Coordinator / Admin Login →
                </Link>
              </div>
            </div>
          </div>

          {/* Coordinators Section */}
          {coordinators.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 p-6 md:p-8 rounded-2xl">
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-amber-400" /> Event Coordinators
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {coordinators.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.department}</p>
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 rounded-full font-mono font-semibold"
                      >
                        <Phone className="h-3 w-3" /> {c.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
