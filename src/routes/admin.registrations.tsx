import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useRegistrations } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileText as FileIcon,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/admin/registrations")({
  component: RegistrationsPage,
});

function RegistrationsPage() {
  const qc = useQueryClient();
  const { data: regs = [], isLoading } = useRegistrations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pageSize = 15;

  const filtered = useMemo(
    () =>
      regs.filter((r) => {
        const q = search.trim().toLowerCase();
        if (
          q &&
          !`${r.registration_id} ${r.faculty_name} ${r.email} ${r.phone || ""} ${r.faculty_id} ${r.utr_number} ${r.designation}`
            .toLowerCase()
            .includes(q)
        )
          return false;
        if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
        if (semesterFilter !== "all" && r.category !== semesterFilter) return false;
        if (yearFilter !== "all" && r.designation !== yearFilter) return false;
        if (departmentFilter !== "all" && r.department !== departmentFilter) return false;
        if (sectionFilter !== "all" && r.institute !== sectionFilter) return false;
        return true;
      }),
    [regs, search, statusFilter, semesterFilter, yearFilter, departmentFilter, sectionFilter],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function viewScreenshot(path: string) {
    const { data, error } = await supabase.storage
      .from("payment-screenshots")
      .createSignedUrl(path, 300);
    if (error || !data) return toast.error("Couldn't open file");
    window.open(data.signedUrl, "_blank");
  }

  async function setStatus(id: string, payment_status: string) {
    const { error } = await supabase.from("registrations").update({ payment_status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["registrations"] });
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this registration?")) return;
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["registrations"] });
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} registrations?`)) return;
    const { error } = await supabase.from("registrations").delete().in("id", Array.from(selected));
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["registrations"] });
    }
  }

  function getExportData() {
    return filtered.map((r, index) => ({
      "S.No": index + 1,
      "Roll Number": r.faculty_id,
      "Student Name": r.faculty_name,
      Year: r.designation,
      Department: r.department,
      Semester: r.category,
      Section: r.institute,
      "Gmail ID": r.email,
      "Mobile Number": r.phone,
      Fee: r.registration_fee,
      "UTR Number": r.utr_number,
      "Payment Status": r.payment_status,
      "Registration ID": r.registration_id,
      Date: new Date(r.created_at).toLocaleDateString(),
    }));
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, "registrations.xlsx");
  }

  type CSVRow = Record<string, string | number>;

  function exportCSV() {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "registrations.csv";
    a.click();
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("GNITS Workshop — Registrations", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [
        [
          "S.No",
          "Roll Number",
          "Student Name",
          "Year",
          "Dept",
          "Sem",
          "Sec",
          "Fee",
          "UTR",
          "Status",
          "Date",
        ],
      ],
      body: filtered.map((r, index) => [
        index + 1,
        r.faculty_id,
        r.faculty_name,
        r.designation,
        r.department,
        r.category,
        r.institute,
        `₹${r.registration_fee}`,
        r.utr_number,
        r.payment_status,
        new Date(r.created_at).toLocaleDateString(),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [124, 58, 237] },
    });
    doc.save("registrations.pdf");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Workshop Responses</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {regs.length} registrations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileIcon className="mr-2 h-4 w-4" />
            PDF
          </Button>
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={bulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selected.size}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Input
              placeholder="Search by name, roll no, UTR…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={departmentFilter}
              onValueChange={(v) => {
                setDepartmentFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="CSE">CSE</SelectItem>
                <SelectItem value="CSE(AI&ML)">CSE(AI&ML)</SelectItem>
                <SelectItem value="CSE(DS)">CSE(DS)</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="ECE">ECE</SelectItem>
                <SelectItem value="EEE">EEE</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={yearFilter}
              onValueChange={(v) => {
                setYearFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1st Year">1st Year</SelectItem>
                <SelectItem value="2nd Year">2nd Year</SelectItem>
                <SelectItem value="3rd Year">3rd Year</SelectItem>
                <SelectItem value="4th Year">4th Year</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={semesterFilter}
              onValueChange={(v) => {
                setSemesterFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="Sem I">Sem I</SelectItem>
                <SelectItem value="Sem II">Sem II</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sectionFilter}
              onValueChange={(v) => {
                setSectionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="A">Section A</SelectItem>
                <SelectItem value="B">Section B</SelectItem>
                <SelectItem value="C">Section C</SelectItem>
                <SelectItem value="D">Section D</SelectItem>
                <SelectItem value="E">Section E</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      checked={pageData.length > 0 && pageData.every((r) => selected.has(r.id))}
                      onChange={(e) => {
                        const ns = new Set(selected);
                        if (e.target.checked) pageData.forEach((r) => ns.add(r.id));
                        else pageData.forEach((r) => ns.delete(r.id));
                        setSelected(ns);
                      }}
                    />
                  </TableHead>
                  <TableHead>S.No</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Sem</TableHead>
                  <TableHead>Sec</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>UTR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : pageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
                      No registrations.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageData.map((r, index) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={(e) => {
                            const ns = new Set(selected);
                            if (e.target.checked) ns.add(r.id);
                            else ns.delete(r.id);
                            setSelected(ns);
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-sm">{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{r.faculty_id}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{r.faculty_name}</div>
                        <div className="text-xs text-secondary font-semibold">{r.designation}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {r.email} · {r.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.department}</TableCell>
                      <TableCell className="text-sm">{r.category}</TableCell>
                      <TableCell className="text-sm font-semibold">Section {r.institute}</TableCell>
                      <TableCell className="text-sm">₹{r.registration_fee}</TableCell>
                      <TableCell className="font-mono text-xs">{r.utr_number}</TableCell>
                      <TableCell>
                        <Select value={r.payment_status} onValueChange={(v) => setStatus(r.id, v)}>
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {r.payment_screenshot_url && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => viewScreenshot(r.payment_screenshot_url!)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => deleteOne(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
