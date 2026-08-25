import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile setup — ProjectMatch" },
      {
        name: "description",
        content:
          "Set up your ProjectMatch profile to find students and industry professionals for your next project.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfileWizardPage,
});

const STEPS = ["Basics", "Details", "Skills & interests", "Preferences"];

const ROLE_CATEGORIES = ["Developer", "Designer", "Data/ML", "Product", "Other"];
const YEARS_OF_STUDY = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Postgraduate",
];
const AVAILABILITY_OPTIONS = [
  "Full-time",
  "Part-time <10hrs/week",
  "Weekends only",
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

type UserType = "student" | "industry";
type WorkMode = "remote" | "in-person";

interface WizardState {
  name: string;
  email: string;
  userType: UserType;
  collegeName: string;
  branch: string;
  yearOfStudy: string;
  currentRole: string;
  yearsOfExperience: string;
  company: string;
  roleCategory: string;
  skills: string[];
  interests: string[];
  availability: string;
  workMode: WorkMode;
  city: string;
}

const initialState: WizardState = {
  name: "",
  email: "",
  userType: "student",
  collegeName: "",
  branch: "",
  yearOfStudy: "",
  currentRole: "",
  yearsOfExperience: "",
  company: "",
  roleCategory: "",
  skills: [],
  interests: [],
  availability: "",
  workMode: "remote",
  city: "",
};

function ProfileWizardPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext() as unknown as {
    user: { id: string; email?: string };
  };

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        setForm({
          name: data.name ?? "",
          email: data.email ?? user.email ?? "",
          userType: (data.user_type as UserType) ?? "student",
          collegeName: data.college_name ?? "",
          branch: data.branch ?? "",
          yearOfStudy: data.year_of_study ?? "",
          currentRole: data.current_role ?? "",
          yearsOfExperience:
            data.years_of_experience != null
              ? String(data.years_of_experience)
              : "",
          company: data.company ?? "",
          roleCategory: data.role_category ?? "",
          skills: data.skills ?? [],
          interests: data.interests ?? [],
          availability: data.availability ?? "",
          workMode: (data.work_mode as WorkMode) ?? "remote",
          city: data.city ?? "",
        });
      } else {
        setForm((prev) => ({
          ...prev,
          email: user.email ?? "",
        }));
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user.id, user.email]);

  function set<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const stepError = useMemo(() => {
    if (step === 0) {
      if (!form.name.trim()) return "Please enter your name.";
      if (!form.email.trim()) return "Please enter your email.";
    }
    if (step === 1) {
      if (form.userType === "student") {
        if (!form.collegeName.trim()) return "Please enter your college name.";
        if (!form.branch.trim()) return "Please enter your branch / major.";
        if (!form.yearOfStudy) return "Please select your year of study.";
      } else {
        if (!form.currentRole.trim()) return "Please enter your current role.";
        if (
          form.yearsOfExperience.trim() === "" ||
          Number.isNaN(Number(form.yearsOfExperience)) ||
          Number(form.yearsOfExperience) < 0
        )
          return "Please enter a valid number of years of experience.";
      }
      if (!form.roleCategory) return "Please select a role category.";
    }
    if (step === 2) {
      if (form.skills.length === 0) return "Please add at least one skill.";
    }
    if (step === 3) {
      if (!form.availability) return "Please select your availability.";
      if (form.workMode === "in-person" && !form.city.trim())
        return "Please enter your city for in-person collaboration.";
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

  async function handleSubmit() {
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      email: form.email.trim(),
      user_type: form.userType,
      college_name: form.userType === "student" ? form.collegeName.trim() : null,
      branch: form.userType === "student" ? form.branch.trim() : null,
      year_of_study: form.userType === "student" ? form.yearOfStudy : null,
      current_role: form.userType === "industry" ? form.currentRole.trim() : null,
      years_of_experience:
        form.userType === "industry" && form.yearsOfExperience.trim() !== ""
          ? Number(form.yearsOfExperience)
          : null,
      company:
        form.userType === "industry" && form.company.trim()
          ? form.company.trim()
          : null,
      role_category: form.roleCategory || null,
      skills: form.skills,
      interests: form.interests,
      availability: form.availability || null,
      work_mode: form.workMode,
      city: form.workMode === "in-person" && form.city.trim() ? form.city.trim() : null,
    };

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error: saveError } = existing
      ? await supabase.from("profiles").update(payload).eq("user_id", user.id)
      : await supabase.from("profiles").insert(payload);

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    navigate({ to: "/" });
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
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100/70 text-orange-900 border border-orange-200">
            Profile setup
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 relative">
        <div className="absolute -top-4 right-2 opacity-60 pointer-events-none hidden sm:block">
          <RetroSparkle size={24} color="#F59E0B" />
        </div>

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
              {step === 0 && "Tell us who you are so collaborators can identify you."}
              {step === 1 && "Share what you study or build in industry."}
              {step === 2 && "Add your tech stack and domain interests for smart matching."}
              {step === 3 && "Specify how and when you prefer to collaborate on projects."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-xs text-stone-500">
                <Sparkles className="h-4 w-4 animate-spin mx-auto mb-2 text-primary" />
                Loading your profile details...
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {step === 0 && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-semibold text-stone-700">
                          Full name
                        </Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Asha Rao"
                          className="rounded-xl border-orange-200 bg-white/70 focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                          Email address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          placeholder="you@example.com"
                          className="rounded-xl border-orange-200 bg-white/70 focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-semibold text-stone-700">I am a</Label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {(["student", "industry"] as const).map((t) => (
                            <motion.button
                              key={t}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => set("userType", t)}
                              className={`py-3 px-4 rounded-2xl text-xs font-bold border-2 transition-all capitalize text-center ${
                                form.userType === t
                                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                  : "border-orange-200 bg-white/60 text-stone-700 hover:border-orange-300"
                              }`}
                            >
                              {t === "student" ? "🎓 Student" : "💼 Industry Builder"}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      {form.userType === "student" ? (
                        <>
                          <div className="space-y-1.5">
                            <Label htmlFor="college" className="text-xs font-semibold text-stone-700">
                              College / University name
                            </Label>
                            <Input
                              id="college"
                              value={form.collegeName}
                              onChange={(e) => set("collegeName", e.target.value)}
                              placeholder="e.g. RV College of Engineering"
                              className="rounded-xl border-orange-200 bg-white/70"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="branch" className="text-xs font-semibold text-stone-700">
                              Branch / Major
                            </Label>
                            <Input
                              id="branch"
                              value={form.branch}
                              onChange={(e) => set("branch", e.target.value)}
                              placeholder="e.g. Computer Science"
                              className="rounded-xl border-orange-200 bg-white/70"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-stone-700">
                              Year of study
                            </Label>
                            <Select
                              value={form.yearOfStudy}
                              onValueChange={(v) => set("yearOfStudy", v)}
                            >
                              <SelectTrigger className="rounded-xl border-orange-200 bg-white/70">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-orange-200">
                                {YEARS_OF_STUDY.map((y) => (
                                  <SelectItem key={y} value={y}>
                                    {y}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <Label htmlFor="role" className="text-xs font-semibold text-stone-700">
                              Current role
                            </Label>
                            <Input
                              id="role"
                              value={form.currentRole}
                              onChange={(e) => set("currentRole", e.target.value)}
                              placeholder="e.g. Frontend Engineer"
                              className="rounded-xl border-orange-200 bg-white/70"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="yoe" className="text-xs font-semibold text-stone-700">
                              Years of experience
                            </Label>
                            <Input
                              id="yoe"
                              type="number"
                              min={0}
                              value={form.yearsOfExperience}
                              onChange={(e) => set("yearsOfExperience", e.target.value)}
                              placeholder="e.g. 3"
                              className="rounded-xl border-orange-200 bg-white/70"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="company" className="text-xs font-semibold text-stone-700">
                              Company / Organization{" "}
                              <span className="text-[11px] font-normal text-stone-500">
                                (optional)
                              </span>
                            </Label>
                            <Input
                              id="company"
                              value={form.company}
                              onChange={(e) => set("company", e.target.value)}
                              placeholder="e.g. Stripe, Independent"
                              className="rounded-xl border-orange-200 bg-white/70"
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-stone-700">
                          Role category
                        </Label>
                        <Select
                          value={form.roleCategory}
                          onValueChange={(v) => set("roleCategory", v)}
                        >
                          <SelectTrigger className="rounded-xl border-orange-200 bg-white/70">
                            <SelectValue placeholder="Select primary role" />
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
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <TagInput
                        label="Skills"
                        placeholder="Type a skill and press Enter"
                        tags={form.skills}
                        suggestions={SKILL_SUGGESTIONS}
                        onChange={(tags) => set("skills", tags)}
                      />

                      <div className="pt-2">
                        <TagInput
                          label="Interests & Domains"
                          placeholder="Type an interest and press Enter"
                          tags={form.interests}
                          suggestions={INTEREST_SUGGESTIONS}
                          onChange={(tags) => set("interests", tags)}
                        />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-stone-700">
                          Availability
                        </Label>
                        <Select
                          value={form.availability}
                          onValueChange={(v) => set("availability", v)}
                        >
                          <SelectTrigger className="rounded-xl border-orange-200 bg-white/70">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-orange-200">
                            {AVAILABILITY_OPTIONS.map((a) => (
                              <SelectItem key={a} value={a}>
                                {a}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-semibold text-stone-700">
                          Preferred work mode
                        </Label>
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
                          <Label htmlFor="city" className="text-xs font-semibold text-stone-700">
                            City
                          </Label>
                          <Input
                            id="city"
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                            placeholder="e.g. Bengaluru"
                            className="rounded-xl border-orange-200 bg-white/70"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {error && (
                    <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2 text-xs text-destructive">
                      {error}
                    </p>
                  )}

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
                          onClick={handleSubmit}
                          disabled={saving}
                          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-7 shadow-sm"
                        >
                          {saving ? "Saving…" : "Save profile ✨"}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TagInput({
  label,
  placeholder,
  tags,
  suggestions,
  onChange,
}: {
  label: string;
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
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-stone-700">{label}</Label>
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
