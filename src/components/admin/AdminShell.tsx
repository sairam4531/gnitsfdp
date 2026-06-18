import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, Users, CreditCard, Settings, Mic, BarChart3, FileText,
  CalendarCheck, LogOut, GraduationCap, MessageSquare, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useIsAdmin } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/workshop", label: "Workshop", icon: CalendarCheck },
  { to: "/admin/registrations", label: "Responses", icon: Users },
  { to: "/admin/payment-settings", label: "Payment", icon: CreditCard },
  { to: "/admin/website-settings", label: "Website", icon: Settings },
  { to: "/admin/speakers", label: "Speakers", icon: Mic },
  { to: "/admin/feedback/questions", label: "Feedback Forms", icon: MessageSquare },
  { to: "/admin/feedback/responses", label: "Feedback Responses", icon: ClipboardList },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports", icon: FileText },
];


export function AdminShell() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  console.log("[AdminShell] Render. user:", user?.id, "loading:", loading, "isAdmin:", isAdmin);

  useEffect(() => {
    if (!loading && !user) {
      console.log("[AdminShell] No user and not loading, redirecting to /auth");
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isAdmin === false && user) {
      console.log("[AdminShell] isAdmin is false but user is logged in. LOGGING OUT!");
      toast.error("You don't have admin access.");
      supabase.auth.signOut();
      navigate({ to: "/auth" });
    }
  }, [isAdmin, user, navigate]);

  async function logout() {
    console.log("[AdminShell] User triggered logout");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading || isAdmin === null) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">GNITS</div>
            <div className="text-[10px] opacity-70">FDP Admin</div>
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
      <main className="flex-1 overflow-x-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="font-semibold">FDP Portal — Admin</div>
          <Button variant="ghost" size="sm" onClick={logout} className="md:hidden"><LogOut className="h-4 w-4" /></Button>
        </header>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
