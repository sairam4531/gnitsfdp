import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegistrations } from "@/lib/queries";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { format, startOfDay, subDays, startOfWeek } from "date-fns";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: regs = [] } = useRegistrations();
  const COLORS = ["#7c3aed", "#a855f7", "#facc15", "#22d3ee", "#f97316", "#ec4899", "#10b981"];

  const daily = Array.from({ length: 30 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 29 - i));
    const next = startOfDay(subDays(new Date(), 28 - i));
    const day = regs.filter((r) => new Date(r.created_at) >= d && new Date(r.created_at) < next);
    return {
      date: format(d, "MMM d"),
      count: day.length,
      revenue: day.reduce((s, r) => s + (r.registration_fee || 0), 0),
    };
  });

  const weekly = Array.from({ length: 8 }).map((_, i) => {
    const w = startOfWeek(subDays(new Date(), (7 - i) * 7));
    const next = startOfWeek(subDays(new Date(), (6 - i) * 7));
    const week = regs.filter((r) => new Date(r.created_at) >= w && new Date(r.created_at) < next);
    return { week: format(w, "MMM d"), count: week.length };
  });

  const dept = Object.entries(
    regs.reduce<Record<string, number>>((a, r) => {
      const k = r.department === "Others" ? r.custom_department || "Others" : r.department;
      a[k] = (a[k] || 0) + 1;
      return a;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const inst = Object.entries(
    regs.reduce<Record<string, number>>((a, r) => {
      const k = r.institute === "Others" ? r.custom_institute || "Others" : "GNITS";
      a[k] = (a[k] || 0) + 1;
      return a;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const cat = [
    { name: "Internal", value: regs.filter((r) => r.category === "Internal").length },
    { name: "External", value: regs.filter((r) => r.category === "External").length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Detailed registration analytics.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily Registrations (30 days)">
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Weekly Trend (8 weeks)">
          <LineChart data={weekly}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="week" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2.5} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Revenue Trend (30 days)">
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#facc15" strokeWidth={2.5} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Internal vs External">
          <PieChart>
            <Pie data={cat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
              {cat.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartCard>
        <ChartCard title="Department-wise">
          <BarChart data={dept}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Institute-wise">
          <BarChart data={inst} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" fontSize={10} allowDecimals={false} />
            <YAxis dataKey="name" type="category" fontSize={10} width={120} />
            <Tooltip />
            <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
