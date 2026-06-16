import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegistrations } from "@/lib/queries";
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
  const [range, setRange] = useState("all");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const now = new Date();
    return regs.filter(r => {
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
  }, [regs, range, from, to]);

  function excel() {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `fdp-report-${Date.now()}.xlsx`);
  }
  function csv() {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const c = XLSX.utils.sheet_to_csv(ws);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([c], { type: "text/csv" })); a.download = `fdp-report-${Date.now()}.csv`; a.click();
  }
  function pdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("GNITS FDP — Report", 14, 14);
    autoTable(doc, {
      startY: 20, styles: { fontSize: 7 }, headStyles: { fillColor: [124, 58, 237] },
      head: [["Reg ID", "Name", "Dept", "Institute", "Category", "Fee", "Status", "Date"]],
      body: filtered.map(r => [
        r.registration_id, r.faculty_name,
        r.department === "Others" ? r.custom_department : r.department,
        r.institute === "Others" ? r.custom_institute : "GNITS",
        r.category, `₹${r.registration_fee}`, r.payment_status, new Date(r.created_at).toLocaleDateString(),
      ]),
    });
    doc.save(`fdp-report-${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-sm text-muted-foreground">Export filtered registration data.</p></div>
      <Card>
        <CardHeader><CardTitle>Filter</CardTitle><CardDescription>{filtered.length} records match the current filter.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Date Range</Label>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={excel} className="bg-gradient-primary"><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
            <Button onClick={csv} variant="outline"><Download className="mr-2 h-4 w-4" />CSV</Button>
            <Button onClick={pdf} variant="outline"><FileText className="mr-2 h-4 w-4" />PDF</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
