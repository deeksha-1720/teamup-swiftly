import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RetroFlower, RetroSparkle } from "@/components/retro-decorations";
import { Sparkles, ArrowRight, ArrowLeft, Sliders, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/find")({
  head: () => ({
    meta: [
      { title: "Find teammates — ProjectMatch" },
      {
        name: "description",
        content:
          "Set your search criteria to find the right collaborators for your project.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FindPage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "Project type",
  "Role & experience",
  "Work setup",
  "What matters most",
];

const ROLE_CATEGORIES = ["Developer", "Designer", "Data/ML", "Product", "Other"];

const IMPORTANCE_LEVELS = ["High", "Medium", "Low"] as const;
type Importance = (typeof IMPORTANCE_LEVELS)[number];

type RankingKey =
  | "skillsMatch"
  | "availabilityMatch"
  | "experienceFit"
  | "sharedInterests";

const RANKING_FACTORS: {
  key: RankingKey;
  label: string;
  description: string;
}[] = [
  {
    key: "skillsMatch",
    label: "Skills match",
    description: "How closely their skills align with what you need",
  },
  {
    key: "availabilityMatch",
    label: "Availability match",
    description: "Whether their schedule fits your project timeline",
  },
  {
    key: "experienceFit",
    label: "Experience fit",
    description: "Years of experience relative to your requirement",
  },
  {
    key: "sharedInterests",
    label: "Shared interests",
    description: "Overlap in project interests and domains",
  },
];

const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Python",
  "Node.js",
  "Figma",
  "UI/UX",
  "Machine Learning",
  "SQL",
  "Flutter",
  "AWS",
  "Data Analysis",
  "Product Management",
];

const INTEREST_SUGGESTIONS = [
  "Web apps",
  "AI/ML",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Climate",
  "Gaming",
  "Social impact",
  "Open source",
  "Startups",
];

// ─── Exported types & storage key ────────────────────────────────────────────

type ProjectType = "college" | "industry";
type WorkMode = "remote" | "in-person";

export interface SearchCriteria {
  projectType: ProjectType;
  roleCategory: string;
  minYearsOfExperience: string;
  workMode: WorkMode;
  city: string;
  collegeName: string;
  desiredSkills: string[];
  desiredInterests: string[];
  ranking: Record<RankingKey, Importance>;
}

export const SEARCH_CRITERIA_KEY = "pm_search_criteria";

const initialCriteria: SearchCriteria = {
  projectType: "college",
  roleCategory: "",
  minYearsOfExperience: "",
  workMode: "remote",
  city: "",
  collegeName: "",
  desiredSkills: [],
  desiredInterests: [],
  ranking: {
    skillsMatch: "High",
    availabilityMatch: "Medium",
    experienceFit: "Medium",
    sharedInterests: "Low",
  },
};

// ─── Page component ───────────────────────────────────────────────────────────

function FindPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SearchCriteria>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(SEARCH_CRITERIA_KEY);
        if (saved) {
          return { ...initialCriteria, ...JSON.parse(saved) };
        }
      } catch {
        // ignore JSON parse error
      }
    }
    return initialCriteria;
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SearchCriteria>(
    key: K,
    value: SearchCriteria[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setRanking(key: RankingKey, value: Importance) {
    setForm((prev) => ({
      ...prev,
      ranking: { ...prev.ranking, [key]: value },
    }));
  }

  const stepError = useMemo(() => {
    if (step === 1) {
      if (!form.roleCategory) return "Please select a role category.";
      if (
        form.minYearsOfExperience.trim() !== "" &&
        (Number.isNaN(Number(form.minYearsOfExperience)) ||
          Number(form.minYearsOfExperience) < 0)
      )
        return "Years of experience must be a non-negative number.";
    }
    if (step === 2) {
      if (form.workMode === "in-person" && !form.city.trim())
        return "Please enter a city for in-person collaboration.";
    }
    return null;
  }, [step, form]);

  function goNext() {
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleFinish() {
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    sessionStorage.setItem(SEARCH_CRITERIA_KEY, JSON.stringify(form));
    navigate({ to: "/results" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-orange-200">
      <header className="border-b border-orange-200/70 bg-card/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <RetroFlower size={24} color="#EA580C" centerColor="#FDE047" />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              ProjectMatch
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="rounded-full text-foreground/80">
              <Link to="/profile">Profile</Link>
            </Button>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100/70 text-orange-900 border border-orange-200">
              Find teammates
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 relative">
        <div className="absolute -top-4 right-2 opacity-60 pointer-events-none hidden sm:block">
          <RetroSparkle size={24} color="#F59E0B" />
        </div>

        {/* ── Floral Step Progress Bar ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 px-2">
            {STEPS.map((label, i) => {
              const isCompleted = i < step;
              const isCurrent = i === step;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-1.5 text-center">
                  <div className="relative flex items-center justify-center">
                    <RetroFlower
                      size={28}
                      color={isCompleted || isCurrent ? "#EA580C" : "#E2E8F0"}
                      centerColor={isCompleted ? "#10B981" : isCurrent ? "#FBBF24" : "#CBD5E1"}
                      animate={isCurrent}
                    />
                    <span
                      className={`absolute text-[10px] font-bold ${
                        isCompleted || isCurrent ? "text-white" : "text-stone-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "font-bold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-2 rounded-full bg-orange-100/70 overflow-hidden border border-orange-200/50 p-0.5">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>

        <Card className="rounded-3xl border-2 border-orange-200/90 bg-card shadow-lg shadow-orange-950/5 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-2xl font-bold text-foreground">
              {STEPS[step]}
            </CardTitle>
            <CardDescription className="text-xs text-stone-600">
              {step === 0 && "Tell us what kind of project team you are forming."}
              {step === 1 && "What role do you need and how much experience matters?"}
              {step === 2 && "Where and how will your team collaborate?"}
              {step === 3 && "Rank what matters most and specify your desired tech stack."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Step 1 — Project type */}
                {step === 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-700">What are you looking for?</Label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: "college" as const,
                          title: "🎓 College-level",
                          sub: "Hackathons, campus projects, and student competitions",
                        },
                        {
                          value: "industry" as const,
                          title: "💼 Industry-level",
                          sub: "Professional ventures, startup prototypes, open-source",
                        },
                      ].map(({ value, title, sub }) => (
                        <motion.button
                          key={value}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => set("projectType", value)}
                          className={`rounded-2xl border-2 p-4 text-left transition-all ${
                            form.projectType === value
                              ? "border-primary bg-orange-50/80 shadow-xs ring-2 ring-primary/20"
                              : "border-orange-200 bg-white/60 hover:border-orange-300"
                          }`}
                        >
                          <p className="font-heading text-base font-bold text-foreground">{title}</p>
                          <p className="mt-1 text-xs text-stone-600 leading-relaxed">{sub}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2 — Role & experience */}
                {step === 1 && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-stone-700">Role needed</Label>
                      <Select value={form.roleCategory} onValueChange={(v) => set("roleCategory", v)}>
                        <SelectTrigger className="rounded-xl border-orange-200 bg-white/70">
                          <SelectValue placeholder="Select a role category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-orange-200">
                          {ROLE_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="min-yoe" className="text-xs font-semibold text-stone-700">
                        Minimum years of experience{" "}
                        <span className="text-[11px] font-normal text-stone-500">(optional)</span>
                      </Label>
                      <Input
                        id="min-yoe"
                        type="number"
                        min={0}
                        value={form.minYearsOfExperience}
                        onChange={(e) => set("minYearsOfExperience", e.target.value)}
                        placeholder="0"
                        className="rounded-xl border-orange-200 bg-white/70"
                      />
                    </div>
                  </>
                )}

                {/* Step 3 — Work setup */}
                {step === 2 && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-stone-700">Work mode needed</Label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(["remote", "in-person"] as const).map((m) => (
                          <motion.button
                            key={m}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => set("workMode", m)}
                            className={`py-3 px-4 rounded-2xl text-xs font-bold border-2 transition-all capitalize text-center ${
                              form.workMode === m
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-orange-200 bg-white/60 text-stone-700 hover:border-orange-300"
                            }`}
                          >
                            {m === "remote" ? "🌐 Remote" : "📍 In-person"}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {form.workMode === "in-person" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs font-semibold text-stone-700">City</Label>
                        <Input
                          id="city"
                          value={form.city}
                          onChange={(e) => set("city", e.target.value)}
                          placeholder="e.g. Bengaluru"
                          className="rounded-xl border-orange-200 bg-white/70"
                        />
                      </div>
                    )}

                    {form.projectType === "college" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="college-filter" className="text-xs font-semibold text-stone-700">
                          College name{" "}
                          <span className="text-[11px] font-normal text-stone-500">
                            (optional — leave blank to match across all colleges)
                          </span>
                        </Label>
                        <Input
                          id="college-filter"
                          value={form.collegeName}
                          onChange={(e) => set("collegeName", e.target.value)}
                          placeholder="e.g. RV College of Engineering"
                          className="rounded-xl border-orange-200 bg-white/70"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Step 4 — Importance ranking & desired skills/interests */}
                {step === 3 && (
                  <>
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="h-4 w-4 text-primary" />
                        <Label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                          Rank what matters most
                        </Label>
                      </div>

                      <div className="space-y-2.5">
                        {RANKING_FACTORS.map(({ key, label, description }) => (
                          <div
                            key={key}
                            className="space-y-2 rounded-2xl border border-orange-200 bg-orange-50/40 p-3.5"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-foreground">{label}</p>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-200/80 text-orange-950">
                                {form.ranking[key]} Priority
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-600 leading-tight">{description}</p>
                            
                            {/* Tactile Segmented Ranking Buttons */}
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {IMPORTANCE_LEVELS.map((level) => {
                                const isSelected = form.ranking[key] === level;
                                return (
                                  <motion.button
                                    key={level}
                                    type="button"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => setRanking(key, level)}
                                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all text-center ${
                                      isSelected
                                        ? level === "High"
                                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                          : level === "Medium"
                                            ? "border-amber-400 bg-amber-400 text-amber-950 shadow-xs"
                                            : "border-stone-400 bg-stone-200 text-stone-800 shadow-xs"
                                        : "border-orange-200 bg-white/70 text-stone-600 hover:border-orange-300"
                                    }`}
                                  >
                                    {level}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-orange-100 pt-4 space-y-4">
                      <TagInput
                        label="Desired skills"
                        hint="Optional — used for AI semantic compatibility matching"
                        placeholder="e.g. React, Python"
                        tags={form.desiredSkills}
                        suggestions={SKILL_SUGGESTIONS}
                        onChange={(tags) => set("desiredSkills", tags)}
                      />

                      <TagInput
                        label="Desired interests & domains"
                        hint="Optional — project topics for shared interest score"
                        placeholder="e.g. FinTech, AI/ML"
                        tags={form.desiredInterests}
                        suggestions={INTEREST_SUGGESTIONS}
                        onChange={(tags) => set("desiredInterests", tags)}
                      />
                    </div>
                  </>
                )}

                {/* Error banner */}
                {error && (
                  <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2 text-xs text-destructive">
                    {error}
                  </p>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-3 border-t border-orange-100">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      disabled={step === 0}
                      className="rounded-full border-orange-200 hover:bg-orange-50 px-5"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      Back
                    </Button>
                  </motion.div>

                  {step < STEPS.length - 1 ? (
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <Button
                        type="button"
                        onClick={goNext}
                        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm"
                      >
                        Next
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <Button
                        type="button"
                        onClick={handleFinish}
                        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-7 shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Find teammates ✨
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ─── TagInput ─────────────────────────────────────────────────────────────────

function TagInput({
  label,
  hint,
  placeholder,
  tags,
  suggestions,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}) {
  const [value, setValue] = useState("");

  const remaining = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()),
  );

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...tags, tag]);
    setValue("");
  }

  return (
    <div className="space-y-1.5">
      <div>
        <Label className="text-xs font-semibold text-stone-700">{label}</Label>
        {hint && <p className="text-[11px] text-stone-500">{hint}</p>}
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(value);
          }
        }}
        placeholder={placeholder}
        className="rounded-xl border-orange-200 bg-white/70 focus-visible:ring-orange-500"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 rounded-full px-3 py-0.5 text-xs bg-orange-100 text-orange-950 border border-orange-200 font-medium"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="ml-0.5 text-orange-600 hover:text-orange-900 font-bold"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {remaining.map((s) => (
            <motion.button
              key={s}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addTag(s)}
              className="rounded-full border border-dashed border-orange-300 bg-orange-50/50 px-2.5 py-0.5 text-xs text-stone-600 hover:border-primary hover:text-primary transition-colors"
            >
              + {s}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

