import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { usePaymentSettings, useWebsiteSettings, useWorkshops, Workshop } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  IndianRupee,
  Upload,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

export const Route = createFileRoute("/register/")({
  validateSearch: z.object({
    workshop: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Register for Technical Workshop — GNITS" },
      {
        name: "viewport",
        content: "width=1024, initial-scale=0.38, maximum-scale=3.0, user-scalable=yes",
      },
      {
        name: "description",
        content: "Register for technical workshops and workathons organized at GNITS Hyderabad.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  faculty_name: z
    .string()
    .trim()
    .min(2, "Student Name is required")
    .max(100)
    .transform((v) => v.toUpperCase()),
  faculty_id: z
    .string()
    .trim()
    .min(1, "Roll Number is required")
    .max(50)
    .transform((v) => v.toUpperCase()),
  designation: z.enum(["1st Year", "2nd Year", "3rd Year", "4th Year"], {
    errorMap: () => ({ message: "Year is required" }),
  }),
  department: z.enum(["CSE", "CSE(AI&ML)", "CSE(DS)", "IT", "ECE", "EEE"], {
    errorMap: () => ({ message: "Department is required" }),
  }),
  category: z.enum(["Sem I", "Sem II"], {
    errorMap: () => ({ message: "Semester is required" }),
  }),
  institute: z.enum(["A", "B", "C", "D", "E"], {
    errorMap: () => ({ message: "Section is required" }),
  }),
  email: z
    .string()
    .trim()
    .email("Invalid Email")
    .regex(/@gmail\.com$/, "Must be a valid Gmail ID")
    .max(255),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Mobile Number must be exactly 10 digits"),
  utr_number: z
    .string()
    .trim()
    .min(8, "Minimum 8 characters")
    .max(50)
    .transform((v) => v.toUpperCase()),
  declaration: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
});

type FormVals = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const { data: payment } = usePaymentSettings();
  const { data: settings } = useWebsiteSettings();
  const { data: workshops = [], isLoading: loadingWorkshops } = useWorkshops();

  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Set initial selected workshop from URL search param or first workshop
  useEffect(() => {
    if (workshops.length > 0) {
      if (searchParams.workshop) {
        const found = workshops.find(
          (w) => w.slug === searchParams.workshop || w.id === searchParams.workshop,
        );
        if (found) {
          setSelectedSlug(found.slug);
          return;
        }
      }
      if (!selectedSlug) {
        const featured = workshops.find((w) => w.is_featured) || workshops[0];
        setSelectedSlug(featured.slug);
      }
    }
  }, [workshops, searchParams.workshop]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute("content");
    meta.setAttribute(
      "content",
      "width=1024, initial-scale=0.38, maximum-scale=3.0, user-scalable=yes",
    );
    return () => {
      if (prevContent) meta.setAttribute("content", prevContent);
    };
  }, []);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { declaration: undefined as unknown as true },
  });

  const currentWorkshop: Workshop | undefined =
    workshops.find((w) => w.slug === selectedSlug || w.id === selectedSlug) || workshops[0];

  const fee = currentWorkshop?.registration_fee ?? (payment?.internal_fee ?? 250);
  const open = currentWorkshop?.registration_open ?? (settings?.registration_open ?? true);
  const upiId = currentWorkshop?.upi_id || payment?.upi_id;
  const accountName = currentWorkshop?.account_name || payment?.account_name;
  const qrCodeUrl = currentWorkshop?.qr_code_url || payment?.qr_code_url;
  const bannerUrl = currentWorkshop?.hero_banner_url || settings?.hero_banner_url || heroBg;

  async function checkDuplicate(rollNumber: string, workshopIdentifier: string) {
    try {
      // 1. Try RPC with workshop parameter
      const { data, error } = await supabase.rpc("check_duplicate_registration" as any, {
        _roll_number: rollNumber,
        _workshop_identifier: workshopIdentifier,
      });
      if (!error && typeof data === "boolean") {
        return data;
      }
    } catch {
      // Fallback
    }

    try {
      // 2. Direct fallback query against registrations table
      const { data: directData } = await supabase
        .from("registrations")
        .select("id")
        .eq("faculty_id", rollNumber)
        .or(`workshop_slug.eq.${workshopIdentifier},workshop_title.ilike.%${workshopIdentifier}%`)
        .limit(1);

      if (directData && directData.length > 0) {
        return true;
      }
    } catch {
      // Ignore
    }

    return false;
  }

  async function handleNext() {
    const nameVal = (form.getValues("faculty_name") || "").toUpperCase().trim();
    const rollVal = (form.getValues("faculty_id") || "").toUpperCase().trim();
    form.setValue("faculty_name", nameVal);
    form.setValue("faculty_id", rollVal);

    // Validate all fields for Step 1
    const isValid = await form.trigger([
      "faculty_name",
      "faculty_id",
      "designation",
      "department",
      "category",
      "institute",
      "email",
      "phone",
    ]);
    if (!isValid) return;

    if (!currentWorkshop) {
      toast.error("Please select a workshop to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const isDuplicate = await checkDuplicate(rollVal, currentWorkshop.slug);

      if (isDuplicate) {
        form.setError("faculty_id", {
          type: "manual",
          message: `This Roll Number has already registered for "${currentWorkshop.title}"`,
        });
        toast.error(`You have already registered for ${currentWorkshop.title}!`);
        return;
      }

      setStep(2);
    } catch (err) {
      console.warn("Duplicate check error (falling back to step 2):", err);
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(values: FormVals) {
    if (!file) {
      toast.error("Please upload your payment screenshot.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be ≤ 10 MB");
      return;
    }

    const studentName = values.faculty_name.toUpperCase().trim();
    const rollNumber = values.faculty_id.toUpperCase().trim();
    const utrNumber = values.utr_number.toUpperCase().trim();

    if (!currentWorkshop) {
      toast.error("Please select a workshop.");
      return;
    }

    setSubmitting(true);
    try {
      // Re-verify duplicate registration
      const isDuplicate = await checkDuplicate(rollNumber, currentWorkshop.slug);
      if (isDuplicate) {
        form.setError("faculty_id", {
          type: "manual",
          message: `This Roll Number has already registered for this workshop`,
        });
        toast.error(`This Roll Number is already registered for ${currentWorkshop.title}!`);
        setSubmitting(false);
        setStep(1);
        return;
      }

      // Upload payment screenshot
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      // Unique prefix per workshop
      const prefix = currentWorkshop.slug.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "GNIT";
      const regId = `GNITS-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error } = await supabase.from("registrations").insert({
        faculty_name: studentName,
        faculty_id: rollNumber,
        designation: values.designation,
        department: values.department,
        custom_department: null,
        institute: values.institute,
        custom_institute: null,
        email: values.email,
        phone: values.phone,
        category: values.category,
        registration_fee: fee,
        utr_number: utrNumber,
        payment_screenshot_url: path,
        registration_id: regId,
        payment_status: "Approved",
        workshop_id: currentWorkshop.id.startsWith("workshop-") ? null : currentWorkshop.id,
        workshop_slug: currentWorkshop.slug,
        workshop_title: currentWorkshop.title,
      } as never);
      if (error) throw error;

      toast.success(`Successfully registered for ${currentWorkshop.title}`);
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

  function onError(errs: any) {
    console.log("Validation errors:", errs);
    if (
      errs.faculty_name ||
      errs.faculty_id ||
      errs.designation ||
      errs.department ||
      errs.category ||
      errs.institute ||
      errs.email ||
      errs.phone
    ) {
      toast.error("Please fill all student details correctly in Step 1.");
      setStep(1);
    } else {
      toast.error("Please fill payment details and accept declaration.");
    }
  }

  if (loadingWorkshops) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!open) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
          <Badge variant="destructive" className="px-4 py-1.5 font-bold mb-4">
            Registration Closed
          </Badge>
          <h1 className="text-3xl font-bold">{currentWorkshop?.title || "Workshop Registration"}</h1>
          <p className="mt-3 text-muted-foreground">
            Registrations for this workshop are currently closed. You can explore other active workshops on the home page.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
            {workshops.some((w) => w.slug !== currentWorkshop?.slug && w.registration_open) && (
              <Button
                onClick={() => {
                  const alt = workshops.find((w) => w.slug !== currentWorkshop?.slug && w.registration_open);
                  if (alt) setSelectedSlug(alt.slug);
                }}
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold"
              >
                View Other Workshop
              </Button>
            )}
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Workshop Banner */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border/40 bg-navy/20 shadow-elegant">
          <img
            src={bannerUrl}
            alt={currentWorkshop?.title || "Workshop Banner"}
            className="w-full h-auto object-contain rounded-2xl"
          />
        </div>

        {/* Multi-Workshop Switcher Tabs */}
        {workshops.length > 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select Workshop to Register:
              </Label>
              <span className="text-xs text-amber-500 font-semibold">
                Multiple registrations supported
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workshops.map((ws) => {
                const isSelected = (currentWorkshop?.slug === ws.slug);
                return (
                  <button
                    key={ws.slug}
                    type="button"
                    onClick={() => {
                      setSelectedSlug(ws.slug);
                      setStep(1); // Return to step 1 on workshop switch
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/10 shadow-lg ring-1 ring-amber-400/50"
                        : "border-border/60 bg-card/60 hover:border-amber-400/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          isSelected ? "border-amber-400 text-amber-400 bg-amber-400/10" : "text-muted-foreground"
                        }`}
                      >
                        {ws.department || "GNITS"}
                      </Badge>
                      <div className="flex items-center text-xs font-black text-amber-400">
                        <IndianRupee className="h-3 w-3" />
                        {ws.registration_fee}
                      </div>
                    </div>
                    <div className="font-bold text-sm text-foreground mt-2 line-clamp-1">
                      {ws.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-amber-400 shrink-0" /> {ws.dates}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-amber-400">
                        <CheckCircle2 className="h-4 w-4 fill-amber-400 text-background" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8 text-center">
          <Badge className="bg-gradient-primary text-primary-foreground font-semibold">
            {currentWorkshop?.department || "Technical"} Workshop Registration
          </Badge>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
            {currentWorkshop?.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentWorkshop?.dates} · {currentWorkshop?.venue}
          </p>

          {/* Step indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div
              className={`h-2.5 w-16 rounded-full transition-colors duration-300 ${
                step === 1 ? "bg-primary" : "bg-muted"
              }`}
            />
            <div
              className={`h-2.5 w-16 rounded-full transition-colors duration-300 ${
                step === 2 ? "bg-primary" : "bg-muted"
              }`}
            />
          </div>
          <div className="mt-2 text-xs text-muted-foreground font-semibold">
            {step === 1 ? "Step 1: Student Details" : "Step 2: Payment Details"}
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          {step === 1 ? (
            <Card className="animate-fade-in shadow-elegant">
              <CardHeader>
                <CardTitle>Student Details</CardTitle>
                <CardDescription>
                  All fields are mandatory. You may register for multiple workshops with the same Roll Number.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Student Name" error={form.formState.errors.faculty_name?.message}>
                    <Input
                      {...form.register("faculty_name")}
                      placeholder="ENTER STUDENT NAME"
                      className="uppercase placeholder:normal-case font-semibold tracking-wide"
                      onChange={(e) => {
                        form.setValue("faculty_name", e.target.value.toUpperCase(), {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </Field>
                  <Field label="Roll Number" error={form.formState.errors.faculty_id?.message}>
                    <Input
                      {...form.register("faculty_id")}
                      placeholder="ENTER ROLL NUMBER"
                      className="uppercase placeholder:normal-case font-semibold tracking-wide"
                      onChange={(e) => {
                        form.setValue("faculty_id", e.target.value.toUpperCase(), {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Department" error={form.formState.errors.department?.message}>
                    <Select
                      onValueChange={(v) =>
                        form.setValue("department", v as FormVals["department"], {
                          shouldValidate: true,
                        })
                      }
                      value={form.watch("department")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {["CSE", "CSE(AI&ML)", "CSE(DS)", "IT", "ECE", "EEE"].map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Year" error={form.formState.errors.designation?.message}>
                    <Select
                      onValueChange={(v) =>
                        form.setValue("designation", v as FormVals["designation"], {
                          shouldValidate: true,
                        })
                      }
                      value={form.watch("designation")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Semester" error={form.formState.errors.category?.message}>
                    <Select
                      onValueChange={(v) =>
                        form.setValue("category", v as FormVals["category"], {
                          shouldValidate: true,
                        })
                      }
                      value={form.watch("category")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Sem I", "Sem II"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Section" error={form.formState.errors.institute?.message}>
                    <Select
                      onValueChange={(v) =>
                        form.setValue("institute", v as FormVals["institute"], {
                          shouldValidate: true,
                        })
                      }
                      value={form.watch("institute")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D", "E"].map((sec) => (
                          <SelectItem key={sec} value={sec}>
                            Section {sec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gmail ID" error={form.formState.errors.email?.message}>
                    <Input
                      type="email"
                      {...form.register("email")}
                      placeholder="username@gmail.com"
                    />
                  </Field>
                  <Field label="Mobile Number" error={form.formState.errors.phone?.message}>
                    <Input {...form.register("phone")} placeholder="10-digit number" />
                  </Field>
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-gradient-primary text-primary-foreground font-bold shadow-elegant mt-2"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-secondary/40 bg-gradient-to-br from-accent to-background shadow-elegant">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Registration Fee
                    </div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">
                      {currentWorkshop?.title}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-3xl font-black text-secondary">
                      <IndianRupee className="h-6 w-6" />
                      {fee}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>
                    Scan & pay using the QR or UPI ID below, then enter your UTR and upload screenshot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-4">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="h-40 w-40 object-contain"
                        />
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
                        <div className="font-mono font-semibold">{upiId || "—"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Name</Label>
                        <div className="font-semibold">{accountName || "—"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Event Name</Label>
                        <div className="font-semibold text-amber-500 text-xs">
                          {currentWorkshop?.title}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Field
                    label="UTR / Transaction Number"
                    error={form.formState.errors.utr_number?.message}
                  >
                    <Input
                      {...form.register("utr_number")}
                      placeholder="Minimum 8 characters"
                      className="uppercase placeholder:normal-case font-semibold tracking-wide"
                      onChange={(e) => {
                        form.setValue("utr_number", e.target.value.toUpperCase(), {
                          shouldValidate: true,
                        });
                      }}
                    />
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
                        className="mt-2 block w-full text-sm mx-auto max-w-xs"
                      />
                      {file && (
                        <div className="mt-2 text-xs text-muted-foreground font-semibold">
                          {file.name} ({(file.size / 1024).toFixed(0)} KB)
                        </div>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, JPEG, PNG, PDF · max 10 MB
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-sm cursor-pointer select-none py-1">
                    <Checkbox
                      checked={!!form.watch("declaration")}
                      onCheckedChange={(v) =>
                        form.setValue("declaration", v ? true : (undefined as unknown as true), {
                          shouldValidate: true,
                        })
                      }
                    />
                    <span className="leading-none text-muted-foreground text-xs">
                      I hereby declare that all information provided is correct and the payment is genuine for {currentWorkshop?.title}.
                    </span>
                  </label>
                  {form.formState.errors.declaration && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.declaration.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 font-bold"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-primary text-primary-foreground font-bold shadow-elegant"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register for {currentWorkshop?.slug === "agentic-ai-cloud" ? "Agentic AI" : "Workshop"}
                </Button>
              </div>
            </div>
          )}
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
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
