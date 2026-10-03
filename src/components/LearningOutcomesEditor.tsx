import React, { useState, useEffect } from "react";
import {
  Workshop,
  WorkshopOutcomeItem,
  getDefaultOutcomesForWorkshop,
  saveLocalWorkshopOutcomes,
  saveLocalCustomWorkshop,
} from "@/lib/queries";
import {
  AVAILABLE_OUTCOME_ICONS,
  getOutcomeIcon,
} from "@/components/OutcomeIcons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Check,
  ExternalLink,
  Eye,
  Sparkles,
  Loader2,
} from "lucide-react";

interface LearningOutcomesEditorProps {
  workshop: Workshop;
  onSaved?: () => void;
}

export function LearningOutcomesEditor({
  workshop,
  onSaved,
}: LearningOutcomesEditorProps) {
  const qc = useQueryClient();

  const [outcomes, setOutcomes] = useState<WorkshopOutcomeItem[]>(() => {
    if (workshop.outcomes && workshop.outcomes.length > 0) {
      return workshop.outcomes;
    }
    return getDefaultOutcomesForWorkshop(workshop);
  });

  const [saving, setSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Sync if workshop changes
  useEffect(() => {
    if (workshop.outcomes && workshop.outcomes.length > 0) {
      setOutcomes(workshop.outcomes);
    } else {
      setOutcomes(getDefaultOutcomesForWorkshop(workshop));
    }
  }, [workshop.slug, workshop.outcomes]);

  const updateField = (
    index: number,
    field: keyof WorkshopOutcomeItem,
    value: string
  ) => {
    setOutcomes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addOutcome = () => {
    const newItem: WorkshopOutcomeItem = {
      id: `outcome-${Date.now()}`,
      icon: "Target",
      title: "New Learning Outcome",
      desc: "Detailed description of what participants will gain from this workshop.",
    };
    setOutcomes((prev) => [...prev, newItem]);
    toast.info("Added new outcome card. Remember to save changes.");
  };

  const removeOutcome = (index: number) => {
    if (outcomes.length <= 1) {
      toast.error("You must have at least one outcome card.");
      return;
    }
    setOutcomes((prev) => prev.filter((_, i) => i !== index));
  };

  const moveOutcome = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= outcomes.length) return;

    setOutcomes((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const resetToDefaults = () => {
    if (
      confirm(
        `Reset learning outcomes for "${workshop.title}" to default template?`
      )
    ) {
      const defaults = getDefaultOutcomesForWorkshop(workshop);
      setOutcomes(defaults);
      toast.info("Reset to default outcome cards. Click Save to persist.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate
      for (let i = 0; i < outcomes.length; i++) {
        if (!outcomes[i].title.trim()) {
          toast.error(`Outcome #${i + 1} requires a title.`);
          setSaving(false);
          return;
        }
      }

      // Persist per-workshop outcomes
      saveLocalWorkshopOutcomes(workshop.slug, outcomes);
      saveLocalCustomWorkshop({ ...workshop, outcomes });

      await qc.invalidateQueries({ queryKey: ["workshops"] });
      toast.success(
        `Learning outcomes for "${workshop.title}" saved successfully!`
      );
      if (onSaved) onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save outcomes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold text-xs uppercase">
                  Landing Page Editor
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {outcomes.length} Outcome Cards
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                Learning Outcomes: {workshop.title}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Customize the &quot;What You&apos;ll Gain &amp; Master&quot; section displayed specifically for this workshop.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/${workshop.slug}#outcomes`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 border rounded-lg transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Public Site
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLivePreview(!showLivePreview)}
                className="text-xs"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                {showLivePreview ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset Defaults
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Outcomes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Outcome Cards List */}
      <div className="grid gap-4 md:grid-cols-2">
        {outcomes.map((item, index) => {
          const IconComp = getOutcomeIcon(item.icon);

          return (
            <Card
              key={item.id || index}
              className="border shadow-sm rounded-xl overflow-hidden hover:border-amber-400/50 transition-all bg-card/60 backdrop-blur-sm"
            >
              <CardHeader className="py-3 px-4 bg-muted/40 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    Outcome #{index + 1}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => moveOutcome(index, "up")}
                    disabled={index === 0}
                    title="Move Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => moveOutcome(index, "down")}
                    disabled={index === outcomes.length - 1}
                    title="Move Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => removeOutcome(index)}
                    title="Delete Outcome"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-[auto_1fr] items-start">
                  {/* Icon Selector with Preview */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-semibold">
                      Icon
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-bold">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <Select
                        value={item.icon}
                        onValueChange={(val) => updateField(index, "icon", val)}
                      >
                        <SelectTrigger className="w-[140px] text-xs h-10">
                          <SelectValue placeholder="Choose Icon" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {AVAILABLE_OUTCOME_ICONS.map((opt) => {
                            const OptIcon = opt.icon;
                            return (
                              <SelectItem key={opt.id} value={opt.id}>
                                <div className="flex items-center gap-2 text-xs">
                                  <OptIcon className="h-3.5 w-3.5 text-amber-500" />
                                  <span>{opt.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Title Field */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-semibold">
                      Outcome Title *
                    </Label>
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        updateField(index, "title", e.target.value)
                      }
                      placeholder="e.g. Core Architecture & Foundations"
                      className="font-bold text-sm h-10"
                    />
                  </div>
                </div>

                {/* Description Field */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-semibold">
                    Description
                  </Label>
                  <Textarea
                    rows={2}
                    value={item.desc}
                    onChange={(e) => updateField(index, "desc", e.target.value)}
                    placeholder="Describe what knowledge, skills, or practical hands-on experience participants gain..."
                    className="text-xs leading-relaxed resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Outcome Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={addOutcome}
          className="border-dashed border-2 hover:border-amber-500 text-xs font-bold"
        >
          <Plus className="mr-1.5 h-4 w-4 text-amber-500" />
          Add Another Outcome Card
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 px-6"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Learning Outcomes
            </>
          )}
        </Button>
      </div>

      {/* Live Landing Page Preview Section */}
      {showLivePreview && (
        <div className="pt-8 border-t space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-lg font-bold tracking-tight">
                  Live Public Page Preview
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                This is how the section appears to students visiting{" "}
                <span className="font-mono text-foreground font-semibold">
                  /{workshop.slug}#outcomes
                </span>
                .
              </p>
            </div>
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
              Real-time Preview
            </Badge>
          </div>

          <div className="rounded-2xl border bg-slate-950/5 dark:bg-slate-900/40 p-6 sm:p-10 shadow-inner">
            <div className="mb-10 text-center">
              <Badge className="border-indigo-400/40 bg-indigo-400/10 text-indigo-500 font-extrabold px-4 py-1.5 rounded-full text-xs uppercase tracking-widest">
                Learning Outcomes
              </Badge>
              <h2 className="mt-4 text-2xl sm:text-4xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-300 dark:via-purple-200 dark:to-pink-300 bg-clip-text text-transparent">
                  What You&apos;ll Gain &amp; Master
                </span>
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {outcomes.map((o) => {
                const Icon = getOutcomeIcon(o.icon);
                return (
                  <Card
                    key={o.id || o.title}
                    className="group h-full rounded-2xl border-amber-400/20 bg-card/90 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/10"
                  >
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20">
                        <Icon className="h-6 w-6 font-bold" />
                      </div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-amber-500 transition-colors">
                        {o.title || "Untitled Outcome"}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                        {o.desc || "No description provided."}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
