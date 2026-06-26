import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { usePaymentSettings, useWebsiteSettings } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, IndianRupee, Upload, QrCode } from "lucide-react";

export const Route = createFileRoute("/register/")({
  head: () => ({
    meta: [
      { title: "Register — FDP at GNITS" },
      {
        name: "description",
        content: "Register for the One Week FDP on Smart Data Visualization at GNITS.",
      },
    ],
  }),
  component: RegisterPage,
});

const GNITS_NAME = "G. Narayanamma Institute of Technology and Science";

const schema = z
  .object({
    faculty_name: z.string().trim().min(2, "Required").max(100),
    faculty_id: z.string().trim().min(1, "Required").max(50),
    designation: z.enum([
      "Professor",
      "Associate Professor",
      "Assistant Professor",
      "Teaching Assistant",
      "Programmer",
    ]),
    department: z.enum([
      "CSE",
      "CSE (AI & ML)",
      "CSE (Data Science)",
      "IT",
      "ECE",
      "EEE",
      "Others",
    ]),
    custom_department: z.string().trim().max(100).optional(),
    institute: z.enum([GNITS_NAME, "Others"]),
    custom_institute: z.string().trim().max(150).optional(),
    email: z.string().trim().email().max(255),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{10,20}$/, "Invalid mobile number"),
    utr_number: z.string().trim().min(8, "Minimum 8 characters").max(50),
    declaration: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  })
  .refine(
    (d) => d.department !== "Others" || (d.custom_department && d.custom_department.length > 0),
    {
      message: "Department name required",
      path: ["custom_department"],
    },
  )
  .refine(
    (d) => d.institute !== "Others" || (d.custom_institute && d.custom_institute.length > 0),
    {
      message: "Institute name required",
      path: ["custom_institute"],
    },
  );

type FormVals = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const { data: payment } = usePaymentSettings();
  const { data: settings } = useWebsiteSettings();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { declaration: undefined as unknown as true },
  });

  const institute = form.watch("institute");
  const department = form.watch("department");

  const isInternal = institute === GNITS_NAME;
  const category = isInternal ? "Internal" : "External";
  const fee = isInternal ? (payment?.internal_fee ?? 250) : (payment?.external_fee ?? 500);
  const open = settings?.registration_open ?? true;

  async function onSubmit(values: FormVals) {
    if (!file) {
      toast.error("Please upload your payment screenshot.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be ≤ 10 MB");
      return;
    }
    setSubmitting(true);
    try {
      // Check if registration already exists with this Faculty ID
      const { data: existing, error: checkErr } = await supabase
        .from("registrations")
        .select("id")
        .eq("faculty_id", values.faculty_id.trim())
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (existing) {
        toast.error("You have already submitted!");
        setSubmitting(false);
        return;
      }

      // upload screenshot
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const regId = `GNITS-FDP-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error } = await supabase.from("registrations").insert({
        faculty_name: values.faculty_name,
        faculty_id: values.faculty_id,
        designation: values.designation,
        department: values.department,
        custom_department: values.custom_department || null,
        institute: values.institute,
        custom_institute: values.custom_institute || null,
        email: values.email,
        phone: values.phone,
        category,
        registration_fee: fee,
        utr_number: values.utr_number,
        payment_screenshot_url: path,
        registration_id: regId,
        payment_status: "Approved",
      } as never);
      if (error) throw error;

      toast.success("Successfully registered for FDP");
      navigate({ to: "/register/success", search: { id: regId } });
    } catch (e: any) {
      console.error("Submission error details:", e);
      const msg =
        e?.message || (typeof e === "string" ? e : JSON.stringify(e)) || "Failed to submit";
      toast.error(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  const onError = (errors: any) => {
    const errorMessages = Object.entries(errors)
      .map(([key, value]: [string, any]) => {
        const fieldName = key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
        return `${fieldName}: ${value.message}`;
      })
      .join(", ");
    toast.error(`Please correct the errors: ${errorMessages}`);
  };

  if (!open) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">Registration Closed</h1>
          <p className="mt-3 text-muted-foreground">
            Registrations for this FDP are currently closed. Please check back later.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 text-center">
          <Badge className="bg-gradient-primary text-primary-foreground">FDP Registration</Badge>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Register for the FDP</h1>
          <p className="mt-2 text-muted-foreground">
            {settings?.fdp_dates} · {settings?.venue}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Faculty Name" error={form.formState.errors.faculty_name?.message}>
                <Input {...form.register("faculty_name")} placeholder="Enter Your Name" />
              </Field>
              <Field label="Faculty ID" error={form.formState.errors.faculty_id?.message}>
                <Input {...form.register("faculty_id")} placeholder="Enter Your ID" />
              </Field>
              <Field label="Designation" error={form.formState.errors.designation?.message}>
                <Select
                  onValueChange={(v) =>
                    form.setValue("designation", v as FormVals["designation"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professor">Professor</SelectItem>
                    <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                    <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                    <SelectItem value="Teaching Assistant">Teaching Assistant</SelectItem>
                    <SelectItem value="Programmer">Programmer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Department" error={form.formState.errors.department?.message}>
                <Select
                  onValueChange={(v) =>
                    form.setValue("department", v as FormVals["department"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "CSE",
                      "CSE (AI & ML)",
                      "CSE (Data Science)",
                      "IT",
                      "ECE",
                      "EEE",
                      "Others",
                    ].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {department === "Others" && (
                <Field
                  label="Department Name"
                  error={form.formState.errors.custom_department?.message}
                >
                  <Input
                    {...form.register("custom_department")}
                    placeholder="Enter department name"
                  />
                </Field>
              )}
              <Field
                label="Institute / Organization"
                error={form.formState.errors.institute?.message}
              >
                <Select
                  onValueChange={(v) =>
                    form.setValue("institute", v as FormVals["institute"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select institute" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GNITS_NAME}>{GNITS_NAME}</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {institute === "Others" && (
                <Field
                  label="Institute Name"
                  error={form.formState.errors.custom_institute?.message}
                >
                  <Input
                    {...form.register("custom_institute")}
                    placeholder="Enter institute name"
                  />
                </Field>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" error={form.formState.errors.email?.message}>
                  <Input type="email" {...form.register("email")} placeholder="you@example.com" />
                </Field>
                <Field label="Mobile Number" error={form.formState.errors.phone?.message}>
                  <Input {...form.register("phone")} placeholder="+91 9XXXXXXXXX" />
                </Field>
              </div>
            </CardContent>
          </Card>

          {institute && (
            <Card className="border-secondary/40 bg-gradient-to-br from-accent to-background shadow-elegant">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Registration Category
                  </div>
                  <div className="text-2xl font-bold">{category}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Registration Fee
                  </div>
                  <div className="flex items-center text-3xl font-black text-secondary">
                    <IndianRupee className="h-6 w-6" />
                    {fee}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>
                Scan & pay using the QR or UPI ID below, then enter your UTR and upload screenshot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-4">
                  {payment?.qr_code_url ? (
                    <img src={payment.qr_code_url} alt="QR" className="h-40 w-40 object-contain" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <QrCode className="mx-auto h-10 w-10" />
                      <div className="mt-2 text-xs">QR not configured</div>
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">UPI ID</Label>
                    <div className="font-mono font-semibold">{payment?.upi_id || "—"}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Account Name</Label>
                    <div className="font-semibold">{payment?.account_name || "—"}</div>
                  </div>
                </div>
              </div>

              <Field
                label="UTR / Transaction Number"
                error={form.formState.errors.utr_number?.message}
              >
                <Input {...form.register("utr_number")} placeholder="Minimum 8 characters" />
              </Field>

              <div>
                <Label>
                  Payment Screenshot <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1 rounded-lg border border-dashed p-4 text-center">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="mt-2 block w-full text-sm"
                  />
                  {file && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, JPEG, PNG, PDF · max 10 MB
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={!!form.watch("declaration")}
                  onCheckedChange={(v) =>
                    form.setValue("declaration", v ? true : (undefined as unknown as true), {
                      shouldValidate: true,
                    })
                  }
                />
                <span>I hereby declare that all information provided is correct.</span>
              </label>
              {form.formState.errors.declaration && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.declaration.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full bg-gradient-primary text-primary-foreground font-bold shadow-elegant"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Registration
          </Button>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} <span className="text-destructive">*</span>
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
