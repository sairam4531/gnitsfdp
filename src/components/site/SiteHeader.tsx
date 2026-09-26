import { Link, useRouterState } from "@tanstack/react-router";
import logoUrl from "@/assets/logo.png";
import csiLogoUrl from "@/assets/csi-logo.png";
import excellenceLogoUrl from "@/assets/excellence-logo.jpg";

export function SiteHeader({ department }: { department?: string | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-amber-400/20 bg-slate-950/85 backdrop-blur-xl shadow-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logoUrl}
            alt="GNITS Logo"
            className="h-10 w-10 object-contain rounded-full bg-white p-0.5 shadow-md border border-amber-400/40 group-hover:scale-105 transition-transform"
          />
          <div className="leading-tight">
            <div className="text-sm font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
              GNITS
            </div>
            <div className="text-[10px] font-semibold text-amber-300/90 tracking-wide">
              {department || "CSE (Data Science)"}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
          <a
            href={isHome ? "#workshops" : "/#workshops"}
            className="text-amber-300 transition hover:text-amber-200 hover:scale-105 flex items-center gap-1 font-bold"
          >
            Workshops
          </a>
          <a href="#about" className="text-slate-300 transition hover:text-amber-300 hover:scale-105">
            About
          </a>
          <a href="#outcomes" className="text-slate-300 transition hover:text-amber-300 hover:scale-105">
            Outcomes
          </a>
          <a href="#speakers" className="text-slate-300 transition hover:text-amber-300 hover:scale-105">
            Speakers
          </a>
          <a href="#contact" className="text-slate-300 transition hover:text-amber-300 hover:scale-105">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <img
            src={csiLogoUrl}
            alt="CSI Logo"
            className="h-9 w-9 object-contain bg-white rounded-full p-0.5 shadow-sm border border-amber-400/30"
          />
          <img
            src={excellenceLogoUrl}
            alt="Excellence Logo"
            className="h-9 w-9 object-contain bg-white rounded-full p-0.5 shadow-sm border border-amber-400/30"
          />
        </div>
      </div>
    </header>
  );
}

