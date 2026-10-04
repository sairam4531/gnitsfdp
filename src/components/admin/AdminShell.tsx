import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Mic,
  BarChart3,
  FileText,
  CalendarCheck,
  LogOut,
  MessageSquare,
  ClipboardList,
  GraduationCap,
  ListChecks,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useIsAdmin } from "@/lib/use-auth";
import logoUrl from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/workshop", label: "Workshops", icon: CalendarCheck },
  { to: "/admin/registrations", label: "Responses", icon: Users },
  { to: "/admin/feedback/questions", label: "Feedback Forms", icon: MessageSquare },
  { to: "/admin/feedback/responses", label: "Feedback Responses", icon: ClipboardList },
  { to: "/admin/quiz/questions", label: "Quiz Questions", icon: GraduationCap },
  { to: "/admin/quiz/responses", label: "Quiz Responses", icon: ListChecks },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/diagnose", label: "Screenshot Diagnosis", icon: ShieldCheck },
];

export function AdminShell() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const currentLabel =
    [...nav].reverse().find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? "Admin";

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && isAdmin === false) {
      toast.error("You don't have admin access.");
      supabase.auth.signOut();
      navigate({ to: "/auth" });
    }
  }, [isAdmin, user, loading, navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground font-medium">
        Loading…
      </div>
    );
  }

  if (user && isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground font-medium">
        Verifying permissions…
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <img src={logoUrl} alt="GNITS Logo" className="h-9 w-9 object-contain rounded-md" />
          <div className="leading-tight">
            <div className="text-sm font-bold">GNITS</div>
            <div className="text-[10px] opacity-70">Workshop Admin</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold" : "hover:bg-sidebar-accent"}`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 truncate px-2 text-xs opacity-70">{user.email}</div>
          <Button variant="secondary" size="sm" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <img src={logoUrl} alt="GNITS Logo" className="h-8 w-8 shrink-0 object-contain rounded-md" />
                <div className="truncate text-sm font-bold">Workshop Admin</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {nav.map((n) => {
                const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold" : "hover:bg-sidebar-accent"}`}
                  >
                    <n.icon className="h-4 w-4 shrink-0" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-3">
              <div className="mb-2 truncate px-2 text-xs opacity-70">{user.email}</div>
              <Button variant="secondary" size="sm" className="w-full" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </aside>
        </div>
      )}
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-40 grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b bg-background px-3 md:flex md:justify-between md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="truncate font-semibold">
            <span className="md:hidden">{currentLabel}</span>
            <span className="hidden md:inline">Workshop Portal — Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="md:hidden" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
