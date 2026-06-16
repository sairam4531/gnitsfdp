import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">GNITS</div>
            <div className="text-[10px] text-muted-foreground">CSE (AI & ML) & CSE (Data Science)</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="/#about" className="text-muted-foreground transition hover:text-foreground">About</a>
          <a href="/#outcomes" className="text-muted-foreground transition hover:text-foreground">Outcomes</a>
          <a href="/#speakers" className="text-muted-foreground transition hover:text-foreground">Speakers</a>
          <a href="/#contact" className="text-muted-foreground transition hover:text-foreground">Contact</a>
        </nav>
        <div className="flex items-center gap-2">
          {/* <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
            <Link to="/register">Register</Link>
          </Button> */}
        </div>
      </div>
    </header>
  );
}
