import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegistrations, useWebsiteSettings } from "@/lib/queries";
import {
  Users,
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Building2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: regs = [] } = useRegistrations();
  const { data: settings } = useWebsiteSettings();

  const today = startOfDay(new Date());
  const stats = {
    total: regs.length,
    internal: regs.filter((r) => r.category === "Internal").length,
    external: regs.filter((r) => r.category === "External").length,
    today: regs.filter((r) => new Date(r.created_at) >= today).length,
    revenue: regs
      .filter((r) => r.payment_status === "Approved")
      .reduce((s, r) => s + (r.registration_fee || 0), 0),
    pending: regs.filter((r) => r.payment_status === "Pending").length,
    approved: regs.filter((r) => r.payment_status === "Approved").length,
  };

  // Daily for 14 days
  const daily = Array.from({ length: 14 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 13 - i));
    const next = startOfDay(subDays(new Date(), 12 - i));
    const day = regs.filter((r) => new Date(r.created_at) >= d && new Date(r.created_at) < next);
    return {
      date: format(d, "MMM d"),
      registrations: day.length,
      revenue: day.reduce((s, r) => s + (r.registration_fee || 0), 0),
    };
  });

  const byCategory = [
    { name: "Internal", value: stats.internal },
    { name: "External", value: stats.external },
  ];

  const byDept: { name: string; value: number }[] = Object.entries(
    regs.reduce<Record<string, number>>((acc, r) => {
      const k = r.department === "Others" ? r.custom_department || "Others" : r.department;
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ["#7c3aed", "#a855f7", "#facc15", "#22d3ee", "#f97316", "#ec4899"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of FDP registrations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Users}
          label="Total Registrations"
          value={stats.total}
          color="bg-gradient-primary"
        />
        <Stat icon={GraduationCap} label="Internal" value={stats.internal} color="bg-secondary" />
        <Stat
          icon={Building2}
          label="External"
          value={stats.external}
          color="bg-gradient-gold text-gold-foreground"
        />
        <Stat icon={CalendarDays} label="Today" value={stats.today} color="bg-navy text-white" />
        <Stat
          icon={IndianRupee}
          label="Total Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          color="bg-gradient-primary"
        />
        <Stat
          icon={Clock}
          label="Pending Payments"
          value={stats.pending}
          color="bg-destructive text-white"
        />
        <Stat
          icon={CheckCircle2}
          label="Approved Payments"
          value={stats.approved}
          color="bg-emerald-600 text-white"
        />
        <Stat
          icon={Users}
          label="Seats Left"
          value={Math.max(0, (settings?.seat_limit ?? 0) - stats.total)}
          color="bg-secondary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Registrations (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="registrations" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#facc15"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Internal vs External</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  label
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Department-wise</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={byDept}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg text-white ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
