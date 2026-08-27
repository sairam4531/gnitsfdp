import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logoUrl from "@/assets/logo.png";
import csiLogoUrl from "@/assets/csi-logo.png";
import excellenceLogoUrl from "@/assets/excellence-logo.jpg";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt="GNITS Logo"
            className="h-10 w-10 object-contain rounded-full bg-white p-0.5 shadow-sm border border-border/20"
          />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">GNITS</div>
            <div className="text-[10px] text-muted-foreground">CSE (Data Science)</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="/#about" className="text-muted-foreground transition hover:text-foreground">
            About
          </a>
          <a href="/#outcomes" className="text-muted-foreground transition hover:text-foreground">
            Outcomes
          </a>
          <a href="/#speakers" className="text-muted-foreground transition hover:text-foreground">
            Speakers
          </a>
          <a href="/#contact" className="text-muted-foreground transition hover:text-foreground">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-2.5">
          <img
            src={csiLogoUrl}
            alt="CSI Logo"
            className="h-10 w-10 object-contain bg-white rounded-full p-0.5 shadow-sm border border-border/20"
          />
          <img
            src={excellenceLogoUrl}
            alt="Excellence Logo"
            className="h-10 w-10 object-contain bg-white rounded-full p-0.5 shadow-sm border border-border/20"
          />
        </div>
      </div>
    </header>
  );
}
