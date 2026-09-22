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
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { usePaymentSettings, useWebsiteSettings } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

export const Route = createFileRoute("/register/")({
  head: () => ({
    meta: [
      { title: "Register — Workshop at GNITS" },
      {
        name: "viewport",
        content: "width=1024, initial-scale=0.38, maximum-scale=3.0, user-scalable=yes",
      },
      {
        name: "description",
        content: "Register for the Workshop on AI Humanoid Robot at GNITS.",
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
});

type FormVals = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const { data: payment } = usePaymentSettings();
  const { data: settings } = useWebsiteSettings();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute('content');
    meta.setAttribute('content', 'width=1024, initial-scale=0.38, maximum-scale=3.0, user-scalable=yes');
    return () => {
      if (prevContent) meta.setAttribute('content', prevContent);
    };
  }, []);

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
  });

  const fee = payment?.internal_fee ?? 250;
  const open = settings?.registration_open ?? true;

  async function onSubmit(values: FormVals) {
    const studentName = values.faculty_name.toUpperCase().trim();
    const rollNumber = values.faculty_id.toUpperCase().trim();

    setSubmitting(true);
    try {
      // Check if registration already exists with this Roll Number via RPC
      const { data: isDuplicate, error: checkErr } = await supabase.rpc(
        "check_duplicate_registration",
        { _roll_number: rollNumber },
      );

      if (checkErr) throw checkErr;
      if (isDuplicate) {
        form.setError("faculty_id", {
          type: "manual",
          message: "This Roll Number has already been registered",
        });
        toast.error("This Roll Number has already submitted a registration!");
        return;
      }

      const regId = `GNITS-WRK-${Math.floor(100000 + Math.random() * 900000)}`;

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
        utr_number: "Pending Payment",
        payment_screenshot_url: null,
        registration_id: regId,
        payment_status: "Pending",
      } as never);
      if (error) throw error;

      toast.success("Successfully registered for the Workshop");
      navigate({ to: "/register/success", search: {} });
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
    toast.error("Please fill all student details correctly.");
  }

  if (!open) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">Registration Closed</h1>
          <p className="mt-3 text-muted-foreground">
            Registrations for this Workshop are currently closed. Please check back later.
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
      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Workshop Banner */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border/40 bg-navy/20 shadow-elegant">
          <img
            src={settings?.hero_banner_url || heroBg}
            alt="Workshop Banner"
            className="w-full h-auto object-contain rounded-2xl"
          />
        </div>

        <div className="mb-8 text-center">
          <Badge className="bg-gradient-primary text-primary-foreground">
            Workshop Registration
          </Badge>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Register for the Workshop</h1>
          <p className="mt-2 text-muted-foreground">
            {settings?.fdp_dates} · {settings?.venue}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          <Card className="animate-fade-in shadow-elegant">
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>All fields are mandatory.</CardDescription>
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
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-primary text-primary-foreground font-bold shadow-elegant mt-4 h-11 text-base cursor-pointer"
              >
                {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Submit Registration
              </Button>
            </CardContent>
          </Card>
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
