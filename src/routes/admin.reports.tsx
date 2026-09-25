import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegistrations, useWorkshops } from "@/lib/queries";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileSpreadsheet, FileText, Download } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: regs = [] } = useRegistrations();
  const { data: workshops = [] } = useWorkshops();
  const [workshopFilter, setWorkshopFilter] = useState("all");
  const [range, setRange] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const now = new Date();
    return regs.filter((r) => {
      if (workshopFilter !== "all") {
        const wSlug = r.workshop_slug || "";
        const wTitle = r.workshop_title || "";
        if (wSlug !== workshopFilter && !wTitle.toLowerCase().includes(workshopFilter.toLowerCase())) {
          return false;
        }
      }
      const d = new Date(r.created_at);
      if (range === "today") return d >= startOfDay(now);
      if (range === "week") return d >= startOfWeek(now);
      if (range === "month") return d >= startOfMonth(now);
      if (range === "custom") {
        if (from && d < new Date(from)) return false;
        if (to && d > new Date(new Date(to).getTime() + 86400000)) return false;
      }
      return true;
    });
  }, [regs, workshopFilter, range, from, to]);

  function getExportData() {
    return filtered.map((r, index) => ({
      "S.No": index + 1,
      Workshop: r.workshop_title || "AI Humanoid Robot",
      "Roll Number": r.faculty_id,
      "Student Name": r.faculty_name,
      Year: r.designation,
      Department: r.department,
      Semester: r.category,
      Section: r.institute,
      "Gmail ID": r.email,
      "Mobile Number": r.phone,
      "Payment Details":
        r.utr_number && r.utr_number !== "Pending Payment" && r.utr_number !== "PENDING"
          ? `UTR: ${r.utr_number}`
          : "Pending Payment",
      "Payment Status": r.payment_status === "Pending" ? "Pending Payment" : r.payment_status,
      "Registration ID": r.registration_id,
      "Date & Time": new Date(r.created_at).toLocaleString(),
    }));
  }

  function excel() {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `workshop-report-${Date.now()}.xlsx`);
  }

  function csv() {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const c = XLSX.utils.sheet_to_csv(ws);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([c], { type: "text/csv" }));
    a.download = `workshop-report-${Date.now()}.csv`;
    a.click();
  }

  function pdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("GNITS Workshop — Report", 14, 14);
    autoTable(doc, {
      startY: 20,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [124, 58, 237] },
      head: [
        [
          "Reg ID",
          "Workshop",
          "Roll Number",
          "Student Name",
          "Year",
          "Dept",
          "Sem",
          "Sec",
          "Payment Details",
          "Status",
          "Date & Time",
        ],
      ],
      body: filtered.map((r) => [
        r.registration_id,
        r.workshop_slug === "agentic-ai-cloud" ? "Agentic AI" : (r.workshop_title ? (r.workshop_title.length > 20 ? r.workshop_title.slice(0, 20) + "..." : r.workshop_title) : "AI Humanoid"),
        r.faculty_id,
        r.faculty_name,
        r.designation,
        r.department,
        r.category,
        r.institute,
        r.utr_number && r.utr_number !== "Pending Payment" && r.utr_number !== "PENDING"
          ? `UTR: ${r.utr_number}`
          : "Pending Payment",
        r.payment_status === "Pending" ? "Pending Payment" : r.payment_status,
        new Date(r.created_at).toLocaleString(),
      ]),
    });
    doc.save(`workshop-report-${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Export filtered registration data.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>{filtered.length} records match the current filter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Label>Workshop</Label>
              <Select value={workshopFilter} onValueChange={setWorkshopFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Workshops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workshops</SelectItem>
                  {workshops.map((ws) => (
                    <SelectItem key={ws.slug} value={ws.slug}>
                      {ws.slug === "agentic-ai-cloud" ? "Agentic AI Workshop" : ws.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {range === "custom" && (
              <>
                <div>
                  <Label>From</Label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <Label>To</Label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={excel} className="bg-gradient-primary">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button onClick={csv} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button onClick={pdf} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
