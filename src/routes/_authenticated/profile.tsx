import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — ProjectMatch" },
      {
        name: "description",
        content:
          "Set up your ProjectMatch profile so teammates can find you by skills, interests, and availability.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfileWizardPage,
});

const STEPS = ["Basics", "Details", "Skills & interests", "Work preferences"];

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
  const { user } = Route.useRouteContext() as unknown as {
    user: { id: string; email?: string };
  };
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from auth + any existing profile row
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setForm((prev) => ({
        ...prev,
        name: data?.name ?? "",
        email: data?.email ?? user.email ?? "",
        userType: (data?.user_type as UserType) ?? prev.userType,
        collegeName: data?.college_name ?? "",
        branch: data?.branch ?? "",
        yearOfStudy: data?.year_of_study ?? "",
        currentRole: data?.current_role ?? "",
        yearsOfExperience:
          data?.years_of_experience != null ? String(data.years_of_experience) : "",
        company: data?.company ?? "",
        roleCategory: data?.role_category ?? "",
        skills: data?.skills ?? [],
        interests: data?.interests ?? [],
        availability: data?.availability ?? "",
        workMode: (data?.work_mode as WorkMode) ?? "remote",
        city: data?.city ?? "",
      }));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id, user.email]);

  function set<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const stepError = useMemo(() => {
    if (step === 0) {
      if (!form.name.trim()) return "Please enter your full name.";
      if (!form.email.trim()) return "Please enter your email.";
    }
    if (step === 1) {
      if (form.userType === "student") {
        if (!form.collegeName.trim()) return "Please enter your college name.";
        if (!form.branch.trim()) return "Please enter your branch.";
        if (!form.yearOfStudy) return "Please select your year of study.";
      } else {
        if (!form.currentRole.trim()) return "Please enter your current role.";
        if (
          form.yearsOfExperience.trim() === "" ||
          Number.isNaN(Number(form.yearsOfExperience)) ||
          Number(form.yearsOfExperience) < 0
        )
          return "Please enter your years of experience.";
      }
      if (!form.roleCategory) return "Please select a role category.";
    }
    if (step === 3) {
      if (!form.availability) return "Please select your availability.";
      if (form.workMode === "in-person" && !form.city.trim())
        return "Please enter your city.";
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
      college_name:
        form.userType === "student" ? form.collegeName.trim() || null : null,
      branch: form.userType === "student" ? form.branch.trim() || null : null,
      year_of_study:
        form.userType === "student" ? form.yearOfStudy || null : null,
      current_role:
        form.userType === "industry" ? form.currentRole.trim() || null : null,
      years_of_experience:
        form.userType === "industry" && form.yearsOfExperience.trim() !== ""
          ? Number(form.yearsOfExperience)
          : null,
      company:
        form.userType === "industry" ? form.company.trim() || null : null,
      role_category: form.roleCategory || null,
      skills: form.skills,
      interests: form.interests,
      availability: form.availability || null,
      work_mode: form.workMode,
      city: form.workMode === "in-person" ? form.city.trim() || null : null,
    };

    // Insert if new, update if a profile already exists for this user
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            ProjectMatch
          </Link>
          <span className="text-sm text-muted-foreground">Profile setup</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        {/* Progress indicator */}
        <ol className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col gap-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
              <span
                className={`text-xs ${
                  i === step
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {i + 1}. {label}
              </span>
            </li>
          ))}
        </ol>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{STEPS[step]}</CardTitle>
            <CardDescription>
              {step === 0 && "Tell us who you are."}
              {step === 1 && "A few details about what you do."}
              {step === 2 && "What you're good at and what you care about."}
              {step === 3 && "How and when you like to work."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="space-y-4">
                {step === 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Asha Rao"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>I am a</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["student", "industry"] as const).map((t) => (
                          <Button
                            key={t}
                            type="button"
                            variant={form.userType === t ? "default" : "outline"}
                            onClick={() => set("userType", t)}
                          >
                            {t === "student" ? "Student" : "Industry"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    {form.userType === "student" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="college">College name</Label>
                          <Input
                            id="college"
                            value={form.collegeName}
                            onChange={(e) => set("collegeName", e.target.value)}
                            placeholder="RV College of Engineering"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branch">Branch</Label>
                          <Input
                            id="branch"
                            value={form.branch}
                            onChange={(e) => set("branch", e.target.value)}
                            placeholder="Computer Science"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Year of study</Label>
                          <Select
                            value={form.yearOfStudy}
                            onValueChange={(v) => set("yearOfStudy", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
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
                        <div className="space-y-2">
                          <Label htmlFor="role">Current role</Label>
                          <Input
                            id="role"
                            value={form.currentRole}
                            onChange={(e) => set("currentRole", e.target.value)}
                            placeholder="Senior Software Engineer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yoe">Years of experience</Label>
                          <Input
                            id="yoe"
                            type="number"
                            min={0}
                            value={form.yearsOfExperience}
                            onChange={(e) =>
                              set("yearsOfExperience", e.target.value)
                            }
                            placeholder="5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company (optional)</Label>
                          <Input
                            id="company"
                            value={form.company}
                            onChange={(e) => set("company", e.target.value)}
                            placeholder="Acme Corp"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label>Role category</Label>
                      <Select
                        value={form.roleCategory}
                        onValueChange={(v) => set("roleCategory", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
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
                    <TagInput
                      label="Interests"
                      placeholder="Type an interest and press Enter"
                      tags={form.interests}
                      suggestions={INTEREST_SUGGESTIONS}
                      onChange={(tags) => set("interests", tags)}
                    />
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Select
                        value={form.availability}
                        onValueChange={(v) => set("availability", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Work mode</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["remote", "in-person"] as const).map((m) => (
                          <Button
                            key={m}
                            type="button"
                            variant={form.workMode === m ? "default" : "outline"}
                            onClick={() => set("workMode", m)}
                          >
                            {m === "remote" ? "Remote" : "In-person"}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {form.workMode === "in-person" && (
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={form.city}
                          onChange={(e) => set("city", e.target.value)}
                          placeholder="Bengaluru"
                        />
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={step === 0 || saving}
                  >
                    Back
                  </Button>
                  {step < STEPS.length - 1 ? (
                    <Button type="button" onClick={goNext}>
                      Next
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleSubmit} disabled={saving}>
                      {saving ? "Saving…" : "Save profile"}
                    </Button>
                  )}
                </div>
              </div>
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
      <Label>{label}</Label>
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
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-dashed border-input px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
